/**
 * Requirement evaluation against live account state. Lock state is derived
 * at read time (never stored), so date-based and level-based requirements
 * unlock as soon as they are true.
 */

import { and, eq, inArray } from "drizzle-orm";
import { GameRuleError } from "@/game/errors";
import { evaluateRequirements, type Requirement, type RequirementContext, type RequirementType } from "@/game/requirements";
import { isUnlocked, type Edge } from "@/game/questlines";
import { getLevelProgress } from "@/game/xp";
import type { Db } from "../db/client";
import { characterSkills, characters, questDependencies, questRequirements, questlines, quests, skills } from "../db/schema";

/** Today's date in UTC; callers pass the viewer's local date when known. */
export function serverToday(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Accept a client-reported local date only if it is within a day of the
 * server's UTC date (timezones span ±14h); otherwise fall back to UTC.
 */
export function trustedLocalDate(clientDate: string | null | undefined, now: Date = new Date()): string {
  const server = serverToday(now);
  if (!clientDate || !/^\d{4}-\d{2}-\d{2}$/.test(clientDate)) return server;
  const diff = Math.abs(Date.parse(`${clientDate}T00:00:00Z`) - Date.parse(`${server}T00:00:00Z`)) / 86_400_000;
  return diff <= 1 ? clientDate : server;
}

export async function buildRequirementContext(db: Db, characterId: string, today: string): Promise<RequirementContext> {
  const [skillRows, xpRows, [character], questRows, questlineRows] = await Promise.all([
    db.select({ key: skills.key, name: skills.name }).from(skills),
    db.select().from(characterSkills).where(eq(characterSkills.characterId, characterId)),
    db.select().from(characters).where(eq(characters.id, characterId)),
    db.select({ id: quests.id, title: quests.title, status: quests.status }).from(quests).where(eq(quests.characterId, characterId)),
    db.select({ id: questlines.id, title: questlines.title, status: questlines.status }).from(questlines).where(eq(questlines.characterId, characterId)),
  ]);
  return {
    skillLevels: Object.fromEntries(xpRows.map((r) => [r.skillKey, getLevelProgress(r.xp).level])),
    skillNames: Object.fromEntries(skillRows.map((s) => [s.key, s.name])),
    questPoints: character?.questPoints ?? 0,
    combatPoints: character?.combatPoints ?? 0,
    completedQuestIds: new Set(questRows.filter((q) => q.status === "COMPLETED").map((q) => q.id)),
    questTitles: Object.fromEntries(questRows.map((q) => [q.id, q.title])),
    completedQuestlineIds: new Set(questlineRows.filter((q) => q.status === "COMPLETED").map((q) => q.id)),
    questlineTitles: Object.fromEntries(questlineRows.map((q) => [q.id, q.title])),
    collectionItemKeys: new Set<string>(),
    collectionItemTitles: {},
    today,
  };
}

export function toRequirement(row: typeof questRequirements.$inferSelect): Requirement {
  return {
    id: row.id,
    type: row.type as RequirementType,
    reference: row.reference,
    requiredValue: row.requiredValue,
    label: row.label,
    manualMet: row.manualMet,
  };
}

export type LockState = {
  locked: boolean;
  /** Parent Quests that must be completed first. */
  dependencies: { questId: string; title: string; met: boolean }[];
  requirements: ReturnType<typeof evaluateRequirements>["statuses"];
};

/** Lock state for a set of Quests (dependencies + requirements). */
export async function lockStates(
  db: Db,
  characterId: string,
  questIds: string[],
  ctx: RequirementContext,
): Promise<Map<string, LockState>> {
  const result = new Map<string, LockState>();
  if (questIds.length === 0) return result;
  const [deps, reqs] = await Promise.all([
    db.select().from(questDependencies).where(inArray(questDependencies.childQuestId, questIds)),
    db.select().from(questRequirements).where(inArray(questRequirements.questId, questIds)),
  ]);
  const edges: Edge[] = deps.map((d) => ({ parent: d.parentQuestId, child: d.childQuestId }));
  for (const id of questIds) {
    const evaluated = evaluateRequirements(reqs.filter((r) => r.questId === id).map(toRequirement), ctx);
    const dependencies = edges
      .filter((e) => e.child === id)
      .map((e) => ({ questId: e.parent, title: ctx.questTitles[e.parent] ?? "Quest", met: ctx.completedQuestIds.has(e.parent) }));
    const unlocked = isUnlocked(id, edges, ctx.completedQuestIds) && evaluated.allMet;
    result.set(id, { locked: !unlocked, dependencies, requirements: evaluated.statuses });
  }
  return result;
}

export async function setManualRequirement(db: Db, characterId: string, requirementId: string, met: boolean) {
  const [row] = await db
    .select({ id: questRequirements.id })
    .from(questRequirements)
    .innerJoin(quests, eq(quests.id, questRequirements.questId))
    .where(and(eq(questRequirements.id, requirementId), eq(quests.characterId, characterId), eq(questRequirements.type, "MANUAL")));
  if (!row) throw new GameRuleError("That requirement could not be found.", "REQUIREMENT_NOT_FOUND");
  await db.update(questRequirements).set({ manualMet: met }).where(eq(questRequirements.id, requirementId));
}
