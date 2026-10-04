/**
 * Quest service — acceptance, objectives, status changes, and completion.
 * All Quest mutations go through here; every function verifies the Quest
 * belongs to the character and runs in a transaction.
 */

import { and, asc, eq, inArray, max, sql } from "drizzle-orm";
import type { QuestReward } from "@/game/config/balance";
import { totalLevel } from "@/game/character";
import { GameRuleError } from "@/game/errors";
import {
  activeStatusFor,
  ACTIVE_QUEST_STATUSES,
  assertCanPerform,
  assertDateOrder,
  assertMainQuestCapacity,
  normalizeDate,
  normalizeObjectives,
  normalizeTitle,
  LIMITS,
  questProgress,
  QuestRuleError,
  rewardsFor,
  validateQuestDraft,
  type QuestDraftInput,
  type QuestPriority,
  type QuestStatus,
} from "@/game/quests";
import type { QuestDifficulty, SkillKey } from "@/game/vocabulary";
import { applyXpGain } from "@/game/xp";
import type { Db } from "../db/client";
import {
  activityEvents,
  characterSkills,
  characters,
  questObjectives,
  questTemplates,
  quests,
  type QuestRow,
} from "../db/schema";
import { recordProgression } from "../progression/service";
import { buildRequirementContext, trustedLocalDate } from "../requirements/service";
import { onQuestCompleted, type LevelUpInfo, type PipelineResult } from "./pipeline";
import { loadBalance } from "../settings/service";
import { recordActivity } from "../streaks/service";
import { recordDateChange } from "./history";

export class QuestNotFoundError extends GameRuleError {
  constructor() {
    super("That Quest could not be found.", "QUEST_NOT_FOUND");
  }
}

type Balance = Readonly<Record<QuestDifficulty, QuestReward>>;

async function lockQuest(db: Db, characterId: string, questId: string): Promise<QuestRow> {
  const [row] = await db
    .select()
    .from(quests)
    .where(and(eq(quests.id, questId), eq(quests.characterId, characterId)))
    .for("update");
  if (!row) throw new QuestNotFoundError();
  return row;
}

async function objectivesOf(db: Db, questId: string) {
  return db.select().from(questObjectives).where(eq(questObjectives.questId, questId)).orderBy(asc(questObjectives.position));
}

async function logEvent(db: Db, characterId: string, type: string, questId: string, payload: Record<string, unknown> = {}) {
  await db.insert(activityEvents).values({ characterId, type, entityId: questId, payload });
}

async function activeMainCount(db: Db, characterId: string, excludeQuestId?: string): Promise<number> {
  const rows = await db
    .select({ id: quests.id })
    .from(quests)
    .where(
      and(
        eq(quests.characterId, characterId),
        eq(quests.priority, "MAIN"),
        inArray(quests.status, [...ACTIVE_QUEST_STATUSES]),
      ),
    );
  return rows.filter((r) => r.id !== excludeQuestId).length;
}

// ---------------------------------------------------------------------------
// Acceptance
// ---------------------------------------------------------------------------

/**
 * Create & Accept a Quest. Rewards are derived from difficulty and
 * snapshotted now; later balance changes never alter them.
 */
export async function createQuest(
  db: Db,
  characterId: string,
  input: QuestDraftInput & { templateKey?: string | null },
  balance?: Balance,
): Promise<QuestRow> {
  const draft = validateQuestDraft(input);
  return db.transaction(async (tx) => {
    const live = await loadBalance(tx, characterId);
    const reward = rewardsFor(draft.difficulty, balance ?? live.questRewards);
    if (draft.priority === "MAIN") assertMainQuestCapacity(await activeMainCount(tx, characterId), live.mainQuestCap);
    const now = new Date();
    const [quest] = await tx
      .insert(quests)
      .values({
        characterId,
        templateKey: input.templateKey ?? null,
        title: draft.title,
        description: draft.description,
        skillKey: draft.skillKey,
        difficulty: draft.difficulty,
        status: "ACCEPTED",
        priority: draft.priority,
        targetDate: draft.targetDate,
        deadline: draft.deadline,
        rewardXp: reward.xp,
        rewardGp: reward.gp,
        rewardQp: reward.qp,
        notes: draft.notes,
        acceptedAt: now,
        updatedAt: now,
      })
      .returning();
    if (draft.objectives.length) {
      await tx
        .insert(questObjectives)
        .values(draft.objectives.map((title, i) => ({ questId: quest.id, title, position: i + 1 })));
    }
    await logEvent(tx, characterId, "QUEST_ACCEPTED", quest.id, { title: quest.title, difficulty: quest.difficulty });
    return quest;
  });
}

