/** Questline read models: list, adventure-path map, and node lock states. */

import { and, asc, eq, inArray } from "drizzle-orm";
import { layoutDepths, questlineBonus } from "@/game/questlines";
import { questProgress, type QuestStatus } from "@/game/quests";
import type { QuestDifficulty, SkillKey } from "@/game/vocabulary";
import type { Db } from "../db/client";
import { questDependencies, questObjectives, questlines, quests, skills } from "../db/schema";
import { buildRequirementContext, lockStates, serverToday, type LockState } from "../requirements/service";

export type QuestlineSummary = {
  id: string;
  title: string;
  description: string;
  skillKey: SkillKey;
  skillName: string;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  total: number;
  completed: number;
  percent: number;
  createdAt: string;
  completedAt: string | null;
};

export type QuestlineNode = {
  id: string;
  title: string;
  description: string;
  skillKey: SkillKey;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  /** Derived: AVAILABLE nodes whose dependencies/requirements are unmet. */
  locked: boolean;
  lock: LockState | null;
  depth: number;
  row: number;
  rewards: { xp: number; gp: number; qp: number };
  progress: { done: number; total: number; percent: number };
  isBoss: boolean;
};

export type QuestlineDetail = QuestlineSummary & {
  nodes: QuestlineNode[];
  edges: { parent: string; child: string }[];
  bonus: { xp: number; gp: number };
  /** The node to focus on next: an active Quest, else the first unlocked available one. */
  currentNodeId: string | null;
};

export async function listQuestlines(db: Db, characterId: string): Promise<QuestlineSummary[]> {
  const [lines, skillRows] = await Promise.all([
    db.select().from(questlines).where(eq(questlines.characterId, characterId)).orderBy(asc(questlines.createdAt)),
    db.select({ key: skills.key, name: skills.name }).from(skills),
  ]);
  if (!lines.length) return [];
  const members = await db
    .select({ questlineId: quests.questlineId, status: quests.status })
    .from(quests)
    .where(inArray(quests.questlineId, lines.map((l) => l.id)));
  const name = new Map(skillRows.map((s) => [s.key, s.name]));
  return lines.map((l) => {
    const m = members.filter((x) => x.questlineId === l.id);
    const completed = m.filter((x) => x.status === "COMPLETED").length;
    return {
      id: l.id,
      title: l.title,
      description: l.description,
      skillKey: l.skillKey as SkillKey,
      skillName: name.get(l.skillKey) ?? l.skillKey,
      status: l.status as QuestlineSummary["status"],
      total: m.length,
      completed,
      percent: m.length ? Math.floor((completed / m.length) * 100) : 0,
      createdAt: l.createdAt.toISOString(),
      completedAt: l.completedAt?.toISOString() ?? null,
    };
  });
}

export async function getQuestlineDetail(db: Db, characterId: string, questlineId: string, today = serverToday()): Promise<QuestlineDetail | null> {
  const summaries = await listQuestlines(db, characterId);
  const summary = summaries.find((s) => s.id === questlineId);
  if (!summary) return null;
  const rows = await db.select().from(quests).where(and(eq(quests.questlineId, questlineId), eq(quests.characterId, characterId))).orderBy(asc(quests.createdAt), asc(quests.id));
  const ids = rows.map((r) => r.id);
  const [deps, objectives, ctx] = await Promise.all([
    ids.length ? db.select().from(questDependencies).where(inArray(questDependencies.childQuestId, ids)) : Promise.resolve([]),
    ids.length ? db.select().from(questObjectives).where(inArray(questObjectives.questId, ids)) : Promise.resolve([]),
    buildRequirementContext(db, characterId, today),
  ]);
  const edges = deps.map((d) => ({ parent: d.parentQuestId, child: d.childQuestId }));
  const depths = layoutDepths(ids, edges);
  const locks = await lockStates(db, characterId, ids.filter((id) => rows.find((r) => r.id === id)!.status === "AVAILABLE"), ctx);
  const rowCounter = new Map<number, number>();
  const nodes: QuestlineNode[] = rows.map((r) => {
    const depth = depths[r.id] ?? 0;
    const row = rowCounter.get(depth) ?? 0;
    rowCounter.set(depth, row + 1);
    const p = questProgress(objectives.filter((o) => o.questId === r.id));
    const lock = locks.get(r.id) ?? null;
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      skillKey: r.skillKey as SkillKey,
      difficulty: r.difficulty as QuestDifficulty,
      status: r.status as QuestStatus,
      locked: r.status === "AVAILABLE" && Boolean(lock?.locked),
      lock,
      depth,
      row,
      rewards: { xp: r.rewardXp, gp: r.rewardGp, qp: r.rewardQp },
      progress: { done: p.done, total: p.total, percent: p.percent },
      isBoss: r.isBoss,
    };
  });
  const active = nodes.find((n) => n.status === "ACCEPTED" || n.status === "IN_PROGRESS" || n.status === "ON_HOLD");
  const next = nodes.find((n) => n.status === "AVAILABLE" && !n.locked);
  return {
    ...summary,
    nodes,
    edges,
    bonus: questlineBonus(rows.map((r) => ({ xp: r.rewardXp, gp: r.rewardGp }))),
    currentNodeId: active?.id ?? next?.id ?? null,
  };
}
