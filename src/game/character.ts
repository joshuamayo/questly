/**
 * Derived character stats. Pure functions — no persistence.
 */

import { SKILL_KEYS, type SkillKey } from "./vocabulary";
import { DEFAULT_XP_CURVE, getLevelProgress, type LevelProgress, type XpCurve } from "./xp";

/** Maximum V1 Total Level: six Skills × Level 99 = 594. */
export const MAX_TOTAL_LEVEL = SKILL_KEYS.length * DEFAULT_XP_CURVE.config.maxLevel;

export type SkillXpMap = Readonly<Record<SkillKey, number>>;

/** Total Level is the sum of the six Skill levels. Missing skills count as Level 1. */
export function totalLevel(
  skillXp: Partial<SkillXpMap>,
  curve: XpCurve = DEFAULT_XP_CURVE,
): number {
  return SKILL_KEYS.reduce(
    (sum, key) => sum + getLevelProgress(skillXp[key] ?? 0, curve).level,
    0,
  );
}

export function totalXp(skillXp: Partial<SkillXpMap>): number {
  return SKILL_KEYS.reduce((sum, key) => sum + (skillXp[key] ?? 0), 0);
}

export function skillProgressMap(
  skillXp: Partial<SkillXpMap>,
  curve: XpCurve = DEFAULT_XP_CURVE,
): Record<SkillKey, LevelProgress> {
  return Object.fromEntries(
    SKILL_KEYS.map((key) => [key, getLevelProgress(skillXp[key] ?? 0, curve)]),
  ) as Record<SkillKey, LevelProgress>;
}

const MS_PER_DAY = 86_400_000;

/**
 * Whole days since account creation, counted by calendar day in UTC.
 * Day 1 is the creation day ("Day 1 of your adventure").
 */
export function adventureDay(createdAt: Date, now: Date = new Date()): number {
  const start = Date.UTC(createdAt.getUTCFullYear(), createdAt.getUTCMonth(), createdAt.getUTCDate());
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(1, Math.floor((today - start) / MS_PER_DAY) + 1);
}

/** Human account age, e.g. "3 days", "2 months", "1 year, 4 months". */
export function describeAccountAge(createdAt: Date, now: Date = new Date()): string {
  const days = adventureDay(createdAt, now) - 1;
  if (days < 1) return "Founded today";
  if (days < 31) return plural(days, "day");
  const months =
    (now.getUTCFullYear() - createdAt.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - createdAt.getUTCMonth()) -
    (now.getUTCDate() < createdAt.getUTCDate() ? 1 : 0);
  if (months < 12) return plural(Math.max(1, months), "month");
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem ? `${plural(years, "year")}, ${plural(rem, "month")}` : plural(years, "year");
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

/**
 * The Skill closest to its next level (by percentage), for World progress
 * hooks. Returns null when every Skill is maxed.
 */
export function nearestLevelUp<T extends { progress: LevelProgress }>(skills: readonly T[]): T | null {
  let best: T | null = null;
  for (const skill of skills) {
    if (skill.progress.isMaxLevel) continue;
    if (!best || skill.progress.percentToNext > best.progress.percentToNext) best = skill;
  }
  return best;
}