/** Accept a Quest Board template. Each acceptance is a new, independent Quest. */
export async function acceptTemplate(
  db: Db,
  characterId: string,
  templateKey: string,
  options: { targetDate?: string | null; deadline?: string | null; priority?: QuestPriority } = {},
  balance?: Balance,
): Promise<QuestRow> {
  const [template] = await db.select().from(questTemplates).where(eq(questTemplates.key, templateKey));
  if (!template) throw new QuestRuleError("That Quest is no longer on the board.", "TEMPLATE_NOT_FOUND");
  if (template.isCustom || !template.skillKey || !template.difficulty) {
    throw new QuestRuleError("Custom Quests are written in Create Quest.", "TEMPLATE_IS_CUSTOM");
  }
  return createQuest(
    db,
    characterId,
    {
      title: template.title,
      description: template.description,
      skillKey: template.skillKey,
      difficulty: template.difficulty,
      objectives: template.objectives as string[],
      targetDate: options.targetDate,
      deadline: options.deadline,
      priority: options.priority,
      templateKey,
    },
    balance,
  );
}

// ---------------------------------------------------------------------------
// Objectives (they advance progress; they never award XP on their own)
// ---------------------------------------------------------------------------

export async function setObjectiveDone(
  db: Db,
  characterId: string,
  questId: string,
  objectiveId: string,
  done: boolean,
  options: { localDate?: string | null; now?: Date } = {},
) {
  return db.transaction(async (tx) => {
    const quest = await lockQuest(tx, characterId, questId);
    assertCanPerform("COMPLETE_OBJECTIVE", quest.status as QuestStatus);
    const updated = await tx
      .update(questObjectives)
      .set({ completedAt: done ? new Date() : null })
      .where(and(eq(questObjectives.id, objectiveId), eq(questObjectives.questId, questId)))
      .returning();
    if (!updated.length) throw new QuestRuleError("That objective could not be found.", "OBJECTIVE_NOT_FOUND");
    const progress = questProgress(await objectivesOf(tx, questId));
    const status = progress.done > 0 ? "IN_PROGRESS" : quest.status === "IN_PROGRESS" ? "IN_PROGRESS" : "ACCEPTED";
    await tx.update(quests).set({ status, updatedAt: new Date() }).where(eq(quests.id, questId));
    if (done) {
      await logEvent(tx, characterId, "QUEST_OBJECTIVE_COMPLETED", questId, { objectiveId, title: updated[0].title });
      await recordActivity(tx, characterId, trustedLocalDate(options.localDate, options.now));
    }
    return progress;
  });
}

export async function addObjective(db: Db, characterId: string, questId: string, title: string) {
  const [clean] = normalizeObjectives([title]);
  if (!clean) throw new QuestRuleError("Give the objective a name.", "OBJECTIVE_REQUIRED");
  return db.transaction(async (tx) => {
    const quest = await lockQuest(tx, characterId, questId);
    assertCanPerform("EDIT", quest.status as QuestStatus);
    const [{ count, top }] = await tx
      .select({ count: sql<number>`count(*)::int`, top: max(questObjectives.position) })
      .from(questObjectives)
      .where(eq(questObjectives.questId, questId));
    if (count >= LIMITS.objectivesMax) {
      throw new QuestRuleError(`A Quest can have at most ${LIMITS.objectivesMax} objectives.`, "TOO_MANY_OBJECTIVES");
    }
    const [objective] = await tx
      .insert(questObjectives)
      .values({ questId, title: clean, position: (top ?? 0) + 1 })
      .returning();
    await tx.update(quests).set({ updatedAt: new Date() }).where(eq(quests.id, questId));
    return objective;
  });
}

