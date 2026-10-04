import { describe, expect, it } from "vitest";
import { bossHp, bountyFor, snapshotBounty } from "./bosses";

const bounty = snapshotBounty();

describe("Boss HP", () => {
  it("falls deterministically with objective progress", () => {
    expect(bossHp({ done: 0, total: 8 })).toBe(100);
    expect(bossHp({ done: 5, total: 8 })).toBe(38);
    expect(bossHp({ done: 8, total: 8 })).toBe(0);
    expect(bossHp({ done: 0, total: 0 })).toBe(100);
    expect(bossHp({ done: 1, total: 4 }, true)).toBe(0);
  });
});

describe("Boss bounty", () => {
  it("rewards early, on-target, and by-deadline defeats with decreasing bonus GP", () => {
    expect(bountyFor(bounty, "2026-10-10", "2026-10-15", "2026-10-08")).toEqual({ tier: "EARLY", gp: 30 });
    expect(bountyFor(bounty, "2026-10-10", "2026-10-15", "2026-10-10")).toEqual({ tier: "BY_TARGET", gp: 20 });
    expect(bountyFor(bounty, "2026-10-10", "2026-10-15", "2026-10-14")).toEqual({ tier: "BY_DEADLINE", gp: 10 });
  });

  it("expires to zero when late — it never deducts", () => {
    expect(bountyFor(bounty, "2026-10-10", "2026-10-15", "2026-10-20")).toEqual({ tier: "LATE", gp: 0 });
    expect(bountyFor(bounty, "2026-10-10", null, "2026-10-11")).toEqual({ tier: "LATE", gp: 0 });
  });

  it("does not apply without a target date or deadline", () => {
    expect(bountyFor(bounty, null, null, "2026-10-11")).toEqual({ tier: "NONE", gp: 0 });
    expect(bountyFor(null, "2026-10-10", null, "2026-10-01")).toEqual({ tier: "NONE", gp: 0 });
  });

  it("supports deadline-only Bosses", () => {
    expect(bountyFor(bounty, null, "2026-10-15", "2026-10-12")).toEqual({ tier: "BY_DEADLINE", gp: 10 });
  });
});
