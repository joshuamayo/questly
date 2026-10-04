import { describe, expect, it } from "vitest";
import { FOCUS_XP } from "./config/balance";
import { assertSessionMinutes, baseFocusXp, focusXpFor, minimumQualifyingMinutes, qualifyingMinutes } from "./focus";

describe("Focus XP", () => {
  it("uses the spec's session tiers", () => {
    expect(baseFocusXp(25)).toBe(0);
    expect(baseFocusXp(30)).toBe(25);
    expect(baseFocusXp(59)).toBe(25);
    expect(baseFocusXp(60)).toBe(60);
    expect(baseFocusXp(90)).toBe(100);
    expect(minimumQualifyingMinutes()).toBe(30);
  });

  it("counts real minutes only, never more than planned", () => {
    const start = new Date("2026-10-04T10:00:00Z");
    expect(qualifyingMinutes(start, new Date("2026-10-04T10:31:59Z"), 50)).toBe(31);
    expect(qualifyingMinutes(start, new Date("2026-10-04T13:00:00Z"), 50)).toBe(50);
    expect(qualifyingMinutes(start, new Date("2026-10-04T09:00:00Z"), 50)).toBe(0);
  });

  it("applies diminishing returns after the full-value sessions", () => {
    expect(focusXpFor(60, { qualifyingSessions: 2, xpEarned: 0 }).xp).toBe(60);
    expect(focusXpFor(60, { qualifyingSessions: 3, xpEarned: 0 })).toMatchObject({ xp: 30, multiplier: 0.5 });
  });

  it("never exceeds the daily cap", () => {
    expect(focusXpFor(90, { qualifyingSessions: 1, xpEarned: FOCUS_XP.dailyXpCap - 40 })).toMatchObject({ xp: 40, capped: true });
    expect(focusXpFor(90, { qualifyingSessions: 1, xpEarned: FOCUS_XP.dailyXpCap })).toMatchObject({ xp: 0, capped: true });
  });

  it("validates session length", () => {
    expect(() => assertSessionMinutes(25)).not.toThrow();
    expect(() => assertSessionMinutes(4)).toThrow();
    expect(() => assertSessionMinutes(181)).toThrow();
  });
});