export async function removeObjective(db: Db, characterId: string, questId: string, objectiveId: string) {
  return db.transaction(async (tx) => {
    const quest = await lockQuest(tx, characterId, questId);
    assertCanPerform("EDIT", quest.status as QuestStatus);
    const removed = await tx
      .delete(questObjectives)
      .where(and(eq(questObjectives.id, objectiveId), eq(questObjectives.questId, questId)))
      .returning();
    if (!removed.length) throw new QuestRuleError("That objective could not be found.", "OBJECTIVE_NOT_FOUND");
    await tx.update(quests).set({ updatedAt: new Date() }).where(eq(quests.id, questId));
  });
}

/** Move an objective one step up or down in the Quest Journal order. */
export async function moveObjective(
  db: Db,
  characterId: string,
  questId: string,
  objectiveId: string,
  direction: "up" | "down",
) {
  return db.transaction(async (tx) => {
    const quest = await lockQuest(tx, characterId, questId);
    assertCanPerform("EDIT", quest.status as QuestStatus);
    const list = await objectivesOf(tx, questId);
    const i = list.findIndex((o) => o.id === objectiveId);
    if (i < 0) throw new QuestRuleError("That objective could not be found.", "OBJECTIVE_NOT_FOUND");
    const j = direction === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= list.length) return;
    await tx.update(questObjectives).set({ position: list[j].position }).where(eq(questObjectives.id, list[i].id));
    await tx.update(questObjectives).set({ position: list[i].position }).where(eq(questObjectives.id, list[j].id));
  });
}

// ---------------------------------------------------------------------------
// Details & status
// ---------------------------------------------------------------------------

export type QuestDetailsInput = {
  title?: string;
  description?: string;
  targetDate?: string | null;
  deadline?: string | null;
  notes?: string;
  /** Why the dates changed, for the Quest's date history. */
  reason?: "EDIT" | "CONTINUE" | "RESCOPE" | "RESPAWN";
};

/**
 * Edit a Quest's story and dates. Skill and difficulty are fixed at
 * acceptance (the reward snapshot depends on them). Notes stay editable
 * even after completion, as part of the record.
 */
export async function updateQuestDetails(db: Db, characterId: string, questId: string, input: QuestDetailsInput) {
  return db.transaction(async (tx) => {
    const quest = await lockQuest(tx, characterId, questId);
    const onlyNotes = Object.keys(input).every((k) => k === "notes" || k === "reason");
    if (!onlyNotes) assertCanPerform("EDIT", quest.status as QuestStatus);
    const set: Partial<QuestRow> = { updatedAt: new Date() };
    if (input.title !== undefined) set.title = normalizeTitle(input.title);
    if (input.description !== undefined) {
      const d = input.description.trim();
      if (d.length > LIMITS.descriptionMax) throw new QuestRuleError("The description is too long.", "DESCRIPTION_TOO_LONG");
      set.description = d;
    }
    if (input.targetDate !== undefined) set.targetDate = normalizeDate(input.targetDate, "Target date");
    if (input.deadline !== undefined) set.deadline = normalizeDate(input.deadline, "Hard deadline");
    assertDateOrder(
      set.targetDate !== undefined ? set.targetDate : quest.targetDate,
      set.deadline !== undefined ? set.deadline : quest.deadline,
    );
    if (set.targetDate !== undefined) await recordDateChange(tx, questId, "TARGET", quest.targetDate, set.targetDate, input.reason ?? "EDIT");
    if (set.deadline !== undefined) await recordDateChange(tx, questId, "DEADLINE", quest.deadline, set.deadline, input.reason ?? "EDIT");
    if (input.notes !== undefined) {
      if (input.notes.length > LIMITS.notesMax) throw new QuestRuleError("Notes are too long.", "NOTES_TOO_LONG");
      set.notes = input.notes;
    }
    const [updated] = await tx.update(quests).set(set).where(eq(quests.id, questId)).returning();
    return updated;
  });
}

