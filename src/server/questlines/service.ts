/**
 * Questlines: dependency paths of Quests. Nodes start AVAILABLE (not yet
 * accepted); whether they are locked is derived from dependencies and
 * requirements at read time. Accepting a node snapshots its rewards then.
 */

import { and, eq, inArray } from "drizzle-orm";
import { MAIN_QUEST_CAP } from "@/game/config/balance";
import { GameRuleError } from "@/game/errors";
import { assertAcyclic } from "@/game/questlines";
import {
  ACTIVE_QUEST_STATUSES,
  assertMainQuestCapacity,
  normalizeDate,
  assertDateOrder,
  QuestRuleError,
  rewardsFor,
  validateQuestDraft,
  type QuestDraftInput,
  type QuestPriority,
} from "@/game/quests";
import { validateRequirementInput, type RequirementInput } from "@/game/requirements";
import { isSkillKey } from "@/game/vocabulary";
import type { Db } from "../db/client";
import { activityEvents, questDependencies, questObjectives, questRequirements, questlines, quests } from "../db/schema";
import { buildRequirementContext, lockStates } from "../requirements/service";

export const QUESTLINE_MAX_NODES = 20;

export type QuestlineNodeInput = Omit<QuestDraftInput, "priority" | "targetDate" | "deadline" | "notes"> & {
  key: string;
  parents?: string[];
  requirements?: RequirementInput[];
};

export type QuestlineInput = {
  title: string;
  description?: string;
  skillKey: string;
  nodes: QuestlineNodeInput[];
};

export async function createQuestline(db: Db, characterId: string, input: QuestlineInput) {
  const title = input.title.trim();
  if (!title) throw new QuestRuleError("Every Questline needs a name.", "TITLE_REQUIRED");
  if (title.length > 120) throw new QuestRuleError("Questline names must be 120 characters or fewer.", "TITLE_TOO_LONG");
  if (!isSkillKey(input.skillKey)) throw new QuestRuleError("Choose the Skill that receives the Questline bonus.", "INVALID_SKILL");
  if (input.nodes.length === 0) throw new QuestRuleError("Add at least one Quest to the Questline.", "NO_NODES");
  if (input.nodes.length > QUESTLINE_MAX_NODES) throw new QuestRuleError(`A Questline can hold up to ${QUESTLINE_MAX_NODES} Quests.`, "TOO_MANY_NODES");
  const keys = input.nodes.map((n) => n.key);
  if (new Set(keys).size !== keys.length) throw new QuestRuleError("Each Quest in a Questline needs a unique key.", "DUPLICATE_KEY");
  const drafts = input.nodes.map((n) => ({ node: n, draft: validateQuestDraft({ ...n, priority: "SIDE" }) }));
  const edges = input.nodes.flatMap((n) => (n.parents ?? []).map((p) => ({ parent: p, child: n.key })));
  assertAcyclic(keys, edges);
  const requirements = input.nodes.map((n) => (n.requirements ?? []).map((r) => validateRequirementInput(r, isSkillKey)));

  return db.transaction(async (tx) => {
    const [questline] = await tx
      .insert(questlines)
      .values({ characterId, title, description: (input.description ?? "").trim(), skillKey: input.skillKey })
      .returning();
    const idByKey = new Map<string, string>();
    const base = Date.now();
    for (const [i, { draft }] of drafts.entries()) {
      const reward = rewardsFor(draft.difficulty);
      const [q] = await tx
        .insert(quests)
        .values({
          characterId,
          questlineId: questline.id,
          title: draft.title,
          description: draft.description,
          skillKey: draft.skillKey,
          difficulty: draft.difficulty,
          status: "AVAILABLE",
          rewardXp: reward.xp,
          rewardGp: reward.gp,
          rewardQp: reward.qp,
          // Distinct timestamps keep the builder's order stable when listing.
          createdAt: new Date(base + i),
        })
        .returning();
      idByKey.set(input.nodes[i].key, q.id);
      if (draft.objectives.length) {
        await tx.insert(questObjectives).values(draft.objectives.map((t, j) => ({ questId: q.id, title: t, position: j + 1 })));
      }
      if (requirements[i].length) {
        await tx.insert(questRequirements).values(requirements[i].map((r) => ({ questId: q.id, ...r })));
      }
    }
    if (edges.length) {
      await tx
        .insert(questDependencies)
        .values(edges.map((e) => ({ parentQuestId: idByKey.get(e.parent)!, childQuestId: idByKey.get(e.child)! })));
    }
    await tx.insert(activityEvents).values({ characterId, type: "QUESTLINE_STARTED", entityId: questline.id, payload: { title } });
    return { questline, questIds: keys.map((k) => idByKey.get(k)!) };
  });
}

