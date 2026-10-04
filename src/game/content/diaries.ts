/**
 * Achievement Diary entries (Product Spec §14). Weekly and Monthly Diaries,
 * Easy → Medium → Hard → Elite. Auto-tracked entries measure activity within
 * the Diary's period; players may add their own manual entries.
 */

import type { TrackingRule } from "../metrics";
import type { DiaryTier } from "../vocabulary";

export type DiaryPeriod = "WEEKLY" | "MONTHLY";

export type DiaryEntryDefinition = {
  key: string;
  period: DiaryPeriod;
  tier: DiaryTier;
  title: string;
  rule: TrackingRule;
  sortOrder: number;
};

type Def = Omit<DiaryEntryDefinition, "sortOrder" | "key"> & { key?: string };

const WEEKLY: Def[] = [
  { period: "WEEKLY", tier: "EASY", title: "Complete a Quest", rule: { metric: "questsCompleted", target: 1 } },
  { period: "WEEKLY", tier: "EASY", title: "Finish a qualifying Focus session", rule: { metric: "focusSessions", target: 1 } },
  { period: "WEEKLY", tier: "MEDIUM", title: "Complete 3 Quests", rule: { metric: "questsCompleted", target: 3 } },
  { period: "WEEKLY", tier: "MEDIUM", title: "Earn 1,000 XP", rule: { metric: "xpEarned", target: 1_000 } },
  { period: "WEEKLY", tier: "MEDIUM", title: "Complete a Quest before its target date", rule: { metric: "questsBeforeTarget", target: 1 } },
  { period: "WEEKLY", tier: "HARD", title: "Complete 5 Quests", rule: { metric: "questsCompleted", target: 5 } },
  { period: "WEEKLY", tier: "HARD", title: "Complete an Experienced or harder Quest", rule: { metric: "questsAtDifficulty", difficulty: "EXPERIENCED", target: 1 } },
  { period: "WEEKLY", tier: "HARD", title: "Finish 5 Focus sessions", rule: { metric: "focusSessions", target: 5 } },
  { period: "WEEKLY", tier: "ELITE", title: "Defeat a Boss", rule: { metric: "bossesDefeated", target: 1 } },
  { period: "WEEKLY", tier: "ELITE", title: "Earn 5,000 XP", rule: { metric: "xpEarned", target: 5_000 } },
];

const MONTHLY: Def[] = [
  { period: "MONTHLY", tier: "EASY", title: "Complete 3 Quests", rule: { metric: "questsCompleted", target: 3 } },
  { period: "MONTHLY", tier: "EASY", title: "Finish 4 Focus sessions", rule: { metric: "focusSessions", target: 4 } },
  { period: "MONTHLY", tier: "MEDIUM", title: "Complete 8 Quests", rule: { metric: "questsCompleted", target: 8 } },
  { period: "MONTHLY", tier: "MEDIUM", title: "Earn 5,000 XP", rule: { metric: "xpEarned", target: 5_000 } },
  { period: "MONTHLY", tier: "MEDIUM", title: "Complete 3 Quests before their target dates", rule: { metric: "questsBeforeTarget", target: 3 } },
  { period: "MONTHLY", tier: "HARD", title: "Complete 15 Quests", rule: { metric: "questsCompleted", target: 15 } },
  { period: "MONTHLY", tier: "HARD", title: "Complete a Master or harder Quest", rule: { metric: "questsAtDifficulty", difficulty: "MASTER", target: 1 } },
  { period: "MONTHLY", tier: "HARD", title: "Focus for 15 hours", rule: { metric: "focusMinutes", target: 900 } },
  { period: "MONTHLY", tier: "ELITE", title: "Defeat 2 Bosses", rule: { metric: "bossesDefeated", target: 2 } },
  { period: "MONTHLY", tier: "ELITE", title: "Complete a Questline", rule: { metric: "questlinesCompleted", target: 1 } },
  { period: "MONTHLY", tier: "ELITE", title: "Earn 15,000 XP", rule: { metric: "xpEarned", target: 15_000 } },
];

export const DIARY_ENTRIES: readonly DiaryEntryDefinition[] = [...WEEKLY, ...MONTHLY].map((d, i) => ({
  ...d,
  key: d.key ?? `${d.period.toLowerCase()}-${d.tier.toLowerCase()}-${i + 1}`,
  rule: { ...d.rule },
  sortOrder: i + 1,
}));