export async function setQuestPriority(db: Db, characterId: string, questId: string, priority: QuestPriority) {
  return db.transaction(async (tx) => {
    const quest = await lockQuest(tx, characterId, questId);
    assertCanPerform("EDIT", quest.status as QuestStatus);
    if (priority === "MAIN" && quest.priority !== "MAIN") {
      assertMainQuestCapacity(await activeMainCount(tx, characterId, questId), (await loadBalance(tx, characterId)).mainQuestCap);
    }
    await tx.update(quests).set({ priority, updatedAt: new Date() }).where(eq(quests.id, questId));
  });
}

async function transition(
  db: Db,
  characterId: string,
  questId: string,
  action: "HOLD" | "RESUME" | "ABANDON" | "RESTORE",
) {
  return db.transaction(async (tx) => {
    const quest = await lockQuest(tx, characterId, questId);
    assertCanPerform(action, quest.status as QuestStatus);
    const now = new Date();
    if (action === "HOLD") {
      await tx.update(quests).set({ status: "ON_HOLD", updatedAt: now }).where(eq(quests.id, questId));
    } else if (action === "ABANDON") {
      // No rewards; history (objectives, dates, notes) is preserved.
      await tx.update(quests).set({ status: "ABANDONED", abandonedAt: now, updatedAt: now }).where(eq(quests.id, questId));
      await logEvent(tx, characterId, "QUEST_ABANDONED", questId, { title: quest.title });
    } else {
      if (action === "RESTORE" && quest.priority === "MAIN") {
        // Restoring must not silently exceed the Main Quest cap.
        const count = await activeMainCount(tx, characterId, questId);
        if (count >= (await loadBalance(tx, characterId)).mainQuestCap) await tx.update(quests).set({ priority: "SIDE" }).where(eq(quests.id, questId));
      }
      const status = activeStatusFor(questProgress(await objectivesOf(tx, questId)));
      await tx
        .update(quests)
        .set({ status, ...(action === "RESTORE" ? { abandonedAt: null } : {}), updatedAt: now })
        .where(eq(quests.id, questId));
      if (action === "RESTORE") await logEvent(tx, characterId, "QUEST_RESTORED", questId, { title: quest.title });
    }
  });
}

export const holdQuest = (db: Db, c: string, q: string) => transition(db, c, q, "HOLD");
export const resumeQuest = (db: Db, c: string, q: string) => transition(db, c, q, "RESUME");
export const abandonQuest = (db: Db, c: string, q: string) => transition(db, c, q, "ABANDON");
export const restoreQuest = (db: Db, c: string, q: string) => transition(db, c, q, "RESTORE");

// ---------------------------------------------------------------------------
// Completion
// ---------------------------------------------------------------------------

export type QuestCompletion = {
  /** True when the Quest was already complete; nothing was awarded again. */
  duplicate: boolean;
  quest: { id: string; title: string; skillKey: SkillKey; difficulty: QuestDifficulty; templateKey: string | null };
  rewards: { xp: number; gp: number; qp: number };
  /** Every Skill that levelled up (the Quest's Skill first, then any bonus). */
  levelUps: LevelUpInfo[];
  boss: PipelineResult["boss"];
  unlocked: PipelineResult["unlocked"];
  questline: PipelineResult["questline"];
  meta: PipelineResult["meta"];
  comeback: PipelineResult["comeback"];
  totals: { totalLevelBefore: number; totalLevelAfter: number; gpBalance: number; questPoints: number };
};

/**
 * Complete a Quest: award its snapshotted XP, GP, and QP exactly once.
 * Re-completing returns the original result with `duplicate: true`.
 */