/**
 * Accept a Questline Quest once it is unlocked. Rewards are snapshotted at
 * acceptance, like any Quest.
 */
export async function acceptQuestlineQuest(
  db: Db,
  characterId: string,
  questId: string,
  options: { today: string; targetDate?: string | null; deadline?: string | null; priority?: QuestPriority },
) {
  const targetDate = normalizeDate(options.targetDate, "Target date");
  const deadline = normalizeDate(options.deadline, "Hard deadline");
  assertDateOrder(targetDate, deadline);
  return db.transaction(async (tx) => {
    const [quest] = await tx
      .select()
      .from(quests)
      .where(and(eq(quests.id, questId), eq(quests.characterId, characterId)))
      .for("update");
    if (!quest) throw new GameRuleError("That Quest could not be found.", "QUEST_NOT_FOUND");
    if (quest.status !== "AVAILABLE") throw new QuestRuleError("This Quest has already been accepted.", "ALREADY_ACCEPTED");
    const ctx = await buildRequirementContext(tx, characterId, options.today);
    const state = (await lockStates(tx, characterId, [questId], ctx)).get(questId)!;
    if (state.locked) {
      const unmet = [
        ...state.dependencies.filter((d) => !d.met).map((d) => `complete “${d.title}”`),
        ...state.requirements.filter((r) => !r.met).map((r) => r.description),
      ];
      throw new QuestRuleError(`This Quest is locked. Requirements: ${unmet.join("; ")}.`, "QUEST_LOCKED");
    }
    if (options.priority === "MAIN") {
      const mains = await tx
        .select({ id: quests.id })
        .from(quests)
        .where(and(eq(quests.characterId, characterId), eq(quests.priority, "MAIN"), inArray(quests.status, [...ACTIVE_QUEST_STATUSES])));
      assertMainQuestCapacity(mains.length, MAIN_QUEST_CAP);
    }
    const reward = rewardsFor(quest.difficulty as never);
    const now = new Date();
    const [updated] = await tx
      .update(quests)
      .set({
        status: "ACCEPTED",
        acceptedAt: now,
        updatedAt: now,
        rewardXp: reward.xp,
        rewardGp: reward.gp,
        rewardQp: reward.qp,
        targetDate,
        deadline,
        priority: options.priority === "MAIN" ? "MAIN" : "SIDE",
      })
      .where(eq(quests.id, questId))
      .returning();
    await tx.insert(activityEvents).values({ characterId, type: "QUEST_ACCEPTED", entityId: questId, payload: { title: quest.title, difficulty: quest.difficulty } });
    return updated;
  });
}

export async function archiveQuestline(db: Db, characterId: string, questlineId: string) {
  const updated = await db
    .update(questlines)
    .set({ status: "ARCHIVED" })
    .where(and(eq(questlines.id, questlineId), eq(questlines.characterId, characterId), eq(questlines.status, "ACTIVE")))
    .returning();
  if (!updated.length) throw new QuestRuleError("Only an active Questline can be archived.", "QUESTLINE_NOT_ACTIVE");
}
