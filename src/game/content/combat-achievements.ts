/**
 * Default Combat Achievements (Product Spec §15, §31): execution challenges,
 * not another Quest list. All track automatically from explicit rules.
 */

import type { TrackingRule } from "../metrics";
import type { CombatAchievementTier } from "../vocabulary";

export type CombatAchievementDefinition = {
  key: string;
  tier: CombatAchievementTier;
  title: string;
  description: string;
  rule: TrackingRule;
  sortOrder: number;
};

const ca = (key: string, tier: CombatAchievementTier, title: string, description: string, rule: TrackingRule) => ({ key, tier, title, description, rule });

const LIST = [
  // Easy
  ca("first-blood", "EASY", "First Blood", "Complete your first Quest.", { metric: "questsCompleted", target: 1 }),
  ca("locked-in", "EASY", "Locked In", "Complete a qualifying Focus session.", { metric: "focusSessions", target: 1 }),
  ca("ahead-of-schedule", "EASY", "Ahead of Schedule", "Complete a Quest before its target date.", { metric: "questsBeforeTarget", target: 1 }),
  ca("on-the-clock", "EASY", "On the Clock", "Complete a Quest with a hard deadline on time.", { metric: "deadlineQuestsOnTime", target: 1 }),
  ca("main-character", "EASY", "Main Character", "Complete a Main Quest.", { metric: "mainQuestsCompleted", target: 1 }),
  ca("rising-adventurer", "EASY", "Rising Adventurer", "Reach Total Level 50.", { metric: "totalLevel", target: 50 }),
  ca("apprentice", "EASY", "Apprentice", "Reach Level 10 in any Skill.", { metric: "highestSkillLevel", target: 10 }),
  ca("pathfinder", "EASY", "Pathfinder", "Earn 10 Quest Points.", { metric: "questPoints", target: 10 }),
  // Medium
  ca("seasoned", "MEDIUM", "Seasoned", "Complete 10 Quests.", { metric: "questsCompleted", target: 10 }),
  ca("deep-diver", "MEDIUM", "Deep Diver", "Complete 10 qualifying Focus sessions.", { metric: "focusSessions", target: 10 }),
  ca("the-long-sit", "MEDIUM", "The Long Sit", "Complete a 90-minute Focus session.", { metric: "focusLongSessions", target: 1 }),
  ca("early-bird", "MEDIUM", "Early Bird", "Complete 5 Quests before their target dates.", { metric: "questsBeforeTarget", target: 5 }),
  ca("punctual", "MEDIUM", "Punctual", "Complete 5 deadline-bearing Quests on time.", { metric: "deadlineQuestsOnTime", target: 5 }),
  ca("boss-slayer", "MEDIUM", "Boss Slayer", "Defeat your first Boss.", { metric: "bossesDefeated", target: 1 }),
  ca("journeyman", "MEDIUM", "Journeyman", "Complete 5 Experienced or harder Quests.", { metric: "questsAtDifficulty", difficulty: "EXPERIENCED", target: 5 }),
  ca("path-walker", "MEDIUM", "Path Walker", "Complete a Questline.", { metric: "questlinesCompleted", target: 1 }),
  // Hard
  ca("veteran", "HARD", "Veteran", "Complete 25 Quests.", { metric: "questsCompleted", target: 25 }),
  ca("focused-mind", "HARD", "Focused Mind", "Focus for 25 hours in total.", { metric: "focusMinutes", target: 1_500 }),
  ca("bounty-hunter", "HARD", "Bounty Hunter", "Defeat a Boss before its target date.", { metric: "earlyBossBounties", target: 1 }),
  ca("deadline-destroyer", "HARD", "Deadline Destroyer", "Complete 10 deadline-bearing Quests on time.", { metric: "deadlineQuestsOnTime", target: 10 }),
  ca("master-at-work", "HARD", "Master at Work", "Complete a Master or Grandmaster Quest.", { metric: "questsAtDifficulty", difficulty: "MASTER", target: 1 }),
  ca("adept", "HARD", "Adept", "Reach Level 50 in any Skill.", { metric: "highestSkillLevel", target: 50 }),
  ca("well-rounded", "HARD", "Well-Rounded", "Reach Total Level 200.", { metric: "totalLevel", target: 200 }),
  ca("storied", "HARD", "Storied", "Earn 50 Quest Points.", { metric: "questPoints", target: 50 }),
  // Elite
  ca("giant-killer", "ELITE", "Giant Killer", "Defeat 5 Bosses.", { metric: "bossesDefeated", target: 5 }),
  ca("relentless", "ELITE", "Relentless", "Complete 50 Quests.", { metric: "questsCompleted", target: 50 }),
  ca("marathon-mind", "ELITE", "Marathon Mind", "Focus for 100 hours in total.", { metric: "focusMinutes", target: 6_000 }),
  ca("grandmaster-at-work", "ELITE", "Grandmaster at Work", "Complete a Grandmaster Quest.", { metric: "questsAtDifficulty", difficulty: "GRANDMASTER", target: 1 }),
  ca("cartographer", "ELITE", "Cartographer", "Complete 3 Questlines.", { metric: "questlinesCompleted", target: 3 }),
  ca("always-ahead", "ELITE", "Always Ahead", "Complete 25 Quests before their target dates.", { metric: "questsBeforeTarget", target: 25 }),
  // Master
  ca("legend-of-the-board", "MASTER", "Legend of the Board", "Complete 100 Quests.", { metric: "questsCompleted", target: 100 }),
  ca("boss-hunter", "MASTER", "Boss Hunter", "Defeat 10 Bosses.", { metric: "bossesDefeated", target: 10 }),
  ca("unstoppable", "MASTER", "Unstoppable", "Complete 25 Combat Achievements.", { metric: "combatAchievementsCompleted", target: 25 }),
  ca("sage", "MASTER", "Sage", "Reach Level 75 in any Skill.", { metric: "highestSkillLevel", target: 75 }),
  // Grandmaster
  ca("untouchable", "GRANDMASTER", "Untouchable", "Complete 50 deadline-bearing Quests on time.", { metric: "deadlineQuestsOnTime", target: 50 }),
  ca("living-legend", "GRANDMASTER", "Living Legend", "Reach Total Level 400.", { metric: "totalLevel", target: 400 }),
] as const;

export const COMBAT_ACHIEVEMENTS: readonly CombatAchievementDefinition[] = LIST.map((a, i) => ({ ...a, rule: { ...a.rule }, sortOrder: i + 1 }));
