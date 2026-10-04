/** Reward Shop rules (pure). Real-life rewards bought with earned GP only. */

import { GameRuleError } from "./errors";

export const REWARD_CATEGORIES = ["GAMING", "EXPERIENCES", "TREATS", "GEAR", "HOBBIES", "OTHER"] as const;
export type RewardCategory = (typeof REWARD_CATEGORIES)[number];
export const REWARD_CATEGORY_LABELS: Record<RewardCategory, string> = {
  GAMING: "Gaming",
  EXPERIENCES: "Experiences",
  TREATS: "Treats",
  GEAR: "Gear & Tech",
  HOBBIES: "Hobbies",
  OTHER: "Other",
};

export type RewardInput = {
  name: string;
  description?: string;
  category: string;
  icon?: string;
  gpCost: number;
  repeatable: boolean;
  estimatedValue?: string | null;
};

export function validateReward(input: RewardInput) {
  const name = input.name.trim();
  if (!name) throw new GameRuleError("Every reward needs a name.", "REWARD_NAME_REQUIRED");
  if (name.length > 80) throw new GameRuleError("Reward names must be 80 characters or fewer.", "REWARD_NAME_TOO_LONG");
  const description = (input.description ?? "").trim();
  if (description.length > 500) throw new GameRuleError("Descriptions must be 500 characters or fewer.", "REWARD_DESCRIPTION_TOO_LONG");
  if (!(REWARD_CATEGORIES as readonly string[]).includes(input.category)) throw new GameRuleError("Choose a category.", "REWARD_CATEGORY");
  if (!Number.isInteger(input.gpCost) || input.gpCost < 1 || input.gpCost > 1_000_000) {
    throw new GameRuleError("The GP cost must be a whole number of at least 1.", "REWARD_COST");
  }
  const estimatedValue = input.estimatedValue?.trim() || null;
  if (estimatedValue && estimatedValue.length > 40) throw new GameRuleError("Keep the estimated value short.", "REWARD_VALUE");
  return { name, description, category: input.category as RewardCategory, icon: input.icon || "shop", gpCost: input.gpCost, repeatable: Boolean(input.repeatable), estimatedValue };
}

export function affordability(balance: number, cost: number) {
  return { affordable: balance >= cost, shortfall: Math.max(0, cost - balance) };
}
