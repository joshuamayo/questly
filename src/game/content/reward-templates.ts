/**
 * Reward suggestions (Product Spec §31). Examples only: players add them to
 * their own shop and edit or remove them freely. Prices are set relative to
 * Quest GP (e.g. Intermediate = 5 GP) so rewards feel earned, not distant.
 */

import type { RewardCategory } from "../rewards";

export type RewardTemplate = { key: string; name: string; description: string; category: RewardCategory; icon: string; gpCost: number; repeatable: boolean };

export const REWARD_TEMPLATES: readonly RewardTemplate[] = [
  { key: "gaming-hour", name: "1 Hour Guilt-Free Gaming", description: "An hour of play, fully earned.", category: "GAMING", icon: "combat", gpCost: 10, repeatable: true },
  { key: "gaming-afternoon", name: "Gaming Afternoon", description: "A whole afternoon of play.", category: "GAMING", icon: "combat", gpCost: 30, repeatable: true },
  { key: "nice-dinner", name: "Nice Dinner Out", description: "A meal somewhere special.", category: "TREATS", icon: "gp", gpCost: 50, repeatable: true },
  { key: "new-game", name: "New Game", description: "A game you have been waiting to play.", category: "GAMING", icon: "shop", gpCost: 80, repeatable: true },
  { key: "hobby-purchase", name: "Hobby Purchase", description: "Gear or supplies for a hobby you love.", category: "HOBBIES", icon: "skill-creator", gpCost: 60, repeatable: true },
  { key: "tech-upgrade", name: "Tech Upgrade", description: "A meaningful upgrade to your setup.", category: "GEAR", icon: "settings", gpCost: 250, repeatable: true },
  { key: "weekend-experience", name: "Weekend Experience", description: "A trip or adventure away.", category: "EXPERIENCES", icon: "world", gpCost: 300, repeatable: true },
];
