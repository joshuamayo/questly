import { describe, expect, it } from "vitest";
import {
  activeStatusFor,
  allocateObjectiveXp,
  assertCanPerform,
  assertMainQuestCapacity,
  canPerform,
  dateCondition,
  describeDayOffset,
  normalizeDate,
  questProgress,
  QuestRuleError,
  rewardsFor,
  validateQuestDraft,
} from "./quests";

const base = { title: "Publish a video", skillKey: "creator", difficulty: "EXPERIENCED" };

describe("validateQuestDraft", () => {
  it("normalizes a minimal draft with sensible defaults", () => {
    expect(validateQuestDraft({ ...base, title: "  Publish a video  ", objectives: [" Script ", "", "Record"] })).toEqual({
      title: "Publish a video",
      description: "",
      skillKey: "creator",
      difficulty: "EXPERIENCED",
      targetDate: null,
      deadline: null,
      priority: "SIDE",
      objectives: ["Script", "Record"],
      notes: "",
    });
  });

  it("requires a name, a canonical Skill, and a valid difficulty", () => {
    expect(() => validateQuestDraft({ ...base, title: "   " })).toThrow(QuestRuleError);
    expect(() => validateQuestDraft({ ...base, skillKey: "family" })).toThrow(/six Skills/);
    expect(() => validateQuestDraft({ ...base, difficulty: "MEDIUM" })).toThrow(/difficulty/);
  });

  it("keeps the target date on or before the hard deadline", () => {
    expect(() => validateQuestDraft({ ...base, targetDate: "2026-10-12", deadline: "2026-10-10" })).toThrow(/target date/);
    expect(validateQuestDraft({ ...base, targetDate: "2026-10-10", deadline: "2026-10-12" }).deadline).toBe("2026-10-12");
  });

  it("rejects impossible dates", () => {
    expect(() => normalizeDate("2026-02-31", "Target date")).toThrow(QuestRuleError);
    expect(() => normalizeDate("next week", "Target date")).toThrow(QuestRuleError);
    expect(normalizeDate("", "Target date")).toBeNull();
  });
});

describe("rewards", () => {
  it("derive from difficulty using the balance table", () => {
    expect(rewardsFor("MASTER")).toEqual({ xp: 2000, gp: 40, qp: 5 });
    const custom = { ...Object.fromEntries(["NOVICE", "INTERMEDIATE", "EXPERIENCED", "MASTER", "GRANDMASTER"].map((d) => [d, { xp: 1, gp: 1, qp: 1 }])) } as never;
    expect(rewardsFor("MASTER", custom)).toEqual({ xp: 1, gp: 1, qp: 1 });
  });

  it("split across objectives only for display, always summing to the Quest reward", () => {
    expect(allocateObjectiveXp(750, 4)).toEqual([188, 188, 187, 187]);
    expect(allocateObjectiveXp(750, 7).reduce((a, b) => a + b)).toBe(750);
    expect(allocateObjectiveXp(100, 0)).toEqual([]);
  });
});

describe("questProgress", () => {
  it("reports progress and the Current Step by position", () => {
    const p = questProgress([
      { id: "c", position: 3, completedAt: null },
      { id: "a", position: 1, completedAt: new Date() },
      { id: "b", position: 2, completedAt: null },
    ]);
    expect(p).toEqual({ done: 1, total: 3, percent: 33, currentObjectiveId: "b", allDone: false });
  });

  it("treats a Quest without objectives as ready to complete", () => {
    expect(questProgress([])).toMatchObject({ total: 0, allDone: true, currentObjectiveId: null });
  });
});

describe("dateCondition", () => {
  it("is a condition derived from dates, not a status", () => {
    expect(dateCondition("2026-10-04", "2026-10-10", "2026-10-06")).toEqual({
      daysToTarget: -2,
      daysToDeadline: 4,
      pastTarget: true,
      pastDeadline: false,
    });
    expect(dateCondition(null, null, "2026-10-06")).toMatchObject({ pastTarget: false, pastDeadline: false });
  });

  it("describes day offsets", () => {
    expect(describeDayOffset(0)).toBe("Today");
    expect(describeDayOffset(1)).toBe("Tomorrow");
    expect(describeDayOffset(5)).toBe("in 5 days");
    expect(describeDayOffset(-3)).toBe("3 days ago");
  });
});

describe("transitions", () => {
  it("allow only sensible actions per status", () => {
    expect(canPerform("COMPLETE", "IN_PROGRESS")).toBe(true);
    expect(canPerform("COMPLETE", "ON_HOLD")).toBe(false);
    expect(canPerform("RESTORE", "ABANDONED")).toBe(true);
    expect(() => assertCanPerform("COMPLETE", "COMPLETED")).toThrow(/already complete/);
    expect(() => assertCanPerform("COMPLETE_OBJECTIVE", "ABANDONED")).toThrow(/Restore/);
  });

  it("resume to In Progress only when an objective is done", () => {
    expect(activeStatusFor({ done: 0 })).toBe("ACCEPTED");
    expect(activeStatusFor({ done: 2 })).toBe("IN_PROGRESS");
  });

  it("cap Main Quests at three", () => {
    expect(() => assertMainQuestCapacity(2)).not.toThrow();
    expect(() => assertMainQuestCapacity(3)).toThrow(/3 Main Quests/);
  });
});
