/** GP rules (pure). GP is the only currency: earned by Quests, spent on Rewards, never negative. */

import { GameRuleError, InsufficientGpError } from "./errors";

export type GpTransactionType = "EARN" | "SPEND" | "ADJUST";
export type GpSourceType = "QUEST" | "REWARD" | "SYSTEM";

export function assertPositiveWhole(amount: number, label = "GP amount"): void {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new GameRuleError(`${label} must be a positive whole number.`, "INVALID_GP_AMOUNT");
}

export function assertCanSpend(balance: number, cost: number): void {
  assertPositiveWhole(cost, "The cost");
  if (balance < cost) throw new InsufficientGpError(balance, cost);
}

export type GpBalances = { gpBalance: number; lifetimeGpEarned: number; lifetimeGpSpent: number };

/** Replay ledger amounts into balances (reconciliation). */
export function projectGp(amounts: readonly number[]): GpBalances {
  let earned = 0;
  let spent = 0;
  for (const a of amounts) {
    if (a > 0) earned += a;
    else spent += -a;
  }
  return { gpBalance: earned - spent, lifetimeGpEarned: earned, lifetimeGpSpent: spent };
}
