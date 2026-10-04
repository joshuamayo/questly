import { describe, expect, it } from "vitest";
import { InsufficientGpError } from "./errors";
import { assertCanSpend, projectGp } from "./gp";
import { deriveQuestLog, insertIndex, moveInOrder, sortQuestLog, validateQuestInput } from "./quests";
import { affordability, savingsProgress, validateReward } from "./rewards";
import { DEFAULT_SETTINGS, normalizeSettings, validateSettingsPatch } from "./settings";

const q = (id: string, position: number, createdAt = "2026-10-01T00:00:00Z") => ({ id, position, createdAt });

describe("Quest Log ordering", () => {
  it("first active is Current, the rest are Locked", () => {
    const { current, locked } = deriveQuestLog([q("c", 2), q("a", 0), q("b", 1)]);
    expect(current?.id).toBe("a");
    expect(locked.map((x) => x.id)).toEqual(["b", "c"]);
  });

  it("is empty-safe", () => {
    expect(deriveQuestLog([])).toEqual({ current: null, locked: [] });
  });

  it("breaks ties deterministically (created time, then id)", () => {
    const list = sortQuestLog([q("b", 0, "2026-10-02T00:00:00Z"), q("z", 0, "2026-10-01T00:00:00Z"), q("a", 0, "2026-10-02T00:00:00Z")]);
    expect(list.map((x) => x.id)).toEqual(["z", "a", "b"]);
  });

  it("reordering changes Current", () => {
    const ids = moveInOrder(["q3", "q4"], "q4", 0);
    expect(ids).toEqual(["q4", "q3"]);
    expect(moveInOrder(["a", "b", "c"], "a", 99)).toEqual(["b", "c", "a"]);
    expect(() => moveInOrder(["a"], "x", 0)).toThrow();
  });

  it("resolves insert positions", () => {
    expect(insertIndex(undefined, 4)).toBe(4);
    expect(insertIndex("end", 4)).toBe(4);
    expect(insertIndex("top", 4)).toBe(0);
    expect(insertIndex("next", 4)).toBe(1);
    expect(insertIndex("next", 0)).toBe(0);
  });
});

describe("Quest input", () => {
  it("needs only a title and uses the default GP", () => {
    expect(validateQuestInput({ title: "  Record video  " }, 15)).toEqual({ title: "Record video", description: "", gpReward: 15 });
  });
  it("rejects bad values", () => {
    expect(() => validateQuestInput({ title: " " })).toThrow(/title/);
    expect(() => validateQuestInput({ title: "x", gpReward: -1 })).toThrow(/GP/);
    expect(() => validateQuestInput({ title: "x", gpReward: 1.5 })).toThrow(/GP/);
    expect(() => validateQuestInput({ title: "x".repeat(121) })).toThrow();
  });
});

describe("GP", () => {
  it("cannot spend more than the balance", () => {
    expect(() => assertCanSpend(10, 25)).toThrow(InsufficientGpError);
    expect(() => assertCanSpend(10, 25)).toThrow("You need 25 GP to redeem this reward. You have 10 GP.");
    expect(() => assertCanSpend(25, 25)).not.toThrow();
  });
  it("projects the ledger", () => {
    expect(projectGp([20, 15, -10])).toEqual({ gpBalance: 25, lifetimeGpEarned: 35, lifetimeGpSpent: 10 });
  });
});

describe("Rewards", () => {
  it("validates and defaults the icon", () => {
    expect(validateReward({ name: " Favorite Lunch ", gpCost: 25, repeatable: true })).toMatchObject({ name: "Favorite Lunch", icon: "gift" });
    expect(() => validateReward({ name: "", gpCost: 5, repeatable: true })).toThrow();
    expect(() => validateReward({ name: "x", gpCost: 0, repeatable: true })).toThrow();
  });
  it("reports affordability and savings progress", () => {
    expect(affordability(182, 300)).toEqual({ affordable: false, shortfall: 118 });
    expect(savingsProgress(182, 300)).toEqual({ current: 182, target: 300, percent: 60 });
    expect(savingsProgress(500, 300)).toEqual({ current: 300, target: 300, percent: 100 });
  });
});

describe("Settings", () => {
  it("normalizes unknown JSON", () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ defaultQuestGp: -5, sound: "yes", background: "forest", motion: "reduce" })).toMatchObject({
      defaultQuestGp: 10,
      sound: false,
      background: "forest",
      motion: "reduce",
    });
  });
  it("validates patches strictly", () => {
    expect(validateSettingsPatch({ defaultQuestGp: 20, sound: true })).toEqual({ defaultQuestGp: 20, sound: true });
    expect(() => validateSettingsPatch({ defaultQuestGp: -1 })).toThrow();
    expect(() => validateSettingsPatch({ background: "space" as never })).toThrow();
  });
});
