/**
 * Computes AccountMetrics from persisted state, all-time or within a Diary
 * window. The single source for every tracking rule.
 */

import { and, eq, gte, lt, ne, sql } from "drizzle-orm";
import { totalLevel } from "@/game/character";
import { minimumQualifyingMinutes } from "@/game/focus";
import { countAtDifficulty, emptyMetrics, type AccountMetrics } from "@/game/metrics";
import type { QuestDifficulty } from "@/game/vocabulary";
import { getLevelProgress } from "@/game/xp";
import type { Db } from "../db/client";
import {
  activityEvents,
  characterCollectionItems,
  characterCombatAchievements,
  characterSkills,
  characters,
  focusSessions,
  progressionTransactions,
  questlines,
  quests,
} from "../db/schema";

export type MetricsWindow = { start: string; end: string };

const ts = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);

export async function computeMetrics(db: Db, characterId: string, window?: MetricsWindow): Promise<AccountMetrics> {
  const m = emptyMetrics();
  const inWindow = (date: string | null) => !window || (date !== null && date >= window.start && date < window.end);

  const [questRows, focusRows, bossEvents, lineRows, xpSum, skillRows, [character], caCount, collectionCount] = await Promise.all([
    db
      .select({
        difficulty: quests.difficulty,
        skillKey: quests.skillKey,
        priority: quests.priority,
        targetDate: quests.targetDate,
        deadline: quests.deadline,
        localDate: quests.completedLocalDate,
        completedAt: quests.completedAt,
      })
      .from(quests)
      .where(and(eq(quests.characterId, characterId), eq(quests.status, "COMPLETED"))),
    db
      .select({ minutes: focusSessions.qualifyingMinutes })
      .from(focusSessions)
      .where(
        and(
          eq(focusSessions.characterId, characterId),
          eq(focusSessions.status, "COMPLETED"),
          ...(window ? [gte(focusSessions.endedAt, ts(window.start)), lt(focusSessions.endedAt, ts(window.end))] : []),
        ),
      ),
    db
      .select({ payload: activityEvents.payload })
      .from(activityEvents)
      .where(
        and(
          eq(activityEvents.characterId, characterId),
          eq(activityEvents.type, "BOSS_DEFEATED"),
          ...(window ? [gte(activityEvents.createdAt, ts(window.start)), lt(activityEvents.createdAt, ts(window.end))] : []),
        ),
      ),
    db
      .select({ completedAt: questlines.completedAt })
      .from(questlines)
      .where(and(eq(questlines.characterId, characterId), eq(questlines.status, "COMPLETED"))),
    db
      .select({ total: sql<number>`coalesce(sum(${progressionTransactions.amount}), 0)::int` })
      .from(progressionTransactions)
      .where(
        and(
          eq(progressionTransactions.characterId, characterId),
          eq(progressionTransactions.kind, "XP"),
          // Demo seed XP is not earned in play.
          ne(progressionTransactions.sourceType, "SEED_DEMO"),
          ...(window ? [gte(progressionTransactions.createdAt, ts(window.start)), lt(progressionTransactions.createdAt, ts(window.end))] : []),
        ),
      ),
    db.select().from(characterSkills).where(eq(characterSkills.characterId, characterId)),
    db.select().from(characters).where(eq(characters.id, characterId)),
    db.select({ n: sql<number>`count(*)::int` }).from(characterCombatAchievements).where(eq(characterCombatAchievements.characterId, characterId)),
    db.select({ n: sql<number>`count(*)::int` }).from(characterCollectionItems).where(eq(characterCollectionItems.characterId, characterId)),
  ]);

  const completed = questRows
    .map((q) => ({ ...q, date: q.localDate ?? q.completedAt?.toISOString().slice(0, 10) ?? null }))
    .filter((q) => inWindow(q.date));
  m.questsCompleted = completed.length;
  m.questsAtDifficulty = countAtDifficulty(completed.map((q) => q.difficulty as QuestDifficulty));
  for (const q of completed) m.questsBySkill[q.skillKey] = (m.questsBySkill[q.skillKey] ?? 0) + 1;
  m.mainQuestsCompleted = completed.filter((q) => q.priority === "MAIN").length;
  m.questsBeforeTarget = completed.filter((q) => q.targetDate && q.date && q.date < q.targetDate).length;
  m.deadlineQuestsOnTime = completed.filter((q) => q.deadline && q.date && q.date <= q.deadline).length;

  const min = minimumQualifyingMinutes();
  m.focusSessions = focusRows.filter((f) => f.minutes >= min).length;
  m.focusLongSessions = focusRows.filter((f) => f.minutes >= 90).length;
  m.focusMinutes = focusRows.reduce((s, f) => s + f.minutes, 0);

  m.bossesDefeated = bossEvents.length;
  m.earlyBossBounties = bossEvents.filter((e) => (e.payload as Record<string, unknown>)?.tier === "EARLY").length;
  m.questlinesCompleted = lineRows.filter((l) => inWindow(l.completedAt?.toISOString().slice(0, 10) ?? null)).length;
  m.xpEarned = xpSum[0]?.total ?? 0;

  m.skillLevels = Object.fromEntries(skillRows.map((r) => [r.skillKey, getLevelProgress(r.xp).level]));
  m.totalLevel = totalLevel(Object.fromEntries(skillRows.map((r) => [r.skillKey, r.xp])));
  m.highestSkillLevel = Math.max(1, ...Object.values(m.skillLevels));
  m.questPoints = character?.questPoints ?? 0;
  m.combatPoints = character?.combatPoints ?? 0;
  m.combatAchievementsCompleted = caCount[0]?.n ?? 0;
  m.collectionItems = collectionCount[0]?.n ?? 0;
  return m;
}
