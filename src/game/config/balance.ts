/**
 * Questly Game Balance — the single source of truth for tunable game numbers.
 *
 * Nothing in the UI or services should hard-code reward values, curve
 * parameters, or thresholds. Import from here instead.
 *
 * Product rule (QUESTLY_PRODUCT_SPEC §8.3, §26): accepted Quests snapshot their
 * rewards, so changing these defaults later must never retroactively alter an
 * accepted Quest. The snapshot is the Quest's responsibility (Phase 2).
 */

import type { QuestDifficulty } from "../vocabulary";

// ---------------------------------------------------------------------------
// XP curve
// ---------------------------------------------------------------------------

/**
 * Classic MMORPG-style exponential curve: the XP needed per level roughly
 * doubles every `doublingInterval` levels, so Level 92 sits at about half the
 * XP of Level 99.
 *
 *   points(L) = Σ_{l=1}^{L-1} floor(l * linearFactor + exponentialBase * 2^(l / doublingInterval))
 *   threshold(L) = floor(points(L) / divisor)
 *
 * `divisor` scales the whole curve. At 40, Level 99 requires ~1.3M XP —
 * a legendary, multi-year achievement given Quest rewards of 100–5,000 XP —
 * while the first Novice Quest still grants several early levels.
 */
export const XP_CURVE = {
  maxLevel: 99,
  linearFactor: 1,
  exponentialBase: 300,
  doublingInterval: 7,
  divisor: 40,
  /** Hard ceiling on stored skill XP. XP keeps accruing past Level 99 until here. */
  maxXp: 200_000_000,
} as const;

export type XpCurveConfig = {
  maxLevel: number;
  linearFactor: number;
  exponentialBase: number;
  doublingInterval: number;
  divisor: number;
  maxXp: number;
};

// ---------------------------------------------------------------------------
// Quest rewards
// ---------------------------------------------------------------------------

export type QuestReward = { xp: number; gp: number; qp: number };

/** Default rewards by difficulty (CLAUDE.md §10, Product Spec §5.2, §6, §7.1). */
export const QUEST_REWARDS: Readonly<Record<QuestDifficulty, QuestReward>> = {
  NOVICE: { xp: 100, gp: 2, qp: 1 },
  INTERMEDIATE: { xp: 250, gp: 5, qp: 2 },
  EXPERIENCED: { xp: 750, gp: 15, qp: 3 },
  MASTER: { xp: 2_000, gp: 40, qp: 5 },
  GRANDMASTER: { xp: 5_000, gp: 100, qp: 10 },
};

// ---------------------------------------------------------------------------
// Future systems — configuration locations only. Not consumed in Phase 1.
// ---------------------------------------------------------------------------

/** Focus XP (Product Spec §12.3). Consumed by Focus Mode in Phase 3. */
export const FOCUS_XP = {
  timerPresetsMinutes: [25, 50, 90],
  /** Qualifying-minute tiers, highest first match wins. */
  sessionTiers: [
    { minMinutes: 90, xp: 100 },
    { minMinutes: 60, xp: 60 },
    { minMinutes: 30, xp: 25 },
  ],
  /** Daily cap on Focus XP from sessions, to prevent endless timer farming. */
  dailyXpCap: 300,
  /** Sessions after this count in a day award a reduced share. */
  diminishingReturns: { fullValueSessionsPerDay: 3, reducedMultiplier: 0.5 },
} as const;

/** Boss bounty defaults (Product Spec §13.1). Consumed by Bosses in Phase 3. */
export const BOSS_BOUNTY = {
  earlyGp: 30,
  byTargetGp: 20,
  byDeadlineGp: 10,
  lateGp: 0,
} as const;

/** Respawn suggestion thresholds (Product Spec §23). Consumed in Phase 5. */
export const RESPAWN_THRESHOLDS = {
  missedPlannedWorkdays: 3,
  questsNeedingAttention: 5,
} as const;

/** Maximum recommended simultaneous Main Quests (Product Spec §8.5). */
export const MAIN_QUEST_CAP = 3;

export const GAME_BALANCE = {
  xpCurve: XP_CURVE,
  questRewards: QUEST_REWARDS,
  focusXp: FOCUS_XP,
  bossBounty: BOSS_BOUNTY,
  respawnThresholds: RESPAWN_THRESHOLDS,
  mainQuestCap: MAIN_QUEST_CAP,
} as const;
