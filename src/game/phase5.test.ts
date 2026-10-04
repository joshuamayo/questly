import { describe, expect, it } from "vitest";
import { QUEST_REWARDS, MAIN_QUEST_CAP } from "./config/balance";
import { attentionReason, recommendQuests, weekDates, type RecommendationCandidate } from "./planning";
import { respawnSuggestion } from "./respawn";
import { affordability, validateReward } from "./rewards";
import { DEFAULT_SETTINGS, effectiveBalance, isOnVacation, isWorkday, normalizeSettings, validateBalanceOverrides } from "./settings";
import { computeStreak, deadlineStreak, missedWorkdays, shieldableGap } from "./streaks";

// 2026-10-05 is a Monday.
const weekdays = { workdays: [1, 2, 3, 4, 5], vacations: [] };

describe("Settings", () => {
  it("normalizes unknown JSON to complete, safe settings", () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    const s = normalizeSettings({ weekStart: 9, workdays: [5, 1, 1, 8], focusDefaultMinutes: 50, motion: "reduce", vacations: [{ start: "2026-10-01", end: null }, { start: "bad" }] });
    expect(s.weekStart).toBe(1);
    expect(s.workdays).toEqual([1, 5]);
    expect(s.focusDefaultMinutes).toBe(50);
    expect(s.motion).toBe("reduce");
    expect(s.vacations).toEqual([{ start: "2026-10-01", end: null }]);
  });

  it("knows workdays and vacations", () => {
    expect(isWorkday(weekdays, "2026-10-05")).toBe(true);
    expect(isWorkday(weekdays, "2026-10-04")).toBe(false);
    expect(isOnVacation({ vacations: [{ start: "2026-10-01", end: "2026-10-03" }] }, "2026-10-03")).toBe(true);
    expect(isOnVacation({ vacations: [{ start: "2026-10-01", end: "2026-10-03" }] }, "2026-10-04")).toBe(false);
    expect(isOnVacation({ vacations: [{ start: "2026-10-01", end: null }] }, "2027-01-01")).toBe(true);
  });
});

describe("Game Balance overrides", () => {
  it("defaults to the canonical balance", () => {
    const b = effectiveBalance(undefined);
    expect(b.questRewards).toEqual(QUEST_REWARDS);
    expect(b.mainQuestCap).toBe(MAIN_QUEST_CAP);
  });

  it("merges valid overrides", () => {
    const b = effectiveBalance({ questRewards: { NOVICE: { xp: 150, gp: 3, qp: 1 } }, mainQuestCap: 2, bounty: { earlyGp: 50 } });
    expect(b.questRewards.NOVICE).toEqual({ xp: 150, gp: 3, qp: 1 });
    expect(b.questRewards.MASTER).toEqual(QUEST_REWARDS.MASTER);
    expect(b.mainQuestCap).toBe(2);
    expect(b.bounty.earlyGp).toBe(50);
    expect(b.bounty.byTargetGp).toBe(20);
  });

  it("rejects invalid values when saving and ignores them when reading", () => {
    expect(() => validateBalanceOverrides({ mainQuestCap: 0 })).toThrow(/Main Quest cap/);
    expect(() => validateBalanceOverrides({ questRewards: { NOVICE: { xp: -1, gp: 0, qp: 0 } } })).toThrow();
    expect(effectiveBalance({ mainQuestCap: 0 }).mainQuestCap).toBe(MAIN_QUEST_CAP);
  });
});

describe("Streaks", () => {
  it("counts consecutive planned workdays and skips rest days", () => {
    // Thu, Fri, (weekend), Mon
    const days = new Set(["2026-10-01", "2026-10-02", "2026-10-05"]);
    expect(computeStreak(days, new Set(), weekdays, "2026-10-05")).toEqual({ current: 3, best: 3, activeToday: true });
  });

  it("today never breaks a streak", () => {
    const days = new Set(["2026-10-01", "2026-10-02"]);
    expect(computeStreak(days, new Set(), weekdays, "2026-10-05").current).toBe(2);
  });

  it("a missed workday breaks it, but the personal best remains", () => {
    const days = new Set(["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-05"]);
    expect(computeStreak(days, new Set(), weekdays, "2026-10-05")).toMatchObject({ current: 1, best: 3 });
  });

  it("shields and vacations protect missed workdays", () => {
    const days = new Set(["2026-10-01", "2026-10-05"]);
    expect(computeStreak(days, new Set(["2026-10-02"]), weekdays, "2026-10-05").current).toBe(2);
    expect(computeStreak(days, new Set(), { ...weekdays, vacations: [{ start: "2026-10-02", end: "2026-10-02" }] }, "2026-10-05").current).toBe(2);
  });

  it("finds the shieldable gap since the last active day", () => {
    const days = new Set(["2026-10-01"]);
    expect(shieldableGap(days, new Set(), weekdays, "2026-10-06")).toEqual(["2026-10-02", "2026-10-05"]);
    expect(shieldableGap(days, new Set(["2026-10-02"]), weekdays, "2026-10-06")).toEqual(["2026-10-05"]);
    expect(shieldableGap(new Set(), new Set(), weekdays, "2026-10-06")).toEqual([]);
  });

  it("deadline streak counts on-time completions in order", () => {
    expect(deadlineStreak([true, true, false, true])).toEqual({ current: 1, best: 2 });
    expect(deadlineStreak([])).toEqual({ current: 0, best: 0 });
  });

  it("counts consecutive missed workdays", () => {
    expect(missedWorkdays(new Set(["2026-09-30"]), weekdays, "2026-10-06")).toBe(3); // Thu, Fri, Mon
    expect(missedWorkdays(new Set(["2026-10-05"]), weekdays, "2026-10-06")).toBe(0);
  });
});

