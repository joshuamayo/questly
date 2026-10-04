import { describe, expect, it } from "vitest";
import { QUEST_DIFFICULTIES } from "../vocabulary";
import { MAIN_QUEST_CAP, QUEST_REWARDS } from "./balance";

describe("game balance defaults", () => {
  it("matches the canonical Quest reward table", () => {
    expect(QUEST_REWARDS).toEqual({
      NOVICE: { xp: 100, gp: 2, qp: 1 },
      INTERMEDIATE: { xp: 250, gp: 5, qp: 2 },
      EXPERIENCED: { xp: 750, gp: 15, qp: 3 },
      MASTER: { xp: 2000, gp: 40, qp: 5 },
      GRANDMASTER: { xp: 5000, gp: 100, qp: 10 },
    });
    expect(Object.keys(QUEST_REWARDS)).toEqual([...QUEST_DIFFICULTIES]);
  });

  it("recommends at most three Main Quests", () => {
    expect(MAIN_QUEST_CAP).toBe(3);
  });
});
