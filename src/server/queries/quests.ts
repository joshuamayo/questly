/**
 * Quest read models for the Quest Journal, Active Quest, Quest Board, World,
 * and Character screens.
 */

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { ACTIVE_QUEST_STATUSES, questProgress, type QuestPriority, type QuestProgress, type QuestStatus } from "@/game/quests";
import type { QuestDifficulty, SkillKey } from "@/game/vocabulary";
import { applyXpGain } from "@/game/xp";
import type { Db } from "../db/client";
import { activityEvents, characterSkills, questObjectives, questTemplates, quests, skills } from "../db/schema";
import { QuestNotFoundError } from "../quests/service";

export type QuestSummary = {
  id: string;
  title: string;
  description: string;
  skillKey: SkillKey;
  skillName: string;
  icon: string;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  priority: QuestPriority;
  targetDate: string | null;
  deadline: string | null;
  rewards: { xp: number; gp: number; qp: number };
  progress: QuestProgress;
  currentStep: string | null;
  acceptedAt: string | null;
  completedAt: string | null;
  abandonedAt: string | null;
};

export type QuestObjectiveView = { id: string; title: string; position: number; done: boolean; completedAt: string | null };

export type QuestDetail = QuestSummary & {
  notes: string;
  templateKey: string | null;
  objectives: QuestObjectiveView[];
  activity: { id: string; type: string; text: string; createdAt: string }[];
  /** What completing this Quest would do to its Skill (engine output). */
  xpOutcome: { fromLevel: number; toLevel: number; levelsGained: number } | null;
};


async function loadSummaries(db: Db, rows: (typeof quests.$inferSelect)[]): Promise<QuestSummary[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [objectives, skillRows, templates] = await Promise.all([
    db.select().from(questObjectives).where(inArray(questObjectives.questId, ids)).orderBy(asc(questObjectives.position)),
    db.select({ key: skills.key, name: skills.name, icon: skills.icon }).from(skills),
    db.select({ key: questTemplates.key, icon: questTemplates.icon }).from(questTemplates),
  ]);
  const skillByKey = new Map(skillRows.map((s) => [s.key, s]));
  const templateIcon = new Map(templates.map((t) => [t.key, t.icon]));
  const byQuest = new Map<string, typeof objectives>();
  for (const o of objectives) byQuest.set(o.questId, [...(byQuest.get(o.questId) ?? []), o]);

  return rows.map((q) => {
    const objs = byQuest.get(q.id) ?? [];
    const progress = questProgress(objs);
    const skill = skillByKey.get(q.skillKey);
    return {
      id: q.id,
      title: q.title,
      description: q.description,
      skillKey: q.skillKey as SkillKey,
      skillName: skill?.name ?? q.skillKey,
      icon: (q.templateKey && templateIcon.get(q.templateKey)) || skill?.icon || "quests",
      difficulty: q.difficulty as QuestDifficulty,
      status: q.status as QuestStatus,
      priority: q.priority as QuestPriority,
      targetDate: q.targetDate,
      deadline: q.deadline,
      rewards: { xp: q.rewardXp, gp: q.rewardGp, qp: q.rewardQp },
      progress,
      currentStep: objs.find((o) => o.id === progress.currentObjectiveId)?.title ?? null,
      acceptedAt: q.acceptedAt?.toISOString() ?? null,
      completedAt: q.completedAt?.toISOString() ?? null,
      abandonedAt: q.abandonedAt?.toISOString() ?? null,
    };
  });
}

/** Main Quests first, then nearest target date, then most recently accepted. */
function byAdventurePriority(a: QuestSummary, b: QuestSummary): number {
  if (a.priority !== b.priority) return a.priority === "MAIN" ? -1 : 1;
  if (a.status === "ON_HOLD" && b.status !== "ON_HOLD") return 1;
  if (b.status === "ON_HOLD" && a.status !== "ON_HOLD") return -1;
  if (a.targetDate && b.targetDate && a.targetDate !== b.targetDate) return a.targetDate < b.targetDate ? -1 : 1;
  if (a.targetDate && !b.targetDate) return -1;
  if (!a.targetDate && b.targetDate) return 1;
  return (b.acceptedAt ?? "").localeCompare(a.acceptedAt ?? "");
}

export type JournalView = "active" | "completed" | "abandoned";

export async function listQuests(db: Db, characterId: string, view: JournalView): Promise<QuestSummary[]> {
  const statuses: QuestStatus[] =
    view === "active" ? [...ACTIVE_QUEST_STATUSES] : view === "completed" ? ["COMPLETED"] : ["ABANDONED"];
  const rows = await db
    .select()
    .from(quests)
    .where(and(eq(quests.characterId, characterId), inArray(quests.status, statuses)))
    .orderBy(view === "completed" ? desc(quests.completedAt) : desc(quests.updatedAt));
  const list = await loadSummaries(db, rows);
  return view === "active" ? list.sort(byAdventurePriority) : list;
}

