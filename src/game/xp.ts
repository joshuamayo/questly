/**
 * XP + Level engine. Deterministic and pure: every screen consumes this output
 * rather than computing levels itself (CLAUDE.md §11).
 */

import { XP_CURVE, type XpCurveConfig } from "./config/balance";

export type XpCurve = {
  config: XpCurveConfig;
  /** thresholds[L] = minimum XP to be Level L. Index 0 is unused. */
  thresholds: readonly number[];
};

export function buildXpCurve(config: XpCurveConfig): XpCurve {
  const thresholds: number[] = [0, 0];
  let points = 0;
  for (let level = 2; level <= config.maxLevel; level++) {
    const l = level - 1;
    points += Math.floor(
      l * config.linearFactor +
        config.exponentialBase * Math.pow(2, l / config.doublingInterval),
    );
    thresholds[level] = Math.floor(points / config.divisor);
  }
  for (let level = 2; level <= config.maxLevel; level++) {
    if (thresholds[level] <= thresholds[level - 1]) {
      throw new Error(
        `XP curve is not strictly increasing at level ${level}; adjust XP_CURVE.`,
      );
    }
  }
  if (thresholds[config.maxLevel] > config.maxXp) {
    throw new Error("XP curve max-level threshold exceeds maxXp.");
  }
  return { config, thresholds };
}

/** The live curve used by the game. */
export const DEFAULT_XP_CURVE: XpCurve = buildXpCurve(XP_CURVE);

function assertValidXp(xp: number): void {
  if (!Number.isInteger(xp) || xp < 0) {
    throw new RangeError(`XP must be a non-negative integer, received ${xp}.`);
  }
}

/** Minimum total XP required to reach `level`. */
export function xpForLevel(level: number, curve: XpCurve = DEFAULT_XP_CURVE): number {
  const { maxLevel } = curve.config;
  if (!Number.isInteger(level) || level < 1 || level > maxLevel) {
    throw new RangeError(`Level must be an integer from 1 to ${maxLevel}.`);
  }
  return curve.thresholds[level];
}

/** Level for a total XP amount (1–maxLevel). */
export function levelForXp(xp: number, curve: XpCurve = DEFAULT_XP_CURVE): number {
  assertValidXp(xp);
  const { thresholds } = curve;
  let lo = 1;
  let hi = curve.config.maxLevel;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (thresholds[mid] <= xp) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export type LevelProgress = {
  level: number;
  totalXp: number;
  /** XP threshold of the current level. */
  currentLevelXp: number;
  /** XP threshold of the next level, or null at max level. */
  nextLevelXp: number | null;
  /** XP earned since reaching the current level. */
  xpIntoLevel: number;
  /** XP span between current and next level (0 at max level). */
  xpForLevelSpan: number;
  /** XP still needed for the next level (0 at max level). */
  xpRemaining: number;
  /** 0–100, rounded down to one decimal. 100 at max level. */
  percentToNext: number;
  isMaxLevel: boolean;
};

export function getLevelProgress(
  xp: number,
  curve: XpCurve = DEFAULT_XP_CURVE,
): LevelProgress {
  const level = levelForXp(xp, curve);
  const currentLevelXp = curve.thresholds[level];
  const isMaxLevel = level === curve.config.maxLevel;
  if (isMaxLevel) {
    return {
      level,
      totalXp: xp,
      currentLevelXp,
      nextLevelXp: null,
      xpIntoLevel: xp - currentLevelXp,
      xpForLevelSpan: 0,
      xpRemaining: 0,
      percentToNext: 100,
      isMaxLevel,
    };
  }
  const nextLevelXp = curve.thresholds[level + 1];
  const span = nextLevelXp - currentLevelXp;
  const into = xp - currentLevelXp;
  return {
    level,
    totalXp: xp,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel: into,
    xpForLevelSpan: span,
    xpRemaining: nextLevelXp - xp,
    percentToNext: Math.floor((into / span) * 1000) / 10,
    isMaxLevel,
  };
}

export type XpGainResult = {
  previousXp: number;
  newXp: number;
  /** XP actually applied after the maxXp ceiling. */
  appliedXp: number;
  previousLevel: number;
  newLevel: number;
  levelsGained: number;
  leveledUp: boolean;
  /** Every level newly reached, in order (e.g. [12, 13, 14]). */
  levelsReached: number[];
};

/** Evaluate an XP reward against an existing total. Does not mutate anything. */
export function applyXpGain(
  previousXp: number,
  gainedXp: number,
  curve: XpCurve = DEFAULT_XP_CURVE,
): XpGainResult {
  assertValidXp(previousXp);
  if (!Number.isInteger(gainedXp) || gainedXp <= 0) {
    throw new RangeError(`XP gain must be a positive integer, received ${gainedXp}.`);
  }
  const newXp = Math.min(previousXp + gainedXp, curve.config.maxXp);
  const previousLevel = levelForXp(previousXp, curve);
  const newLevel = levelForXp(newXp, curve);
  const levelsReached: number[] = [];
  for (let l = previousLevel + 1; l <= newLevel; l++) levelsReached.push(l);
  return {
    previousXp,
    newXp,
    appliedXp: newXp - previousXp,
    previousLevel,
    newLevel,
    levelsGained: newLevel - previousLevel,
    leveledUp: newLevel > previousLevel,
    levelsReached,
  };
}

export type MasteryProgress = {
  /** XP threshold for the maximum level (99). */
  maxLevelXp: number;
  /** XP still needed to reach the maximum level (0 once reached). */
  xpRemaining: number;
  /** 0–100 toward the maximum level, rounded down to one decimal. */
  percent: number;
};

/** Progress toward Level 99 (the Skill Cape), from total XP. */
export function getMasteryProgress(xp: number, curve: XpCurve = DEFAULT_XP_CURVE): MasteryProgress {
  assertValidXp(xp);
  const maxLevelXp = curve.thresholds[curve.config.maxLevel];
  return {
    maxLevelXp,
    xpRemaining: Math.max(0, maxLevelXp - xp),
    percent: Math.min(100, Math.floor((xp / maxLevelXp) * 1000) / 10),
  };
}
