/**
 * Achievement Diaries. Auto entries are measured within the Diary period;
 * custom entries are written by the player. Tier rewards are claimed once,
 * in order (diary_claims primary key + ledger idempotency keys).
 */

import { and, asc, eq } from "drizzle-orm";
import { DIARY_REWARDS } from "@/game/config/balance";
import type { DiaryPeriod } from "@/game/content/diaries";
import { assertClaimable, periodFor, tierStates, type Period, type TierState, type WeekStart } from "@/game/diaries";
import { GameRuleError } from "@/game/errors";
import { ruleProgress, type RuleProgress, type TrackingRule } from "@/game/metrics";
import { DIARY_TIERS, type DiaryTier } from "@/game/vocabulary";
import type { Db } from "../db/client";
import { activityEvents, characters, diaryClaims, diaryCustomEntries, diaryEntryTemplates } from "../db/schema";
import { computeMetrics } from "../meta/metrics";
import { recordProgression } from "../progression/service";

export type DiaryEntryView = {
  id: string;
  kind: "AUTO" | "CUSTOM";
  tier: DiaryTier;
  title: string;
  progress: RuleProgress;
  complete: boolean;
};

export type DiaryView = {
  period: Period;
  entries: DiaryEntryView[];
  tiers: (TierState & { reward: { gp: number; focusXp: number } })[];
  completedTiers: number;
};

export async function weekStartFor(db: Db, characterId: string): Promise<WeekStart> {
  const [c] = await db.select({ settings: characters.settings }).from(characters).where(eq(characters.id, characterId));
  const ws = Number((c?.settings as Record<string, unknown> | null)?.weekStart ?? 1);
  return (Number.isInteger(ws) && ws >= 0 && ws <= 6 ? ws : 1) as WeekStart;
}

export async function getDiary(db: Db, characterId: string, type: DiaryPeriod, today: string): Promise<DiaryView> {
  const period = periodFor(type, today, await weekStartFor(db, characterId));
  const [templates, custom, claims, metrics] = await Promise.all([
    db.select().from(diaryEntryTemplates).where(eq(diaryEntryTemplates.period, type)).orderBy(asc(diaryEntryTemplates.sortOrder)),
    db
      .select()
      .from(diaryCustomEntries)
      .where(and(eq(diaryCustomEntries.characterId, characterId), eq(diaryCustomEntries.period, type), eq(diaryCustomEntries.periodStart, period.start)))
      .orderBy(asc(diaryCustomEntries.createdAt)),
    db
      .select()
      .from(diaryClaims)
      .where(and(eq(diaryClaims.characterId, characterId), eq(diaryClaims.period, type), eq(diaryClaims.periodStart, period.start))),
    computeMetrics(db, characterId, { start: period.start, end: period.end }),
  ]);
  const entries: DiaryEntryView[] = [
    ...templates.map((t) => {
      const progress = ruleProgress(t.rule as TrackingRule, metrics);
      return { id: t.key, kind: "AUTO" as const, tier: t.tier as DiaryTier, title: t.title, progress, complete: progress.complete };
    }),
    ...custom.map((c) => ({
      id: c.id,
      kind: "CUSTOM" as const,
      tier: c.tier as DiaryTier,
      title: c.title,
      progress: { current: c.completedAt ? 1 : 0, target: 1, percent: c.completedAt ? 100 : 0, complete: Boolean(c.completedAt) },
      complete: Boolean(c.completedAt),
    })),
  ];
  const claimed = new Set(claims.map((c) => c.tier as DiaryTier));
  const tiers = tierStates(entries, claimed).map((t) => ({ ...t, reward: DIARY_REWARDS[type][t.tier] }));
  return { period, entries, tiers, completedTiers: tiers.filter((t) => t.claimed).length };
}

