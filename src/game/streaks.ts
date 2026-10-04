/**
 * Streaks (Product Spec §20–21), derived from recorded activity days.
 * Non-workdays and vacation days never break a streak; a Streak Shield
 * protects a missed workday for the Adventure and Focus streaks, never the
 * Deadline streak. Personal bests remain visible after a streak ends.
 */

import { isOnVacation, isWorkday, type CharacterSettings } from "./settings";

export type StreakKind = "ADVENTURE" | "FOCUS";
export type StreakResult = { current: number; best: number; activeToday: boolean };

const DAY = 86_400_000;
const shift = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);

/**
 * Walks every day from the first recorded activity to today. Today only
 * extends a streak (it cannot break it — the day is not over).
 */
export function computeStreak(
  activeDays: ReadonlySet<string>,
  shieldedDays: ReadonlySet<string>,
  settings: Pick<CharacterSettings, "workdays" | "vacations">,
  today: string,
): StreakResult {
  const days = [...activeDays].sort();
  if (days.length === 0) return { current: 0, best: 0, activeToday: false };
  let run = 0;
  let best = 0;
  for (let d = days[0]; d <= today; d = shift(d, 1)) {
    const counts = isWorkday(settings, d) && !isOnVacation(settings, d);
    if (activeDays.has(d)) {
      // Activity always counts, even on a rest day.
      run += 1;
    } else if (!counts || shieldedDays.has(d)) {
      // Rest day, vacation, or shielded: the streak holds.
    } else if (d === today) {
      // Today is not over yet.
    } else {
      run = 0;
    }
    best = Math.max(best, run);
  }
  return { current: run, best, activeToday: activeDays.has(today) };
}

/**
 * Missed workdays a shield could protect right now: the gap between the last
 * active day and today, only while a streak exists before the gap. Oldest
 * first; callers spend as many shields as they have.
 */
export function shieldableGap(
  activeDays: ReadonlySet<string>,
  shieldedDays: ReadonlySet<string>,
  settings: Pick<CharacterSettings, "workdays" | "vacations">,
  today: string,
): string[] {
  const days = [...activeDays].filter((d) => d < today).sort();
  if (days.length === 0) return [];
  const last = days[days.length - 1];
  const gap: string[] = [];
  for (let d = shift(last, 1); d < today; d = shift(d, 1)) {
    if (isWorkday(settings, d) && !isOnVacation(settings, d) && !shieldedDays.has(d) && !activeDays.has(d)) gap.push(d);
  }
  return gap;
}

/** Deadline Streak: consecutive deadline-bearing Quests finished on time. */
export function deadlineStreak(outcomes: readonly boolean[]): { current: number; best: number } {
  let current = 0;
  let best = 0;
  for (const onTime of outcomes) {
    current = onTime ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return { current, best };
}

/** Consecutive planned workdays (most recent first) without meaningful progress. */
export function missedWorkdays(activeDays: ReadonlySet<string>, settings: Pick<CharacterSettings, "workdays" | "vacations">, today: string, lookback = 30): number {
  let missed = 0;
  for (let i = 1; i <= lookback; i++) {
    const d = shift(today, -i);
    if (activeDays.has(d)) break;
    if (isWorkday(settings, d) && !isOnVacation(settings, d)) missed += 1;
  }
  return missed;
}
