import { describe, expect, it } from "vitest";
import { InsufficientGpError, InvalidProgressionError } from "./errors";
import { applyLedgerEntry, assertCanSpendGp, emptyBalances, projectBalances, validateLedgerEntry } from "./ledger";

describe("ledger rules", () => {
  it("requires XP to target one of the six Skills", () => {
    expect(() => validateLedgerEntry({ kind: "XP", amount: 10, sourceType: "QUEST" })).toThrow(InvalidProgressionError);
    expect(() =>
      validateLedgerEntry({ kind: "XP", amount: 10, sourceType: "QUEST", skillKey: "family" as never }),
    ).toThrow(InvalidProgressionError);
    expect(() => validateLedgerEntry({ kind: "GP", amount: 10, sourceType: "QUEST", skillKey: "home" })).toThrow();
  });

  it("never allows permanent progression to be deducted", () => {
    for (const kind of ["XP", "QP", "COMBAT_POINTS"] as const) {
      expect(() =>
        validateLedgerEntry({ kind, amount: -1, sourceType: "SYSTEM", skillKey: kind === "XP" ? "focus" : null }),
      ).toThrow(InvalidProgressionError);
    }
  });

  it("only spends GP through reward redemption", () => {
    expect(() => validateLedgerEntry({ kind: "GP", amount: -5, sourceType: "QUEST" })).toThrow(InvalidProgressionError);
    expect(() => validateLedgerEntry({ kind: "GP", amount: -5, sourceType: "REWARD_REDEMPTION" })).not.toThrow();
  });

  it("rejects zero and fractional amounts", () => {
    expect(() => validateLedgerEntry({ kind: "QP", amount: 0, sourceType: "QUEST" })).toThrow();
    expect(() => validateLedgerEntry({ kind: "QP", amount: 1.5, sourceType: "QUEST" })).toThrow();
  });

  it("refuses spends larger than the balance", () => {
    expect(() => assertCanSpendGp(4, 5)).toThrow(InsufficientGpError);
    expect(() => assertCanSpendGp(5, 5)).not.toThrow();
  });

  it("tracks lifetime earned and spent separately and never goes negative", () => {
    let b = applyLedgerEntry(emptyBalances(), { kind: "GP", amount: 10, sourceType: "QUEST" });
    b = applyLedgerEntry(b, { kind: "GP", amount: -7, sourceType: "REWARD_REDEMPTION" });
    expect(b).toMatchObject({ gpBalance: 3, lifetimeGpEarned: 10, lifetimeGpSpent: 7 });
    expect(() => applyLedgerEntry(b, { kind: "GP", amount: -4, sourceType: "REWARD_REDEMPTION" })).toThrow(
      InsufficientGpError,
    );
  });

  it("projects every balance from the ledger", () => {
    const b = projectBalances([
      { kind: "XP", amount: 100, skillKey: "creator", sourceType: "QUEST" },
      { kind: "XP", amount: 50, skillKey: "creator", sourceType: "QUEST" },
      { kind: "QP", amount: 2, sourceType: "QUEST" },
      { kind: "COMBAT_POINTS", amount: 5, sourceType: "COMBAT_ACHIEVEMENT" },
      { kind: "GP", amount: 15, sourceType: "QUEST" },
    ]);
    expect(b.skillXp.creator).toBe(150);
    expect(b.skillXp.focus).toBe(0);
    expect(b).toMatchObject({ questPoints: 2, combatPoints: 5, gpBalance: 15 });
  });
});