export async function claimDiaryTier(db: Db, characterId: string, type: DiaryPeriod, tier: DiaryTier, today: string) {
  return db.transaction(async (tx) => {
    const diary = await getDiary(tx, characterId, type, today);
    const state = diary.tiers.find((t) => t.tier === tier);
    assertClaimable(state);
    const inserted = await tx
      .insert(diaryClaims)
      .values({ characterId, period: type, periodStart: diary.period.start, tier })
      .onConflictDoNothing()
      .returning();
    if (!inserted.length) throw new GameRuleError("This Diary tier has already been claimed.", "DIARY_ALREADY_CLAIMED");
    const reward = DIARY_REWARDS[type][tier];
    const key = `diary:${type}:${diary.period.start}:${tier}`;
    const source = { sourceType: "DIARY" as const, sourceId: key, metadata: { period: diary.period.label, tier } };
    if (reward.gp > 0) await recordProgression(tx, characterId, { kind: "GP", amount: reward.gp, ...source, idempotencyKey: `${key}:gp` });
    let xp = null;
    if (reward.focusXp > 0) {
      xp = (await recordProgression(tx, characterId, { kind: "XP", skillKey: "focus", amount: reward.focusXp, ...source, idempotencyKey: `${key}:xp` })).xp ?? null;
    }
    await tx.insert(activityEvents).values({
      characterId,
      type: "DIARY_TIER_CLAIMED",
      entityId: key,
      payload: { period: diary.period.label, periodType: type, tier, gp: reward.gp, focusXp: reward.focusXp },
    });
    return { period: diary.period, tier, reward, levelUp: xp?.leveledUp ? { fromLevel: xp.previousLevel, toLevel: xp.newLevel } : null };
  });
}

async function currentPeriodStart(db: Db, characterId: string, type: DiaryPeriod, today: string) {
  return periodFor(type, today, await weekStartFor(db, characterId)).start;
}

export async function addCustomEntry(db: Db, characterId: string, type: DiaryPeriod, tier: DiaryTier, title: string, today: string) {
  const clean = title.trim();
  if (!clean) throw new GameRuleError("Give the Diary entry a name.", "DIARY_ENTRY_REQUIRED");
  if (clean.length > 200) throw new GameRuleError("Diary entries must be 200 characters or fewer.", "DIARY_ENTRY_TOO_LONG");
  if (!DIARY_TIERS.includes(tier)) throw new GameRuleError("Choose a Diary tier.", "INVALID_TIER");
  const periodStart = await currentPeriodStart(db, characterId, type, today);
  const [claimed] = await db
    .select()
    .from(diaryClaims)
    .where(and(eq(diaryClaims.characterId, characterId), eq(diaryClaims.period, type), eq(diaryClaims.periodStart, periodStart), eq(diaryClaims.tier, tier)));
  if (claimed) throw new GameRuleError("That tier has already been claimed for this period.", "DIARY_TIER_CLAIMED");
  const [row] = await db.insert(diaryCustomEntries).values({ characterId, period: type, periodStart, tier, title: clean }).returning();
  return row;
}

export async function setCustomEntryDone(db: Db, characterId: string, entryId: string, done: boolean) {
  const [entry] = await db.select().from(diaryCustomEntries).where(and(eq(diaryCustomEntries.id, entryId), eq(diaryCustomEntries.characterId, characterId)));
  if (!entry) throw new GameRuleError("That Diary entry could not be found.", "DIARY_ENTRY_NOT_FOUND");
  const [claimed] = await db
    .select()
    .from(diaryClaims)
    .where(and(eq(diaryClaims.characterId, characterId), eq(diaryClaims.period, entry.period), eq(diaryClaims.periodStart, entry.periodStart), eq(diaryClaims.tier, entry.tier)));
  if (claimed) throw new GameRuleError("This tier has been claimed; its entries are part of the record now.", "DIARY_TIER_CLAIMED");
  await db.update(diaryCustomEntries).set({ completedAt: done ? new Date() : null }).where(eq(diaryCustomEntries.id, entryId));
}

export async function removeCustomEntry(db: Db, characterId: string, entryId: string) {
  const [entry] = await db.select().from(diaryCustomEntries).where(and(eq(diaryCustomEntries.id, entryId), eq(diaryCustomEntries.characterId, characterId)));
  if (!entry) throw new GameRuleError("That Diary entry could not be found.", "DIARY_ENTRY_NOT_FOUND");
  const [claimed] = await db
    .select()
    .from(diaryClaims)
    .where(and(eq(diaryClaims.characterId, characterId), eq(diaryClaims.period, entry.period), eq(diaryClaims.periodStart, entry.periodStart), eq(diaryClaims.tier, entry.tier)));
  if (claimed) throw new GameRuleError("This tier has been claimed; its entries are part of the record now.", "DIARY_TIER_CLAIMED");
  await db.delete(diaryCustomEntries).where(eq(diaryCustomEntries.id, entryId));
}

/** Claimed tiers across all periods, for profile stats. */
export async function diaryClaimHistory(db: Db, characterId: string) {
  return db.select().from(diaryClaims).where(eq(diaryClaims.characterId, characterId)).orderBy(asc(diaryClaims.claimedAt));
}
