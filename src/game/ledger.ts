/**
 * Progression ledger rules (pure).
 *
 * Every change to XP, GP, Quest Points, or Combat Points is an append-only
 * ledger entry. Cached balances are a projection of the ledger and can always
 * be recomputed with `projectBalances` (CLAUDE.md §12).
 */

import { InsufficientGpError, InvalidProgressionError } from "./errors";
import { SKILL_KEYS, isSkillKey, type ProgressionKind, type SkillKey } from "./vocabulary";

/** Where a progression change came from. Extend as systems arrive. */
export const SOURCE_TYPES = [
  "QUEST",
  "QUESTLINE",
  "FOCUS_SESSION",
  "BOSS",
  "DIARY",
  "COMBAT_ACHIEVEMENT",
  "COLLECTION",
  "REWARD_REDEMPTION",
  "SYSTEM",
  "SEED_DEMO",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export type LedgerEntryInput = {
  kind: ProgressionKind;
  /** Signed amount. Only GP may be negative (spending). */
  amount: number;
  /** Required for XP, forbidden otherwise. */
  skillKey?: SkillKey | null;
  sourceType: SourceType;
  sourceId?: string | null;
  /**
   * Optional key that makes this entry unique per character. Re-submitting the
   * same key is a no-op, which is how duplicate rewards are prevented.
   */
  idempotencyKey?: string | null;
  metadata?: Record<string, unknown>;
};

export type Balances = {
  gpBalance: number;
  lifetimeGpEarned: number;
  lifetimeGpSpent: number;
  questPoints: number;
  combatPoints: number;
  skillXp: Record<SkillKey, number>;
};

export function emptyBalances(): Balances {
  return {
    gpBalance: 0,
    lifetimeGpEarned: 0,
    lifetimeGpSpent: 0,
    questPoints: 0,
    combatPoints: 0,
    skillXp: Object.fromEntries(SKILL_KEYS.map((k) => [k, 0])) as Record<SkillKey, number>,
  };
}

/** Throws InvalidProgressionError if the entry violates a ledger invariant. */
export function validateLedgerEntry(entry: LedgerEntryInput): void {
  const { kind, amount, skillKey, sourceType } = entry;
  if (!Number.isSafeInteger(amount) || amount === 0) {
    throw new InvalidProgressionError("Progression amounts must be non-zero whole numbers.");
  }
  if (!sourceType) {
    throw new InvalidProgressionError("Every progression change must record its source type.");
  }
  if (kind === "XP") {
    if (!skillKey || !isSkillKey(skillKey)) {
      throw new InvalidProgressionError("XP must be awarded to one of the six Skills.");
    }
  } else if (skillKey) {
    throw new InvalidProgressionError(`${kind} is not tied to a Skill.`);
  }
  // Permanent progression is never removed (CLAUDE.md §20).
  if (kind !== "GP" && amount < 0) {
    throw new InvalidProgressionError(`${kind} is permanent and can never be deducted.`);
  }
  if (kind === "GP" && amount < 0 && sourceType !== "REWARD_REDEMPTION" && sourceType !== "SYSTEM") {
    // GP is only deducted when a reward is redeemed (Product Spec §7.2).
    throw new InvalidProgressionError("GP can only be spent through reward redemption.");
  }
}

/** Throws InsufficientGpError when a spend would push GP below zero. */
export function assertCanSpendGp(balance: number, cost: number): void {
  if (!Number.isSafeInteger(cost) || cost <= 0) {
    throw new InvalidProgressionError("GP cost must be a positive whole number.");
  }
  if (balance < cost) throw new InsufficientGpError(balance, cost);
}

/** Apply one validated entry to balances, returning new balances. */
export function applyLedgerEntry(balances: Balances, entry: LedgerEntryInput): Balances {
  validateLedgerEntry(entry);
  const next: Balances = { ...balances, skillXp: { ...balances.skillXp } };
  switch (entry.kind) {
    case "XP":
      next.skillXp[entry.skillKey as SkillKey] += entry.amount;
      break;
    case "QP":
      next.questPoints += entry.amount;
      break;
    case "COMBAT_POINTS":
      next.combatPoints += entry.amount;
      break;
    case "GP":
      if (entry.amount > 0) {
        next.gpBalance += entry.amount;
        next.lifetimeGpEarned += entry.amount;
      } else {
        assertCanSpendGp(next.gpBalance, -entry.amount);
        next.gpBalance += entry.amount;
        next.lifetimeGpSpent += -entry.amount;
      }
      break;
  }
  return next;
}

/** Recompute every balance from scratch by replaying the ledger in order. */
export function projectBalances(entries: readonly LedgerEntryInput[]): Balances {
  return entries.reduce(applyLedgerEntry, emptyBalances());
}
