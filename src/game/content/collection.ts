/**
 * Collection Log slots (Product Spec §16, §31). Items with a rule unlock
 * automatically; items without one are claimed manually for real-world
 * milestones the game cannot see. Secret items show as ??? until obtained.
 */

import type { TrackingRule } from "../metrics";

export const COLLECTION_CATEGORIES = ["creator", "business", "finance", "fitness", "home", "general"] as const;
export type CollectionCategory = (typeof COLLECTION_CATEGORIES)[number];
export const COLLECTION_CATEGORY_LABELS: Record<CollectionCategory, string> = {
  creator: "Creator",
  business: "Business",
  finance: "Finance",
  fitness: "Fitness",
  home: "Home",
  general: "General / Adventure",
};

export const RARITIES = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"] as const;
export type Rarity = (typeof RARITIES)[number];

export type CollectionItemDefinition = {
  key: string;
  category: CollectionCategory;
  title: string;
  description: string;
  rarity: Rarity;
  secret: boolean;
  icon: string;
  /** Null = manual claim. */
  rule: TrackingRule | null;
  sortOrder: number;
};

type Def = Omit<CollectionItemDefinition, "sortOrder">;

function skillSet(skill: "creator" | "business" | "finance" | "fitness" | "home", name: string): Def[] {
  const icon = `skill-${skill}`;
  return [
    { key: `${skill}-first-quest`, category: skill, title: `First ${name} Quest`, description: `Complete your first ${name} Quest.`, rarity: "COMMON", secret: false, icon, rule: { metric: "questsBySkill", skill, target: 1 } },
    { key: `${skill}-level-10`, category: skill, title: `${name} Level 10`, description: `Reach Level 10 ${name}.`, rarity: "COMMON", secret: false, icon, rule: { metric: "skillLevel", skill, target: 10 } },
    { key: `${skill}-level-50`, category: skill, title: `${name} Level 50`, description: `Reach Level 50 ${name}.`, rarity: "RARE", secret: false, icon, rule: { metric: "skillLevel", skill, target: 50 } },
    { key: `${skill}-level-99`, category: skill, title: `${name} Level 99`, description: `Master ${name} at Level 99.`, rarity: "LEGENDARY", secret: false, icon: "total-level", rule: { metric: "skillLevel", skill, target: 99 } },
    { key: `${skill}-10-quests`, category: skill, title: `${name} Regular`, description: `Complete 10 ${name} Quests.`, rarity: "UNCOMMON", secret: false, icon, rule: { metric: "questsBySkill", skill, target: 10 } },
  ];
}

const DEFS: Def[] = [
  ...skillSet("creator", "Creator"),
  { key: "first-video", category: "creator", title: "First Video Published", description: "Publish your first video.", rarity: "COMMON", secret: false, icon: "skill-creator", rule: null },
  { key: "100k-video", category: "creator", title: "100K Video", description: "Publish a video that reaches 100,000 views.", rarity: "RARE", secret: false, icon: "skill-creator", rule: null },
  { key: "1m-video", category: "creator", title: "1M Video", description: "Publish a video that reaches 1,000,000 views.", rarity: "LEGENDARY", secret: true, icon: "skill-creator", rule: null },

  ...skillSet("business", "Business"),
  { key: "first-sale", category: "business", title: "First Sale", description: "Make your first sale.", rarity: "UNCOMMON", secret: false, icon: "skill-business", rule: null },
  { key: "first-product-launched", category: "business", title: "First Product Launched", description: "Launch your first product.", rarity: "RARE", secret: false, icon: "skill-business", rule: null },
  { key: "10k-month", category: "business", title: "$10K Month", description: "Earn $10,000 in a single month.", rarity: "EPIC", secret: true, icon: "gp", rule: null },

  ...skillSet("finance", "Finance"),
  { key: "emergency-fund", category: "finance", title: "Emergency Fund", description: "Fully fund your emergency savings.", rarity: "RARE", secret: false, icon: "skill-finance", rule: null },
  { key: "debt-free", category: "finance", title: "Debt Free", description: "Pay off your last debt.", rarity: "EPIC", secret: true, icon: "skill-finance", rule: null },

  ...skillSet("fitness", "Fitness"),
  { key: "personal-best", category: "fitness", title: "Personal Best", description: "Set a new personal record.", rarity: "UNCOMMON", secret: false, icon: "skill-fitness", rule: null },
  { key: "race-finished", category: "fitness", title: "Race Finisher", description: "Finish an organized race or event.", rarity: "RARE", secret: true, icon: "skill-fitness", rule: null },

  ...skillSet("home", "Home"),
  { key: "dream-setup", category: "home", title: "Dream Setup", description: "Finish the workspace you have been building toward.", rarity: "RARE", secret: false, icon: "skill-home", rule: null },
  { key: "home-purchase", category: "home", title: "Home Purchase", description: "Buy a home.", rarity: "EPIC", secret: true, icon: "skill-home", rule: null },

  { key: "first-quest", category: "general", title: "First Quest", description: "Complete your very first Quest.", rarity: "COMMON", secret: false, icon: "quests", rule: { metric: "questsCompleted", target: 1 } },
  { key: "first-master-quest", category: "general", title: "First Master Quest", description: "Complete a Master or Grandmaster Quest.", rarity: "RARE", secret: false, icon: "quests", rule: { metric: "questsAtDifficulty", difficulty: "MASTER", target: 1 } },
  { key: "first-grandmaster-quest", category: "general", title: "First Grandmaster Quest", description: "Complete a Grandmaster Quest.", rarity: "EPIC", secret: false, icon: "quests", rule: { metric: "questsAtDifficulty", difficulty: "GRANDMASTER", target: 1 } },
  { key: "first-boss", category: "general", title: "First Boss Defeated", description: "Defeat your first Boss.", rarity: "UNCOMMON", secret: false, icon: "bosses", rule: { metric: "bossesDefeated", target: 1 } },
  { key: "questline-trophy", category: "general", title: "Questline Trophy", description: "Complete your first Questline.", rarity: "RARE", secret: false, icon: "questlines", rule: { metric: "questlinesCompleted", target: 1 } },
  { key: "100-quest-points", category: "general", title: "100 Quest Points", description: "Earn 100 Quest Points.", rarity: "RARE", secret: false, icon: "qp", rule: { metric: "questPoints", target: 100 } },
  { key: "total-level-100", category: "general", title: "Total Level 100", description: "Reach Total Level 100.", rarity: "UNCOMMON", secret: false, icon: "total-level", rule: { metric: "totalLevel", target: 100 } },
  { key: "total-level-300", category: "general", title: "Total Level 300", description: "Reach Total Level 300.", rarity: "EPIC", secret: false, icon: "total-level", rule: { metric: "totalLevel", target: 300 } },
  { key: "deep-work-relic", category: "general", title: "Hourglass of the Long Sit", description: "Complete a 90-minute Focus session.", rarity: "UNCOMMON", secret: true, icon: "skill-focus", rule: { metric: "focusLongSessions", target: 1 } },
  { key: "early-bounty", category: "general", title: "Bounty Medal", description: "Defeat a Boss before its target date.", rarity: "RARE", secret: true, icon: "gp", rule: { metric: "earlyBossBounties", target: 1 } },
];

export const COLLECTION_ITEMS: readonly CollectionItemDefinition[] = DEFS.map((d, i) => ({ ...d, sortOrder: i + 1 }));
