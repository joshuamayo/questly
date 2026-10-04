/**
 * Cosmetic seed content: Titles (Product Spec §31) and Skill Capes (§5.4).
 * Titles unlock from explicit tracking rules; Skill Capes unlock at Level 99.
 */

import type { TrackingRule } from "../metrics";
import type { SkillKey } from "../vocabulary";

export type TitleDefinition = {
  key: string;
  name: string;
  description: string;
  /** Granted to every new character. */
  isStarter: boolean;
  /** How the Title is earned; null for starter titles. */
  rule: TrackingRule | null;
  sortOrder: number;
};

export const TITLE_DEFINITIONS: readonly TitleDefinition[] = [
  { key: "adventurer", name: "Adventurer", description: "Every legend begins here.", isStarter: true, rule: null, sortOrder: 1 },
  { key: "quest-seeker", name: "Quest Seeker", description: "Complete 10 Quests.", isStarter: false, rule: { metric: "questsCompleted", target: 10 }, sortOrder: 2 },
  { key: "goal-slayer", name: "Goal Slayer", description: "Complete a Master or Grandmaster Quest.", isStarter: false, rule: { metric: "questsAtDifficulty", difficulty: "MASTER", target: 1 }, sortOrder: 3 },
  { key: "boss-hunter", name: "Boss Hunter", description: "Defeat 5 Bosses.", isStarter: false, rule: { metric: "bossesDefeated", target: 5 }, sortOrder: 4 },
  { key: "master-creator", name: "Master Creator", description: "Reach Level 75 Creator.", isStarter: false, rule: { metric: "skillLevel", skill: "creator", target: 75 }, sortOrder: 5 },
  { key: "merchant", name: "Merchant", description: "Reach Level 50 Business.", isStarter: false, rule: { metric: "skillLevel", skill: "business", target: 50 }, sortOrder: 6 },
  { key: "completionist", name: "Completionist", description: "Obtain 40 Collection Log items.", isStarter: false, rule: { metric: "collectionItems", target: 40 }, sortOrder: 7 },
];

export type CapeDefinition = {
  key: string;
  name: string;
  description: string;
  /** Skill whose Level 99 unlocks this cape. */
  skillKey: SkillKey;
  sortOrder: number;
};

export const CAPE_DEFINITIONS: readonly CapeDefinition[] = [
  { key: "cape-creator", name: "Creator Cape", description: "Worn by those who reached Level 99 Creator.", skillKey: "creator", sortOrder: 1 },
  { key: "cape-business", name: "Business Cape", description: "Worn by those who reached Level 99 Business.", skillKey: "business", sortOrder: 2 },
  { key: "cape-finance", name: "Finance Cape", description: "Worn by those who reached Level 99 Finance.", skillKey: "finance", sortOrder: 3 },
  { key: "cape-fitness", name: "Fitness Cape", description: "Worn by those who reached Level 99 Fitness.", skillKey: "fitness", sortOrder: 4 },
  { key: "cape-home", name: "Home Cape", description: "Worn by those who reached Level 99 Home.", skillKey: "home", sortOrder: 5 },
  { key: "cape-focus", name: "Focus Cape", description: "Worn by those who reached Level 99 Focus.", skillKey: "focus", sortOrder: 6 },
];
