/** Reward Shop rules (pure). Real-life rewards bought with earned GP only. */

import { GameRuleError } from "./errors";

/** Icons a Reward can use (pixel sprites). */
export const REWARD_ICONS = ["gamepad", "burger", "gift", "monitor", "tent", "collection", "shop", "star", "world", "diaries", "sword", "character"] as const;
export type RewardIcon = (typeof REWARD_ICONS)[number];

export type RewardInput = {
  name: string;
  description?: string;
  icon?: string;
  gpCost: number;
  repeatable: boolean;
};

export function validateReward(input: RewardInput) {
  const name = (input.name ?? "").trim();
  if (!name) throw new GameRuleError("Every reward needs a name.", "REWARD_NAME_REQUIRED");
  if (name.length > 80) throw new GameRuleError("Reward names must be 80 characters or fewer.", "REWARD_NAME_TOO_LONG");
  const description = (input.description ?? "").trim();
  if (description.length > 500) throw new GameRuleError("Descriptions must be 500 characters or fewer.", "REWARD_DESCRIPTION_TOO_LONG");
  if (!Number.isInteger(input.gpCost) || input.gpCost < 1 || input.gpCost > 1_000_000) {
    throw new GameRuleError("The GP cost must be a whole number of at least 1.", "REWARD_COST");
  }
  const icon = (REWARD_ICONS as readonly string[]).includes(input.icon ?? "") ? (input.icon as RewardIcon) : "gift";
  return { name, description, icon, gpCost: input.gpCost, repeatable: Boolean(input.repeatable) };
}

export function affordability(balance: number, cost: number) {
  return { affordable: balance >= cost, shortfall: Math.max(0, cost - balance) };
}

/** Featured savings goal: a visualization of current GP against one Reward's cost (spec §21). */
export function savingsProgress(balance: number, cost: number) {
  return { current: Math.min(balance, cost), target: cost, percent: cost > 0 ? Math.min(100, Math.floor((balance / cost) * 100)) : 0 };
}

/** Starter ideas (spec §17). Examples only; the player edits or removes them freely. */
export const REWARD_SUGGESTIONS: readonly { name: string; icon: RewardIcon; gpCost: number; repeatable: boolean }[] = [
  { name: "1 Hour of OSRS", icon: "gamepad", gpCost: 15, repeatable: true },
  { name: "Favorite Lunch", icon: "burger", gpCost: 25, repeatable: true },
  { name: "Gaming Afternoon", icon: "gamepad", gpCost: 50, repeatable: true },
  { name: "Buy Something I've Been Wanting", icon: "gift", gpCost: 100, repeatable: true },
  { name: "New Tech / Gear", icon: "monitor", gpCost: 250, repeatable: true },
  { name: "Weekend Getaway", icon: "tent", gpCost: 500, repeatable: true },
];