export async function completeQuest(
  db: Db,
  characterId: string,
  questId: string,
  options: { localDate?: string | null; now?: Date } = {},
): Promise<QuestCompletion> {
  const today = trustedLocalDate(options.localDate, options.now);
  return db.transaction(async (tx) => {
    const quest = await lockQuest(tx, characterId, questId);
    const skillKey = quest.skillKey as SkillKey;
    const summary = {
      id: quest.id,
      title: quest.title,
      skillKey,
      difficulty: quest.difficulty as QuestDifficulty,
      templateKey: quest.templateKey,
    };
    const rewards = { xp: quest.rewardXp, gp: quest.rewardGp, qp: quest.rewardQp };

    const xpRows = await tx.select().from(characterSkills).where(eq(characterSkills.characterId, characterId));
    const xpMap = Object.fromEntries(xpRows.map((r) => [r.skillKey, r.xp]));

    if (quest.status === "COMPLETED") {
      const [c] = await tx.select().from(characters).where(eq(characters.id, characterId));
      const level = totalLevel(xpMap);
      return {
        duplicate: true,
        quest: summary,
        rewards,
        levelUps: [],
        boss: null,
        unlocked: [],
        questline: null,
        meta: { achievements: [], collection: [], titles: [] },
        comeback: null,
        totals: { totalLevelBefore: level, totalLevelAfter: level, gpBalance: c.gpBalance, questPoints: c.questPoints },
      };
    }
    assertCanPerform("COMPLETE", quest.status as QuestStatus);
    const progress = questProgress(await objectivesOf(tx, questId));
    if (!progress.allDone) {
      throw new QuestRuleError(
        `Complete the remaining ${progress.total - progress.done} objective${progress.total - progress.done === 1 ? "" : "s"} first, or remove ones that no longer apply.`,
        "OBJECTIVES_REMAINING",
      );
    }

    const totalLevelBefore = totalLevel(xpMap);
    const ctxBefore = await buildRequirementContext(tx, characterId, today);
    const now = new Date();
    await tx.update(quests).set({ status: "COMPLETED", completedAt: now, completedLocalDate: today, updatedAt: now }).where(eq(quests.id, questId));

    const source = { sourceType: "QUEST" as const, sourceId: questId, metadata: { questTitle: quest.title, difficulty: quest.difficulty } };
    const levelUps: LevelUpInfo[] = [];
    if (rewards.xp > 0) {
      const r = await recordProgression(tx, characterId, {
        kind: "XP",
        skillKey,
        amount: rewards.xp,
        ...source,
        idempotencyKey: `quest:${questId}:xp`,
      });
      if (r.xp?.leveledUp) {
        levelUps.push({ skillKey, fromLevel: r.xp.previousLevel, toLevel: r.xp.newLevel, levelsReached: r.xp.levelsReached });
      }
    }
    if (rewards.gp > 0) {
      await recordProgression(tx, characterId, { kind: "GP", amount: rewards.gp, ...source, idempotencyKey: `quest:${questId}:gp` });
    }
    if (rewards.qp > 0) {
      await recordProgression(tx, characterId, { kind: "QP", amount: rewards.qp, ...source, idempotencyKey: `quest:${questId}:qp` });
    }
    await logEvent(tx, characterId, "QUEST_COMPLETED", questId, { title: quest.title, ...rewards, skillKey });
    await recordActivity(tx, characterId, today);

    const pipeline = await onQuestCompleted(tx, characterId, { ...quest, status: "COMPLETED", completedAt: now }, today, ctxBefore);
    levelUps.push(...pipeline.levelUps);

    const [c] = await tx.select().from(characters).where(eq(characters.id, characterId));
    const afterRows = await tx.select().from(characterSkills).where(eq(characterSkills.characterId, characterId));
    return {
      duplicate: false,
      quest: summary,
      rewards,
      levelUps,
      boss: pipeline.boss,
      unlocked: pipeline.unlocked,
      questline: pipeline.questline,
      meta: pipeline.meta,
      comeback: pipeline.comeback,
      totals: {
        totalLevelBefore,
        totalLevelAfter: totalLevel(Object.fromEntries(afterRows.map((r) => [r.skillKey, r.xp]))),
        gpBalance: c.gpBalance,
        questPoints: c.questPoints,
      },
    };
  });
}

/** Preview the level outcome of completing a Quest (for the Quest Journal). */
export function previewXpOutcome(currentXp: number, rewardXp: number) {
  return rewardXp > 0 ? applyXpGain(currentXp, rewardXp) : null;
}
