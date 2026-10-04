/**
 * Streaks and Streak Shields. Activity days are recorded when meaningful
 * progress happens (an objective, a Quest, a qualifying Focus session).
 * Streaks are derived from those days at read time; shields are spent only
 * when the player returns and only if they can cover the whole gap.
 */

import { and, asc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { STREAK_SHIELDS } from "@/game/config/balance";
import { computeStreak, deadlineStreak, shieldableGap, type StreakResult } from "@/game/streaks";
import type { DiaryTier } from "@/game/vocabulary";
import type { Db } from "../db/client";
import { activityDays, activityEvents, characters, focusSessions, questObjectives, quests, shieldUses } from "../db/schema";
import { loadSettings } from "../settings/service";

async function daySets(db: Db, characterId: string) {
  const [days, shields] = await Promise.all([
    db.select().from(activityDays).where(eq(activityDays.characterId, characterId)).orderBy(asc(activityDays.day)),
    db.select({ day: shieldUses.day }).from(shieldUses).where(eq(shieldUses.characterId, characterId)),
  ]);
  return {
    adventure: new Set(days.filter((d) => d.adventure).map((d) => d.day)),
    focus: new Set(days.filter((d) => d.focus).map((d) => d.day)),
    shielded: new Set(shields.map((s) => s.day)),
  };
}

/**
 * Record meaningful progress on a local calendar day. Before the first
 * activity of a new day, held shields protect any missed workdays since the
 * last active day — but only when they can cover the whole gap.
 */
export async function recordActivity(db: Db, characterId: string, day: string, kind: { focus?: boolean } = {}) {
  const sets = await daySets(db, characterId);
  if (!sets.adventure.has(day)) {
    const settings = await loadSettings(db, characterId);
    const gap = shieldableGap(sets.adventure, sets.shielded, settings, day);
    if (gap.length > 0) {
      const [c] = await db.select({ shields: characters.streakShields }).from(characters).where(eq(characters.id, characterId)).for("update");
      if (c && c.shields >= gap.length) {
        await db.insert(shieldUses).values(gap.map((d) => ({ characterId, day: d }))).onConflictDoNothing();
        await db
          .update(characters)
          .set({ streakShields: sql`${characters.streakShields} - ${gap.length}` })
          .where(eq(characters.id, characterId));
        await db.insert(activityEvents).values({ characterId, type: "STREAK_SHIELD_USED", entityId: characterId, payload: { days: gap } });
      }
    }
  }
  await db
    .insert(activityDays)
    .values({ characterId, day, adventure: true, focus: Boolean(kind.focus) })
    .onConflictDoUpdate({
      target: [activityDays.characterId, activityDays.day],
      set: { adventure: true, ...(kind.focus ? { focus: true } : {}) },
    });
}

/** Grant a shield for a demanding Diary tier, up to the held limit. */
export async function grantShieldForDiary(db: Db, characterId: string, period: "WEEKLY" | "MONTHLY", tier: DiaryTier): Promise<boolean> {
  if (!(STREAK_SHIELDS.grantedBy[period] as readonly string[]).includes(tier)) return false;
  const updated = await db
    .update(characters)
    .set({ streakShields: sql`${characters.streakShields} + 1` })
    .where(and(eq(characters.id, characterId), sql`${characters.streakShields} < ${STREAK_SHIELDS.maxHeld}`))
    .returning({ id: characters.id });
  if (updated.length) {
    await db.insert(activityEvents).values({ characterId, type: "STREAK_SHIELD_EARNED", entityId: characterId, payload: { period, tier } });
  }
  return updated.length > 0;
}

export type StreakView = {
  adventure: StreakResult;
  focus: StreakResult;
  deadline: { current: number; best: number };
  shields: number;
  maxShields: number;
  /** Shields that will be spent automatically on the next meaningful progress. */
  pendingShields: number;
};

export async function getStreaks(db: Db, characterId: string, today: string): Promise<StreakView> {
  const [sets, settings, [c], resolved] = await Promise.all([
    daySets(db, characterId),
    loadSettings(db, characterId),
    db.select({ shields: characters.streakShields }).from(characters).where(eq(characters.id, characterId)),
    db
      .select({ completedLocalDate: quests.completedLocalDate, abandonedAt: quests.abandonedAt, completedAt: quests.completedAt, deadline: quests.deadline, status: quests.status })
      .from(quests)
      .where(and(eq(quests.characterId, characterId), isNotNull(quests.deadline), inArray(quests.status, ["COMPLETED", "ABANDONED"]))),
  ]);
  const shields = c?.shields ?? 0;
  // Preview the shields the next activity would spend so the streak doesn't
  // look broken before the player has had a chance to return.
  const gap = sets.adventure.has(today) ? [] : shieldableGap(sets.adventure, sets.shielded, settings, today);
  const covered = gap.length > 0 && gap.length <= shields;
  const shielded = covered ? new Set([...sets.shielded, ...gap]) : sets.shielded;

  // Deadline Streak: Quests with a hard deadline, in the order they were resolved.
  const outcomes = resolved
    .map((q) => {
      const when = q.status === "COMPLETED" ? q.completedAt : q.abandonedAt;
      const onTime = q.status === "COMPLETED" && Boolean(q.completedLocalDate && q.deadline && q.completedLocalDate <= q.deadline);
      // Abandoning before the deadline is a choice, not a miss.
      const counts = q.status === "COMPLETED" || Boolean(when && q.deadline && when.toISOString().slice(0, 10) > q.deadline);
      return { when: when?.getTime() ?? 0, onTime, counts };
    })
    .filter((o) => o.counts)
    .sort((a, b) => a.when - b.when)
    .map((o) => o.onTime);

  return {
    adventure: computeStreak(sets.adventure, shielded, settings, today),
    focus: computeStreak(sets.focus, shielded, settings, today),
    deadline: deadlineStreak(outcomes),
    shields,
    maxShields: STREAK_SHIELDS.maxHeld,
    pendingShields: covered ? gap.length : 0,
  };
}

export async function activeDaySet(db: Db, characterId: string) {
  return (await daySets(db, characterId)).adventure;
}

/**
 * Rebuild activity days from history recorded before streak tracking existed
 * (completed Quests, objectives, qualifying Focus sessions). Additive and
 * idempotent; never removes a day. Dates without a stored local date use UTC.
 */
export async function backfillActivityDays(db: Db, characterId: string, minFocusMinutes: number) {
  const [completed, objectives, focus] = await Promise.all([
    db
      .select({ day: quests.completedLocalDate })
      .from(quests)
      .where(and(eq(quests.characterId, characterId), eq(quests.status, "COMPLETED"), isNotNull(quests.completedLocalDate))),
    db
      .select({ at: questObjectives.completedAt })
      .from(questObjectives)
      .innerJoin(quests, eq(quests.id, questObjectives.questId))
      .where(and(eq(quests.characterId, characterId), isNotNull(questObjectives.completedAt))),
    db
      .select({ at: focusSessions.endedAt, minutes: focusSessions.qualifyingMinutes })
      .from(focusSessions)
      .where(and(eq(focusSessions.characterId, characterId), eq(focusSessions.status, "COMPLETED"))),
  ]);
  const adventure = new Set<string>();
  const focusDays = new Set<string>();
  for (const q of completed) if (q.day) adventure.add(q.day);
  for (const o of objectives) if (o.at) adventure.add(o.at.toISOString().slice(0, 10));
  for (const f of focus) {
    if (f.at && f.minutes >= minFocusMinutes) {
      const d = f.at.toISOString().slice(0, 10);
      adventure.add(d);
      focusDays.add(d);
    }
  }
  if (adventure.size === 0) return 0;
  await db
    .insert(activityDays)
    .values([...adventure].map((day) => ({ characterId, day, adventure: true, focus: focusDays.has(day) })))
    .onConflictDoNothing();
  return adventure.size;
}
