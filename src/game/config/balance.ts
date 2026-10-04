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
// Other systems
// ---------------------------------------------------------------------------

/**
 * Focus XP (Product Spec §12.3). Sessions shorter than the lowest tier earn
 * no Focus XP. The daily cap and diminishing returns use a rolling 24-hour
 * window so they work regardless of timezone.
 */
export const FOCUS_XP = {
  timerPresetsMinutes: [25, 50, 90],
  minSessionMinutes: 5,
  maxSessionMinutes: 180,
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

/**
 * Boss bounty defaults (Product Spec §13.1): bonus GP for timely defeat.
 * early = before the target date; byTarget = on the target date;
 * byDeadline = after the target but by the hard deadline; late = after.
 * Snapshotted onto the Boss when designated.
 */
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

/**
 * Questline completion bonus, as a share of the snapshotted rewards of the
 * Questline's Quests. Awarded once, to the Questline's Skill.
 */
export const QUESTLINE_BONUS = {
  xpShare: 0.25,
  gpShare: 0.25,
} as const;

/** Combat Points per Combat Achievement tier (permanent, non-spendable). */
export const COMBAT_POINTS_BY_TIER = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
  ELITE: 4,
  MASTER: 5,
  GRANDMASTER: 6,
} as const;

/**
 * Achievement Diary tier rewards: GP plus bonus Focus XP (Diaries reward
 * consistency). Each tier is claimed once per Diary, in order.
 */
export const DIARY_REWARDS = {
  WEEKLY: {
    EASY: { gp: 10, focusXp: 50 },
    MEDIUM: { gp: 20, focusXp: 100 },
    HARD: { gp: 35, focusXp: 200 },
    ELITE: { gp: 50, focusXp: 350 },
  },
  MONTHLY: {
    EASY: { gp: 30, focusXp: 150 },
    MEDIUM: { gp: 60, focusXp: 300 },
    HARD: { gp: 100, focusXp: 600 },
    ELITE: { gp: 150, focusXp: 1_000 },
  },
} as const;

export const GAME_BALANCE = {
  xpCurve: XP_CURVE,
  questRewards: QUEST_REWARDS,
  focusXp: FOCUS_XP,
  bossBounty: BOSS_BOUNTY,
  questlineBonus: QUESTLINE_BONUS,
  combatPointsByTier: COMBAT_POINTS_BY_TIER,
  diaryRewards: DIARY_REWARDS,
  respawnThresholds: RESPAWN_THRESHOLDS,
  mainQuestCap: MAIN_QUEST_CAP,
} as const;
