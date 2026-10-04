/**
 * Boss rules (pure). A Boss is a Quest designated as the character's biggest
 * current challenge. HP falls deterministically with objective progress, and
 * an optional bounty rewards timely defeat — it never removes normal rewards
 * and never deducts GP (CLAUDE.md §14).
 */

import { BOSS_BOUNTY } from "./config/balance";

export type BountySnapshot = { earlyGp: number; byTargetGp: number; byDeadlineGp: number; lateGp: number };
export type BountyTier = "EARLY" | "BY_TARGET" | "BY_DEADLINE" | "LATE" | "NONE";

export function snapshotBounty(config: BountySnapshot = BOSS_BOUNTY): BountySnapshot {
  return { earlyGp: config.earlyGp, byTargetGp: config.byTargetGp, byDeadlineGp: config.byDeadlineGp, lateGp: config.lateGp };
}

/** Boss HP 0–100: equal-weight objectives; a Boss with no objectives is at full HP until defeated. */
export function bossHp(progress: { done: number; total: number }, defeated = false): number {
  if (defeated) return 0;
  if (progress.total === 0) return 100;
  return Math.round(100 - (progress.done / progress.total) * 100);
}

/**
 * Bounty tier for a defeat on `onDate` (YYYY-MM-DD). Without a target date
 * or deadline there is nothing to beat, so no bounty applies.
 */
export function bountyFor(
  bounty: BountySnapshot | null,
  targetDate: string | null,
  deadline: string | null,
  onDate: string,
): { tier: BountyTier; gp: number } {
  if (!bounty || (!targetDate && !deadline)) return { tier: "NONE", gp: 0 };
  if (targetDate && onDate < targetDate) return { tier: "EARLY", gp: bounty.earlyGp };
  if (targetDate && onDate === targetDate) return { tier: "BY_TARGET", gp: bounty.byTargetGp };
  if (deadline && onDate <= deadline) return { tier: "BY_DEADLINE", gp: bounty.byDeadlineGp };
  if (!targetDate && deadline && onDate <= deadline) return { tier: "BY_DEADLINE", gp: bounty.byDeadlineGp };
  return { tier: "LATE", gp: bounty.lateGp };
}

export const BOUNTY_TIER_LABELS: Record<BountyTier, string> = {
  EARLY: "Early",
  BY_TARGET: "By target date",
  BY_DEADLINE: "By deadline",
  LATE: "Late",
  NONE: "No bounty",
};
