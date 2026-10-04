/**
 * Achievement Diary rules (pure): period boundaries, tier completion, and
 * claim order (CLAUDE.md §16).
 */

import type { DiaryPeriod } from "./content/diaries";
import { GameRuleError } from "./errors";
import { DIARY_TIERS, type DiaryTier } from "./vocabulary";

export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday …

const DAY = 86_400_000;
const toDay = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export type Period = { type: DiaryPeriod; start: string; end: string; label: string };

/** The period containing `date` (YYYY-MM-DD). `end` is exclusive. */
export function periodFor(type: DiaryPeriod, date: string, weekStart: WeekStart = 1): Period {
  if (type === "MONTHLY") {
    const [y, m] = date.split("-").map(Number);
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    const end = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const label = new Date(`${start}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    return { type, start, end, label };
  }
  const t = toDay(date);
  const dow = new Date(t).getUTCDay();
  const back = (dow - weekStart + 7) % 7;
  const start = toIso(t - back * DAY);
  const end = toIso(t - back * DAY + 7 * DAY);
  const label = `Week of ${new Date(`${start}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`;
  return { type, start, end, label };
}

/** Whole days remaining in the period, counting today. */
export function daysRemaining(period: Period, today: string): number {
  return Math.max(0, Math.round((toDay(period.end) - toDay(today)) / DAY));
}

export type TierState = {
  tier: DiaryTier;
  done: number;
  total: number;
  complete: boolean;
  claimed: boolean;
  /** Complete, unclaimed, and every lower tier already claimed. */
  claimable: boolean;
};

export function tierStates(entries: readonly { tier: DiaryTier; complete: boolean }[], claimed: ReadonlySet<DiaryTier>): TierState[] {
  let lowerClaimed = true;
  return DIARY_TIERS.map((tier) => {
    const list = entries.filter((e) => e.tier === tier);
    const done = list.filter((e) => e.complete).length;
    const complete = list.length > 0 && done === list.length;
    const isClaimed = claimed.has(tier);
    const state = { tier, done, total: list.length, complete, claimed: isClaimed, claimable: complete && !isClaimed && lowerClaimed };
    lowerClaimed = lowerClaimed && isClaimed;
    return state;
  });
}

export function assertClaimable(state: TierState | undefined): void {
  if (!state) throw new GameRuleError("That Diary tier does not exist.", "DIARY_TIER_NOT_FOUND");
  if (state.claimed) throw new GameRuleError("This Diary tier has already been claimed.", "DIARY_ALREADY_CLAIMED");
  if (!state.complete) throw new GameRuleError("Complete every entry in this tier first.", "DIARY_INCOMPLETE");
  if (!state.claimable) throw new GameRuleError("Claim the lower tiers of this Diary first.", "DIARY_LOWER_TIER");
}

export const DIARY_TIER_LABELS: Record<DiaryTier, string> = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard", ELITE: "Elite" };
