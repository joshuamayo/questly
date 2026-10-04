/**
 * Account metrics and tracking rules (pure). Combat Achievements, Diary
 * entries, Collection unlocks, and Title unlocks all use these explicit
 * rules — never fragile UI assumptions (CLAUDE.md §16).
 */

import { QUEST_DIFFICULTIES, type QuestDifficulty, type SkillKey } from "./vocabulary";

export type AccountMetrics = {
  questsCompleted: number;
  /** Completed Quests at or above each difficulty. */
  questsAtDifficulty: Record<QuestDifficulty, number>;
  questsBySkill: Record<string, number>;
  mainQuestsCompleted: number;
  questsBeforeTarget: number;
  deadlineQuestsOnTime: number;
  bossesDefeated: number;
  earlyBossBounties: number;
  questlinesCompleted: number;
  /** Focus sessions of at least the minimum qualifying length. */
  focusSessions: number;
  focusLongSessions: number;
  focusMinutes: number;
  xpEarned: number;
  totalLevel: number;
  highestSkillLevel: number;
  skillLevels: Record<string, number>;
  questPoints: number;
  combatPoints: number;
  combatAchievementsCompleted: number;
  collectionItems: number;
};

export type MetricKey =
  | "questsCompleted"
  | "questsAtDifficulty"
  | "questsBySkill"
  | "mainQuestsCompleted"
  | "questsBeforeTarget"
  | "deadlineQuestsOnTime"
  | "bossesDefeated"
  | "earlyBossBounties"
  | "questlinesCompleted"
  | "focusSessions"
  | "focusLongSessions"
  | "focusMinutes"
  | "xpEarned"
  | "totalLevel"
  | "highestSkillLevel"
  | "skillLevel"
  | "questPoints"
  | "combatPoints"
  | "combatAchievementsCompleted"
  | "collectionItems";

export type TrackingRule = {
  metric: MetricKey;
  target: number;
  difficulty?: QuestDifficulty;
  skill?: SkillKey;
};

export function emptyMetrics(): AccountMetrics {
  return {
    questsCompleted: 0,
    questsAtDifficulty: Object.fromEntries(QUEST_DIFFICULTIES.map((d) => [d, 0])) as Record<QuestDifficulty, number>,
    questsBySkill: {},
    mainQuestsCompleted: 0,
    questsBeforeTarget: 0,
    deadlineQuestsOnTime: 0,
    bossesDefeated: 0,
    earlyBossBounties: 0,
    questlinesCompleted: 0,
    focusSessions: 0,
    focusLongSessions: 0,
    focusMinutes: 0,
    xpEarned: 0,
    totalLevel: 6,
    highestSkillLevel: 1,
    skillLevels: {},
    questPoints: 0,
    combatPoints: 0,
    combatAchievementsCompleted: 0,
    collectionItems: 0,
  };
}

export function metricValue(rule: TrackingRule, m: AccountMetrics): number {
  switch (rule.metric) {
    case "questsAtDifficulty":
      return m.questsAtDifficulty[rule.difficulty ?? "NOVICE"] ?? 0;
    case "questsBySkill":
      return (rule.skill && m.questsBySkill[rule.skill]) || 0;
    case "skillLevel":
      return (rule.skill && m.skillLevels[rule.skill]) || 1;
    default:
      return m[rule.metric] as number;
  }
}

export type RuleProgress = { current: number; target: number; percent: number; complete: boolean };

export function ruleProgress(rule: TrackingRule, m: AccountMetrics): RuleProgress {
  const value = metricValue(rule, m);
  const current = Math.min(value, rule.target);
  return { current, target: rule.target, percent: Math.floor((current / rule.target) * 100), complete: value >= rule.target };
}

/** Counts for "at or above" difficulty from a list of completed difficulties. */
export function countAtDifficulty(completed: readonly QuestDifficulty[]): Record<QuestDifficulty, number> {
  return Object.fromEntries(
    QUEST_DIFFICULTIES.map((d, i) => [d, completed.filter((c) => QUEST_DIFFICULTIES.indexOf(c) >= i).length]),
  ) as Record<QuestDifficulty, number>;
}
