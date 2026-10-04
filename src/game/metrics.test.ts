import { describe, expect, it } from "vitest";
import { COLLECTION_ITEMS } from "./content/collection";
import { COMBAT_ACHIEVEMENTS } from "./content/combat-achievements";
import { DIARY_ENTRIES } from "./content/diaries";
import { countAtDifficulty, emptyMetrics, metricValue, ruleProgress } from "./metrics";

describe("tracking rules", () => {
  it("measure progress toward a target", () => {
    const m = { ...emptyMetrics(), questsCompleted: 7 };
    expect(ruleProgress({ metric: "questsCompleted", target: 10 }, m)).toEqual({ current: 7, target: 10, percent: 70, complete: false });
    expect(ruleProgress({ metric: "questsCompleted", target: 5 }, m)).toMatchObject({ current: 5, complete: true });
  });

  it("support difficulty and skill parameters", () => {
    const m = { ...emptyMetrics(), questsAtDifficulty: countAtDifficulty(["NOVICE", "MASTER", "GRANDMASTER"]), skillLevels: { creator: 42 } };
    expect(metricValue({ metric: "questsAtDifficulty", difficulty: "MASTER", target: 1 }, m)).toBe(2);
    expect(metricValue({ metric: "questsAtDifficulty", difficulty: "NOVICE", target: 1 }, m)).toBe(3);
    expect(metricValue({ metric: "skillLevel", skill: "creator", target: 50 }, m)).toBe(42);
    expect(metricValue({ metric: "skillLevel", skill: "home", target: 50 }, m)).toBe(1);
  });
});

describe("seed content", () => {
  it("meets the spec's Combat Achievement counts per tier", () => {
    const count = (t: string) => COMBAT_ACHIEVEMENTS.filter((a) => a.tier === t).length;
    expect([count("EASY"), count("MEDIUM"), count("HARD"), count("ELITE"), count("MASTER"), count("GRANDMASTER")]).toEqual([8, 8, 8, 6, 4, 2]);
    expect(new Set(COMBAT_ACHIEVEMENTS.map((a) => a.key)).size).toBe(COMBAT_ACHIEVEMENTS.length);
  });

  it("has at least 40 Collection slots, including secret ones, in the six categories", () => {
    expect(COLLECTION_ITEMS.length).toBeGreaterThanOrEqual(40);
    expect(COLLECTION_ITEMS.some((i) => i.secret)).toBe(true);
    expect(new Set(COLLECTION_ITEMS.map((i) => i.category))).toEqual(new Set(["creator", "business", "finance", "fitness", "home", "general"]));
    expect(new Set(COLLECTION_ITEMS.map((i) => i.key)).size).toBe(COLLECTION_ITEMS.length);
  });

  it("gives every Diary tier at least one entry for both periods", () => {
    for (const period of ["WEEKLY", "MONTHLY"]) {
      for (const tier of ["EASY", "MEDIUM", "HARD", "ELITE"]) {
        expect(DIARY_ENTRIES.some((e) => e.period === period && e.tier === tier)).toBe(true);
      }
    }
  });
});
