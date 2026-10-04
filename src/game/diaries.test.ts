import { describe, expect, it } from "vitest";
import { assertClaimable, daysRemaining, periodFor, tierStates } from "./diaries";

describe("Diary periods", () => {
  it("honor the configured week start", () => {
    // 2026-10-07 is a Wednesday.
    expect(periodFor("WEEKLY", "2026-10-07", 1)).toMatchObject({ start: "2026-10-05", end: "2026-10-12" });
    expect(periodFor("WEEKLY", "2026-10-07", 0)).toMatchObject({ start: "2026-10-04", end: "2026-10-11" });
    expect(periodFor("WEEKLY", "2026-10-05", 1).start).toBe("2026-10-05");
  });

  it("compute months, including December", () => {
    expect(periodFor("MONTHLY", "2026-10-17")).toMatchObject({ start: "2026-10-01", end: "2026-11-01", label: "October 2026" });
    expect(periodFor("MONTHLY", "2026-12-31")).toMatchObject({ start: "2026-12-01", end: "2027-01-01" });
  });

  it("count days remaining", () => {
    expect(daysRemaining(periodFor("MONTHLY", "2026-10-04"), "2026-10-04")).toBe(28);
  });
});

describe("Diary tiers", () => {
  const entries = [
    { tier: "EASY" as const, complete: true },
    { tier: "EASY" as const, complete: true },
    { tier: "MEDIUM" as const, complete: true },
    { tier: "HARD" as const, complete: false },
  ];

  it("complete when every entry is complete", () => {
    const s = tierStates(entries, new Set());
    expect(s.map((t) => [t.tier, t.complete])).toEqual([
      ["EASY", true],
      ["MEDIUM", true],
      ["HARD", false],
      ["ELITE", false],
    ]);
  });

  it("must be claimed in order and only once", () => {
    const fresh = tierStates(entries, new Set());
    expect(fresh[0].claimable).toBe(true);
    expect(fresh[1].claimable).toBe(false);
    expect(() => assertClaimable(fresh[1])).toThrow(/lower tiers/);
    const afterEasy = tierStates(entries, new Set(["EASY"]));
    expect(afterEasy[1].claimable).toBe(true);
    expect(() => assertClaimable(afterEasy[0])).toThrow(/already been claimed/);
    expect(() => assertClaimable(afterEasy[2])).toThrow(/every entry/);
  });
});
