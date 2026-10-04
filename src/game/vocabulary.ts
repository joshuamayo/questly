/**
 * Canonical V1 vocabulary (CLAUDE.md §4). Stable keys are stored in the
 * database; display labels are what players see. Never rename these casually.
 */

export const SKILL_KEYS = [
  "creator",
  "business",
  "finance",
  "fitness",
  "home",
  "focus",
] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];

export const QUEST_DIFFICULTIES = [
  "NOVICE",
  "INTERMEDIATE",
  "EXPERIENCED",
  "MASTER",
  "GRANDMASTER",
] as const;
export type QuestDifficulty = (typeof QUEST_DIFFICULTIES)[number];

export const QUEST_DIFFICULTY_LABELS: Record<QuestDifficulty, string> = {
  NOVICE: "Novice",
  INTERMEDIATE: "Intermediate",
  EXPERIENCED: "Experienced",
  MASTER: "Master",
  GRANDMASTER: "Grandmaster",
};

export const COMBAT_ACHIEVEMENT_TIERS = [
  "EASY",
  "MEDIUM",
  "HARD",
  "ELITE",
  "MASTER",
  "GRANDMASTER",
] as const;
export type CombatAchievementTier = (typeof COMBAT_ACHIEVEMENT_TIERS)[number];

export const DIARY_TIERS = ["EASY", "MEDIUM", "HARD", "ELITE"] as const;
export type DiaryTier = (typeof DIARY_TIERS)[number];

/** The four progression values. Never interchangeable (CLAUDE.md §4). */
export const PROGRESSION_KINDS = ["XP", "GP", "QP", "COMBAT_POINTS"] as const;
export type ProgressionKind = (typeof PROGRESSION_KINDS)[number];

export const PROGRESSION_LABELS: Record<ProgressionKind, string> = {
  XP: "XP",
  GP: "GP",
  QP: "Quest Points",
  COMBAT_POINTS: "Combat Points",
};

export function isSkillKey(value: string): value is SkillKey {
  return (SKILL_KEYS as readonly string[]).includes(value);
}
