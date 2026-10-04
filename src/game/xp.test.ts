import { describe, expect, it } from "vitest";
import { XP_CURVE } from "./config/balance";
import {
  applyXpGain,
  buildXpCurve,
  DEFAULT_XP_CURVE,
  getLevelProgress,
  getMasteryProgress,
  levelForXp,
  xpForLevel,
} from "./xp";

const MAX = XP_CURVE.maxLevel;
const t = (level: number) => xpForLevel(level);

describe("XP curve", () => {
  it("supports exactly Levels 1–99 with Level 1 at 0 XP", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(() => xpForLevel(0)).toThrow(RangeError);
    expect(() => xpForLevel(MAX + 1)).toThrow(RangeError);
  });

  it("is strictly increasing and exponential (XP per level grows)", () => {
    for (let level = 2; level <= MAX; level++) expect(t(level)).toBeGreaterThan(t(level - 1));
    const earlyGap = t(11) - t(10);
    const lateGap = t(91) - t(90);
    expect(lateGap).toBeGreaterThan(earlyGap * 100);
  });

  it("keeps the classic shape: Level 92 is roughly half of Level 99", () => {
    expect(t(92) / t(99)).toBeGreaterThan(0.45);
    expect(t(92) / t(99)).toBeLessThan(0.55);
  });

  it("is deterministic and rejects non-increasing configurations", () => {
    expect(buildXpCurve(XP_CURVE).thresholds).toEqual(DEFAULT_XP_CURVE.thresholds);
    expect(() => buildXpCurve({ ...XP_CURVE, exponentialBase: 0, linearFactor: 0 })).toThrow();
  });
});

describe("levelForXp", () => {
  it("is Level 1 at 0 XP and just below the Level 2 threshold", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(t(2) - 1)).toBe(1);
  });

  it("reaches a level exactly at its threshold", () => {
    for (const level of [2, 10, 50, 98, 99]) {
      expect(levelForXp(t(level))).toBe(level);
      expect(levelForXp(t(level) - 1)).toBe(level - 1);
    }
  });

  it("caps at Level 99 for XP beyond the Level 99 threshold", () => {
    expect(levelForXp(t(99) + 1)).toBe(99);
    expect(levelForXp(XP_CURVE.maxXp)).toBe(99);
  });

  it("rejects invalid XP", () => {
    expect(() => levelForXp(-1)).toThrow(RangeError);
    expect(() => levelForXp(1.5)).toThrow(RangeError);
  });
});

describe("getLevelProgress", () => {
  it("describes Level 1 at 0 XP", () => {
    expect(getLevelProgress(0)).toEqual({
      level: 1,
      totalXp: 0,
      currentLevelXp: 0,
      nextLevelXp: t(2),
      xpIntoLevel: 0,
      xpForLevelSpan: t(2),
      xpRemaining: t(2),
      percentToNext: 0,
      isMaxLevel: false,
    });
  });

  it("reports thresholds, remaining XP, and percentage mid-level", () => {
    const halfway = t(50) + Math.floor((t(51) - t(50)) / 2);
    const p = getLevelProgress(halfway);
    expect(p.level).toBe(50);
    expect(p.currentLevelXp).toBe(t(50));
    expect(p.nextLevelXp).toBe(t(51));
    expect(p.xpIntoLevel + p.xpRemaining).toBe(p.xpForLevelSpan);
    expect(p.percentToNext).toBeGreaterThanOrEqual(49.9);
    expect(p.percentToNext).toBeLessThanOrEqual(50);
  });

  it("is 0% exactly at a threshold", () => {
    const p = getLevelProgress(t(30));
    expect(p.level).toBe(30);
    expect(p.xpIntoLevel).toBe(0);
    expect(p.percentToNext).toBe(0);
  });

  it("is complete at Level 99, including XP beyond the threshold", () => {
    for (const xp of [t(99), t(99) + 250_000]) {
      const p = getLevelProgress(xp);
      expect(p.level).toBe(99);
      expect(p.isMaxLevel).toBe(true);
      expect(p.nextLevelXp).toBeNull();
      expect(p.xpRemaining).toBe(0);
      expect(p.percentToNext).toBe(100);
      expect(p.xpIntoLevel).toBe(xp - t(99));
    }
  });
});

describe("applyXpGain", () => {
  it("detects no level-up when staying within a level", () => {
    const r = applyXpGain(0, t(2) - 1);
    expect(r.leveledUp).toBe(false);
    expect(r.levelsGained).toBe(0);
    expect(r.levelsReached).toEqual([]);
  });

  it("detects a single level-up when landing exactly on a threshold", () => {
    const r = applyXpGain(t(10) - 1, 1);
    expect(r).toMatchObject({ previousLevel: 9, newLevel: 10, levelsGained: 1, leveledUp: true, levelsReached: [10] });
  });

  it("detects multiple level-ups from one reward", () => {
    const r = applyXpGain(0, 5_000);
    expect(r.previousLevel).toBe(1);
    expect(r.newLevel).toBe(levelForXp(5_000));
    expect(r.levelsGained).toBeGreaterThan(1);
    expect(r.levelsReached).toHaveLength(r.levelsGained);
    expect(r.levelsReached[0]).toBe(2);
    expect(r.levelsReached.at(-1)).toBe(r.newLevel);
  });

  it("reaches Level 99 and keeps accruing XP without further levels", () => {
    const to99 = applyXpGain(t(98), t(99) - t(98));
    expect(to99.newLevel).toBe(99);
    expect(to99.levelsReached).toEqual([99]);
    const beyond = applyXpGain(t(99), 10_000);
    expect(beyond.newXp).toBe(t(99) + 10_000);
    expect(beyond.leveledUp).toBe(false);
  });

  it("clamps at the maximum stored XP", () => {
    const r = applyXpGain(XP_CURVE.maxXp - 10, 100);
    expect(r.newXp).toBe(XP_CURVE.maxXp);
    expect(r.appliedXp).toBe(10);
  });

  it("rejects non-positive or fractional gains", () => {
    expect(() => applyXpGain(0, 0)).toThrow(RangeError);
    expect(() => applyXpGain(0, -5)).toThrow(RangeError);
    expect(() => applyXpGain(0, 2.5)).toThrow(RangeError);
  });
});

describe("getMasteryProgress", () => {
  it("measures progress toward Level 99", () => {
    expect(getMasteryProgress(0)).toEqual({ maxLevelXp: t(99), xpRemaining: t(99), percent: 0 });
    const half = getMasteryProgress(Math.floor(t(99) / 2));
    expect(half.percent).toBeGreaterThanOrEqual(49.9);
    expect(getMasteryProgress(t(99) + 5)).toMatchObject({ xpRemaining: 0, percent: 100 });
  });
});