export async function getQuestCounts(db: Db, characterId: string) {
  const rows = await db
    .select({ status: quests.status, count: sql<number>`count(*)::int` })
    .from(quests)
    .where(eq(quests.characterId, characterId))
    .groupBy(quests.status);
  const count = (s: QuestStatus[]) => rows.filter((r) => s.includes(r.status as QuestStatus)).reduce((n, r) => n + r.count, 0);
  return { active: count([...ACTIVE_QUEST_STATUSES]), completed: count(["COMPLETED"]), abandoned: count(["ABANDONED"]) };
}

/** The Quest the character is most likely pursuing right now, if any. */
export async function getCurrentAdventure(db: Db, characterId: string): Promise<QuestSummary | null> {
  const active = await listQuests(db, characterId, "active");
  return active.find((q) => q.status !== "ON_HOLD") ?? active[0] ?? null;
}

const EVENT_TEXT: Record<string, (p: Record<string, unknown>) => string> = {
  QUEST_ACCEPTED: () => "Quest accepted.",
  QUEST_OBJECTIVE_COMPLETED: (p) => `Objective complete: ${p.title}`,
  QUEST_COMPLETED: (p) => `Quest complete! +${p.xp} XP, +${p.gp} GP, +${p.qp} QP.`,
  QUEST_ABANDONED: () => "Quest abandoned. No rewards were given.",
  QUEST_RESTORED: () => "Quest restored.",
};

export async function getQuestDetail(db: Db, characterId: string, questId: string): Promise<QuestDetail> {
  const [row] = await db.select().from(quests).where(and(eq(quests.id, questId), eq(quests.characterId, characterId)));
  if (!row) throw new QuestNotFoundError();
  const [summary] = await loadSummaries(db, [row]);
  const [objectives, events, skillRow] = await Promise.all([
    db.select().from(questObjectives).where(eq(questObjectives.questId, questId)).orderBy(asc(questObjectives.position)),
    db
      .select()
      .from(activityEvents)
      .where(and(eq(activityEvents.characterId, characterId), eq(activityEvents.entityId, questId)))
      .orderBy(desc(activityEvents.createdAt))
      .limit(30),
    db
      .select({ xp: characterSkills.xp })
      .from(characterSkills)
      .where(and(eq(characterSkills.characterId, characterId), eq(characterSkills.skillKey, row.skillKey))),
  ]);
  const gain = row.status !== "COMPLETED" && row.rewardXp > 0 ? applyXpGain(skillRow[0]?.xp ?? 0, row.rewardXp) : null;
  return {
    ...summary,
    notes: row.notes,
    templateKey: row.templateKey,
    objectives: objectives.map((o) => ({
      id: o.id,
      title: o.title,
      position: o.position,
      done: Boolean(o.completedAt),
      completedAt: o.completedAt?.toISOString() ?? null,
    })),
    activity: events.map((e) => ({
      id: e.id,
      type: e.type,
      text: (EVENT_TEXT[e.type] ?? (() => e.type))((e.payload ?? {}) as Record<string, unknown>),
      createdAt: e.createdAt.toISOString(),
    })),
    xpOutcome: gain ? { fromLevel: gain.previousLevel, toLevel: gain.newLevel, levelsGained: gain.levelsGained } : null,
  };
}

export type QuestTemplateView = {
  key: string;
  title: string;
  description: string;
  skillKey: SkillKey | null;
  skillName: string | null;
  difficulty: QuestDifficulty | null;
  objectives: string[];
  icon: string;
  isCustom: boolean;
};

export async function listTemplates(db: Db): Promise<QuestTemplateView[]> {
  const [rows, skillRows] = await Promise.all([
    db.select().from(questTemplates).orderBy(asc(questTemplates.sortOrder)),
    db.select({ key: skills.key, name: skills.name }).from(skills),
  ]);
  const name = new Map(skillRows.map((s) => [s.key, s.name]));
  return rows.map((t) => ({
    key: t.key,
    title: t.title,
    description: t.description,
    skillKey: (t.skillKey as SkillKey) ?? null,
    skillName: t.skillKey ? (name.get(t.skillKey) ?? null) : null,
    difficulty: (t.difficulty as QuestDifficulty) ?? null,
    objectives: t.objectives as string[],
    icon: t.icon,
    isCustom: t.isCustom,
  }));
}
