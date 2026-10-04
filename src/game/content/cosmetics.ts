/**
 * Cosmetic seed content: Titles (Product Spec §31) and Skill Capes (§5.4).
 * Unlock logic for these arrives with later phases; Phase 1 only defines them.
 */

import type { SkillKey } from "../vocabulary";

export type TitleDefinition = {
  key: string;
  name: string;
  description: string;
  /** Granted to every new character. */
  isStarter: boolean;
  sortOrder: number;
};

export const TITLE_DEFINITIONS: readonly TitleDefinition[] = [
  { key: "adventurer", name: "Adventurer", description: "Every legend begins here.", isStarter: true, sortOrder: 1 },
  { key: "quest-seeker", name: "Quest Seeker", description: "Drawn to the next adventure.", isStarter: false, sortOrder: 2 },
  { key: "goal-slayer", name: "Goal Slayer", description: "Big goals fall before you.", isStarter: false, sortOrder: 3 },
  { key: "boss-hunter", name: "Boss Hunter", description: "A seasoned slayer of Bosses.", isStarter: false, sortOrder: 4 },
  { key: "master-creator", name: "Master Creator", description: "A celebrated maker of works.", isStarter: false, sortOrder: 5 },
  { key: "merchant", name: "Merchant", description: "Shrewd in trade and venture.", isStarter: false, sortOrder: 6 },
  { key: "completionist", name: "Completionist", description: "Leaves nothing undone.", isStarter: false, sortOrder: 7 },
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
