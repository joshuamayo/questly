/**
 * Character settings (spec §24): small by design. Stored as JSON on the
 * character and always normalized on read.
 */

import { GameRuleError } from "./errors";
import { DEFAULT_QUEST_GP, validateGp } from "./quests";

export const BACKGROUNDS = ["default", "forest", "mountain"] as const;
export type Background = (typeof BACKGROUNDS)[number];

export type CharacterSettings = {
  /** GP suggested for new Quests. */
  defaultQuestGp: number;
  /** Ask "Complete this quest?" before completing. */
  confirmCompletion: boolean;
  /** Show the full Quest Complete reveal (off: a quick confirmation). */
  celebrateCompletions: boolean;
  /** Show the Reward Redeemed reveal (off: a quick confirmation). */
  celebrateRedemptions: boolean;
  /** Short completion/redemption chime. Off by default. */
  sound: boolean;
  motion: "system" | "reduce";
  background: Background;
  showSavingsGoal: boolean;
  showRecentCompletions: boolean;
};

export const DEFAULT_SETTINGS: CharacterSettings = {
  defaultQuestGp: DEFAULT_QUEST_GP,
  confirmCompletion: false,
  celebrateCompletions: true,
  celebrateRedemptions: true,
  sound: false,
  motion: "system",
  background: "default",
  showSavingsGoal: true,
  showRecentCompletions: true,
};

const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);

/** Accept unknown JSON from storage and return complete, safe settings. */
export function normalizeSettings(value: unknown): CharacterSettings {
  const v = (value ?? {}) as Record<string, unknown>;
  let defaultQuestGp = DEFAULT_SETTINGS.defaultQuestGp;
  try {
    if (v.defaultQuestGp !== undefined) defaultQuestGp = validateGp(v.defaultQuestGp);
  } catch {
    // keep the default
  }
  return {
    defaultQuestGp,
    confirmCompletion: bool(v.confirmCompletion, DEFAULT_SETTINGS.confirmCompletion),
    celebrateCompletions: bool(v.celebrateCompletions, DEFAULT_SETTINGS.celebrateCompletions),
    celebrateRedemptions: bool(v.celebrateRedemptions, DEFAULT_SETTINGS.celebrateRedemptions),
    sound: bool(v.sound, DEFAULT_SETTINGS.sound),
    motion: v.motion === "reduce" ? "reduce" : "system",
    background: (BACKGROUNDS as readonly string[]).includes(v.background as string) ? (v.background as Background) : "default",
    showSavingsGoal: bool(v.showSavingsGoal, DEFAULT_SETTINGS.showSavingsGoal),
    showRecentCompletions: bool(v.showRecentCompletions, DEFAULT_SETTINGS.showRecentCompletions),
  };
}

/** Validate a partial update strictly (for saving). */
export function validateSettingsPatch(patch: Partial<CharacterSettings>): Partial<CharacterSettings> {
  const out: Partial<CharacterSettings> = {};
  for (const [key, value] of Object.entries(patch) as [keyof CharacterSettings, unknown][]) {
    switch (key) {
      case "defaultQuestGp":
        out.defaultQuestGp = validateGp(value, "Default quest reward");
        break;
      case "motion":
        if (value !== "system" && value !== "reduce") throw new GameRuleError("Choose a motion setting.", "INVALID_SETTING");
        out.motion = value;
        break;
      case "background":
        if (!(BACKGROUNDS as readonly string[]).includes(value as string)) throw new GameRuleError("Choose a background.", "INVALID_SETTING");
        out.background = value as Background;
        break;
      case "confirmCompletion":
      case "celebrateCompletions":
      case "celebrateRedemptions":
      case "sound":
      case "showSavingsGoal":
      case "showRecentCompletions":
        if (typeof value !== "boolean") throw new GameRuleError("That setting must be on or off.", "INVALID_SETTING");
        out[key] = value;
        break;
      default:
        throw new GameRuleError("Unknown setting.", "INVALID_SETTING");
    }
  }
  return out;
}
