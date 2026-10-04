/**
 * Avatar configuration. Stored as JSON on the character so the look can grow
 * (equipment, capes) without schema churn. Values are palette keys resolved to
 * design tokens by the UI — never raw colors.
 */

export const AVATAR_SKIN_TONES = ["porcelain", "sand", "bronze", "umber", "ebony"] as const;
export const AVATAR_HAIR_STYLES = ["short", "long", "bald"] as const;
export const AVATAR_HAIR_COLORS = ["raven", "chestnut", "auburn", "ash", "gold"] as const;
export const AVATAR_TUNIC_COLORS = ["moss", "teal", "crimson", "royal", "umber"] as const;

export type AvatarConfig = {
  version: 1;
  skinTone: (typeof AVATAR_SKIN_TONES)[number];
  hairStyle: (typeof AVATAR_HAIR_STYLES)[number];
  hairColor: (typeof AVATAR_HAIR_COLORS)[number];
  tunicColor: (typeof AVATAR_TUNIC_COLORS)[number];
  beard: boolean;
};

export const DEFAULT_AVATAR: AvatarConfig = {
  version: 1,
  skinTone: "sand",
  hairStyle: "short",
  hairColor: "chestnut",
  tunicColor: "moss",
  beard: false,
};

/** Accept unknown JSON from storage and return a safe config. */
export function normalizeAvatar(value: unknown): AvatarConfig {
  const v = (value ?? {}) as Partial<AvatarConfig>;
  const pick = <T extends readonly string[]>(list: T, candidate: unknown, fallback: T[number]) =>
    (list as readonly string[]).includes(candidate as string) ? (candidate as T[number]) : fallback;
  return {
    version: 1,
    skinTone: pick(AVATAR_SKIN_TONES, v.skinTone, DEFAULT_AVATAR.skinTone),
    hairStyle: pick(AVATAR_HAIR_STYLES, v.hairStyle, DEFAULT_AVATAR.hairStyle),
    hairColor: pick(AVATAR_HAIR_COLORS, v.hairColor, DEFAULT_AVATAR.hairColor),
    tunicColor: pick(AVATAR_TUNIC_COLORS, v.tunicColor, DEFAULT_AVATAR.tunicColor),
    beard: typeof v.beard === "boolean" ? v.beard : DEFAULT_AVATAR.beard,
  };
}