describe("Reward Shop rules", () => {
  it("validates rewards", () => {
    expect(validateReward({ name: " Gaming Afternoon ", category: "GAMING", gpCost: 50, repeatable: true })).toMatchObject({ name: "Gaming Afternoon", icon: "shop" });
    expect(() => validateReward({ name: "", category: "GAMING", gpCost: 5, repeatable: true })).toThrow();
    expect(() => validateReward({ name: "X", category: "NOPE", gpCost: 5, repeatable: true })).toThrow();
    expect(() => validateReward({ name: "X", category: "GAMING", gpCost: 0, repeatable: true })).toThrow();
    expect(() => validateReward({ name: "X", category: "GAMING", gpCost: 1.5, repeatable: true })).toThrow();
  });

  it("reports affordability", () => {
    expect(affordability(40, 50)).toEqual({ affordable: false, shortfall: 10 });
    expect(affordability(50, 50)).toEqual({ affordable: true, shortfall: 0 });
  });
});

describe("Respawn suggestion", () => {
  const base = { missedWorkdays: 0, questsNeedingAttention: 0, dismissedUntil: null, today: "2026-10-05", hasHistory: true };
  it("suggests at the thresholds", () => {
    expect(respawnSuggestion({ ...base, missedWorkdays: 3 })).toMatchObject({ suggested: true, trigger: "MISSED_WORKDAYS" });
    expect(respawnSuggestion({ ...base, questsNeedingAttention: 5 })).toMatchObject({ suggested: true, trigger: "QUESTS_NEED_ATTENTION" });
    expect(respawnSuggestion({ ...base, missedWorkdays: 2, questsNeedingAttention: 4 }).suggested).toBe(false);
  });
  it("respects dismissal and new accounts", () => {
    expect(respawnSuggestion({ ...base, missedWorkdays: 9, dismissedUntil: "2026-10-05" }).suggested).toBe(false);
    expect(respawnSuggestion({ ...base, missedWorkdays: 9, dismissedUntil: "2026-10-04" }).suggested).toBe(true);
    expect(respawnSuggestion({ ...base, missedWorkdays: 9, hasHistory: false }).suggested).toBe(false);
  });
  it("uses configurable thresholds", () => {
    expect(respawnSuggestion({ ...base, missedWorkdays: 2 }, { missedPlannedWorkdays: 2, questsNeedingAttention: 9 }).suggested).toBe(true);
  });
});

describe("Planning", () => {
  it("lists the week", () => {
    expect(weekDates("2026-10-05")).toEqual(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"]);
  });

  it("flags active Quests past their target or deadline", () => {
    expect(attentionReason({ status: "IN_PROGRESS", targetDate: "2026-10-01", deadline: null }, "2026-10-05")).toBe("PAST_TARGET");
    expect(attentionReason({ status: "ACCEPTED", targetDate: "2026-10-01", deadline: "2026-10-02" }, "2026-10-05")).toBe("PAST_DEADLINE");
    expect(attentionReason({ status: "ACCEPTED", targetDate: "2026-10-05", deadline: null }, "2026-10-05")).toBeNull();
    expect(attentionReason({ status: "COMPLETED", targetDate: "2026-10-01", deadline: null }, "2026-10-05")).toBeNull();
  });

  it("recommends deterministically", () => {
    const q = (id: string, over: Partial<RecommendationCandidate> = {}): RecommendationCandidate => ({
      id, status: "ACCEPTED", priority: "SIDE", isBoss: false, isRespawnQuest: false, targetDate: null, deadline: null, plannedToday: false, progressPercent: 0, ...over,
    });
    const list = [q("a"), q("b", { priority: "MAIN" }), q("c", { isBoss: true }), q("d", { plannedToday: true }), q("e", { status: "ON_HOLD", plannedToday: true })];
    expect(recommendQuests(list, "2026-10-05").map((r) => r.id)).toEqual(["d", "c", "b"]);
    expect(recommendQuests(list, "2026-10-05", 1)[0]).toEqual({ id: "d", reason: "Planned for today." });
    expect(recommendQuests([q("x", { deadline: "2026-10-06" }), q("y", { priority: "MAIN" })], "2026-10-05")[0].id).toBe("x");
  });
});
