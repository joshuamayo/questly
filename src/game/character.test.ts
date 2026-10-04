import { describe, expect, it } from "vitest";
import { adventureDay, describeAccountAge, MAX_TOTAL_LEVEL, nearestLevelUp, totalLevel, totalXp } from "./character";
import { SKILL_DEFINITIONS } from "./content/skills";
import { SKILL_KEYS } from "./vocabulary";
import { getLevelProgress, xpForLevel } from "./xp";

describe("canonical skills", () => {
  it("are exactly the six V1 Skills", () => {
    expect(SKILL_KEYS).toEqual(["creator", "business", "finance", "fitness", "home", "focus"]);
    expect(SKILL_DEFINITIONS.map((s) => s.name)).toEqual(["Creator", "Business", "Finance", "Fitness", "Home", "Focus"]);
  });
});

describe("Total Level", () => {
  it("is 6 for a brand-new character (six Skills at Level 1)", () => {
    expect(totalLevel({})).toBe(6);
  });

  it("sums the six Skill levels", () => {
    expect(
      totalLevel({
        creator: xpForLevel(40),
        business: xpForLevel(12) + 3,
        finance: 0,
        fitness: xpForLevel(2),
        home: xpForLevel(5) - 1,
        focus: xpForLevel(99),
      }),
    ).toBe(40 + 12 + 1 + 2 + 4 + 99);
  });

  it("maxes at 594", () => {
    expect(MAX_TOTAL_LEVEL).toBe(594);
    const maxed = Object.fromEntries(SKILL_KEYS.map((k) => [k, xpForLevel(99) + 1_000_000]));
    expect(totalLevel(maxed)).toBe(594);
  });

  it("sums total XP", () => {
    expect(totalXp({ creator: 100, focus: 250 })).toBe(350);
  });
});

describe("account age", () => {
  const created = new Date("2026-01-15T10:00:00Z");
  it("counts adventure days from Day 1", () => {
    expect(adventureDay(created, new Date("2026-01-15T23:00:00Z"))).toBe(1);
    expect(adventureDay(created, new Date("2026-01-16T01:00:00Z"))).toBe(2);
  });
  it("describes age in days, months, and years", () => {
    expect(describeAccountAge(created, new Date("2026-01-15T12:00:00Z"))).toBe("Founded today");
    expect(describeAccountAge(created, new Date("2026-01-18T12:00:00Z"))).toBe("3 days");
    expect(describeAccountAge(created, new Date("2026-04-20T12:00:00Z"))).toBe("3 months");
    expect(describeAccountAge(created, new Date("2027-03-20T12:00:00Z"))).toBe("1 year, 2 months");
  });
});

describe("nearestLevelUp", () => {
  const p = (xp: number) => ({ progress: getLevelProgress(xp) });
  it("picks the Skill with the highest progress toward its next level", () => {
    const skills = [p(0), p(xpForLevel(20) + 1), p(xpForLevel(5) + Math.floor((xpForLevel(6) - xpForLevel(5)) * 0.9))];
    expect(nearestLevelUp(skills)).toBe(skills[2]);
  });
  it("ignores maxed Skills", () => {
    expect(nearestLevelUp([p(xpForLevel(99))])).toBeNull();
  });
});
