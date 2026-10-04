/**
 * Account export: every record that belongs to the character, as plain JSON,
 * so years of history are never trapped in the app. Seed definitions (Skills,
 * achievement and collection catalogs) are referenced by key, not copied.
 */

import { asc, eq, inArray } from "drizzle-orm";
import { CharacterNotFoundError } from "@/game/errors";
import type { Db } from "../db/client";
import {
  activityDays,
  activityEvents,
  characterCollectionItems,
  characterCombatAchievements,
  characterSkills,
  characterTitles,
  characters,
  diaryClaims,
  diaryCustomEntries,
  focusSessions,
  progressionTransactions,
  questDateChanges,
  questDependencies,
  questObjectives,
  questRequirements,
  questlines,
  quests,
  respawns,
  rewardRedemptions,
  rewards,
  shieldUses,
  weeklyPlanItems,
  weeklyPlans,
} from "../db/schema";

export const EXPORT_FORMAT = "questly-export";
export const EXPORT_VERSION = 1;

export async function exportCharacter(db: Db, characterId: string, now: Date = new Date()) {
  const [character] = await db.select().from(characters).where(eq(characters.id, characterId));
  if (!character) throw new CharacterNotFoundError(characterId);
  const { authSubject: _auth, ...profile } = character;
  void _auth;

  const by = <T extends { characterId: unknown }>(t: T) => eq(t.characterId as never, characterId);
  const [
    skills,
    titles,
    ledger,
    events,
    questRows,
    lines,
    focus,
    achievements,
    collection,
    diaryEntries,
    claims,
    rewardRows,
    redemptions,
    days,
    shields,
    plans,
    respawnRows,
  ] = await Promise.all([
    db.select().from(characterSkills).where(by(characterSkills)),
    db.select().from(characterTitles).where(by(characterTitles)),
    db.select().from(progressionTransactions).where(by(progressionTransactions)).orderBy(asc(progressionTransactions.seq)),
    db.select().from(activityEvents).where(by(activityEvents)).orderBy(asc(activityEvents.createdAt)),
    db.select().from(quests).where(by(quests)).orderBy(asc(quests.createdAt)),
    db.select().from(questlines).where(by(questlines)),
    db.select().from(focusSessions).where(by(focusSessions)).orderBy(asc(focusSessions.startedAt)),
    db.select().from(characterCombatAchievements).where(by(characterCombatAchievements)),
    db.select().from(characterCollectionItems).where(by(characterCollectionItems)),
    db.select().from(diaryCustomEntries).where(by(diaryCustomEntries)),
    db.select().from(diaryClaims).where(by(diaryClaims)),
    db.select().from(rewards).where(by(rewards)),
    db.select().from(rewardRedemptions).where(by(rewardRedemptions)).orderBy(asc(rewardRedemptions.redeemedAt)),
    db.select().from(activityDays).where(by(activityDays)).orderBy(asc(activityDays.day)),
    db.select().from(shieldUses).where(by(shieldUses)),
    db.select().from(weeklyPlans).where(by(weeklyPlans)).orderBy(asc(weeklyPlans.weekStart)),
    db.select().from(respawns).where(by(respawns)),
  ]);

  const questIds = questRows.map((q) => q.id);
  const planIds = plans.map((p) => p.id);
  const [objectives, dependencies, requirements, dateChanges, planItems] = await Promise.all([
    questIds.length ? db.select().from(questObjectives).where(inArray(questObjectives.questId, questIds)) : [],
    questIds.length ? db.select().from(questDependencies).where(inArray(questDependencies.childQuestId, questIds)) : [],
    questIds.length ? db.select().from(questRequirements).where(inArray(questRequirements.questId, questIds)) : [],
    questIds.length ? db.select().from(questDateChanges).where(inArray(questDateChanges.questId, questIds)) : [],
    planIds.length ? db.select().from(weeklyPlanItems).where(inArray(weeklyPlanItems.planId, planIds)) : [],
  ]);

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    character: profile,
    skills,
    titles,
    progressionLedger: ledger,
    activity: events,
    quests: questRows.map((q) => ({
      ...q,
      objectives: objectives.filter((o) => o.questId === q.id).sort((a, b) => a.position - b.position),
      dependsOn: dependencies.filter((d) => d.childQuestId === q.id).map((d) => d.parentQuestId),
      requirements: requirements.filter((r) => r.questId === q.id),
      dateHistory: dateChanges.filter((d) => d.questId === q.id),
    })),
    questlines: lines,
    focusSessions: focus,
    combatAchievements: achievements,
    collectionLog: collection,
    diaries: { customEntries: diaryEntries, claims },
    rewardShop: { rewards: rewardRows, redemptions },
    streaks: { activityDays: days, shieldUses: shields },
    weeklyPlans: plans.map((p) => ({ ...p, items: planItems.filter((i) => i.planId === p.id) })),
    respawns: respawnRows,
  };
}
