import type { SpriteName } from "./sprites";

/** Which delivered art file (docs/ART_ASSETS.md) replaces each sprite. */
export const SPRITE_ART_SLOTS: Partial<Record<SpriteName, string>> = {
  "skill-creator": "skills/creator",
  "skill-business": "skills/business",
  "skill-finance": "skills/finance",
  "skill-fitness": "skills/fitness",
  "skill-home": "skills/home",
  "skill-focus": "skills/focus",
  world: "nav/world",
  quests: "nav/quests",
  questlines: "nav/questlines",
  skills: "nav/skills",
  diaries: "nav/achievement-diaries",
  combat: "nav/combat-achievements",
  bosses: "nav/bosses",
  collection: "nav/collection-log",
  shop: "nav/reward-shop",
  character: "nav/character",
  settings: "nav/settings",
  gp: "icons/gp",
  qp: "icons/qp",
  "combat-points": "icons/combat-points",
  "total-level": "icons/total-level",
  sword: "brand/emblem",
};

export const ICON_ART_SLOTS: string[] = Object.values(SPRITE_ART_SLOTS) as string[];
