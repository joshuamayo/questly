import type { SpriteName } from "./sprites";

/** Which delivered art file (docs/ART_ASSETS.md) replaces each sprite. */
export const SPRITE_ART_SLOTS: Partial<Record<SpriteName, string>> = {
  quests: "nav/quest-log",
  shop: "nav/reward-shop",
  diaries: "nav/completed",
  settings: "nav/settings",
  gp: "icons/gp",
  sword: "brand/emblem",
};

export const ICON_ART_SLOTS: string[] = Object.values(SPRITE_ART_SLOTS) as string[];
