/**
 * Questly database schema (PostgreSQL via Drizzle).
 *
 * Conventions:
 * - Seed/definition tables (skills, titles, capes) are global content keyed by
 *   stable text keys; user tables reference them and never mutate them.
 * - `progression_transactions` is the append-only source of truth for XP, GP,
 *   Quest Points, and Combat Points. Balances on `characters` and XP on
 *   `character_skills` are cached projections, reconcilable from the ledger.
 * - Levels are never stored; they are derived from XP by the game engine.
 */

import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = (name = "created_at") =>
  timestamp(name, { withTimezone: true, mode: "date" }).notNull().defaultNow();

// ---------------------------------------------------------------------------
// Seed definitions
// ---------------------------------------------------------------------------

export const skills = pgTable("skills", {
  key: text("key").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  motto: text("motto").notNull(),
  icon: text("icon").notNull(),
  artDirection: text("art_direction").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const titles = pgTable("titles", {
  key: text("key").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  isStarter: boolean("is_starter").notNull().default(false),
  /** Tracking rule that unlocks the title (null for starter titles). */
  rule: jsonb("rule"),
  sortOrder: integer("sort_order").notNull(),
});

export const capes = pgTable("capes", {
  key: text("key").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  skillKey: text("skill_key").references(() => skills.key),
  sortOrder: integer("sort_order").notNull(),
});

// ---------------------------------------------------------------------------
// Character (the spec's "User")
// ---------------------------------------------------------------------------

export const characters = pgTable(
  "characters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Future auth subject (e.g. Supabase auth user id). Null for the local dev character. */
    authSubject: text("auth_subject").unique(),
    displayName: text("display_name").notNull(),
    avatarConfig: jsonb("avatar_config").notNull().default({}),
    settings: jsonb("settings").notNull().default({}),
    equippedTitleKey: text("equipped_title_key").references(() => titles.key),
    equippedCapeKey: text("equipped_cape_key").references(() => capes.key),
    gpBalance: integer("gp_balance").notNull().default(0),
    lifetimeGpEarned: integer("lifetime_gp_earned").notNull().default(0),
    lifetimeGpSpent: integer("lifetime_gp_spent").notNull().default(0),
    questPoints: integer("quest_points").notNull().default(0),
    combatPoints: integer("combat_points").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    check("characters_gp_non_negative", sql`${t.gpBalance} >= 0`),
    check("characters_lifetime_gp_non_negative", sql`${t.lifetimeGpEarned} >= 0 AND ${t.lifetimeGpSpent} >= 0`),
    check("characters_gp_reconciles", sql`${t.gpBalance} = ${t.lifetimeGpEarned} - ${t.lifetimeGpSpent}`),
    check("characters_qp_non_negative", sql`${t.questPoints} >= 0`),
    check("characters_cp_non_negative", sql`${t.combatPoints} >= 0`),
  ],
);

export const characterSkills = pgTable(
  "character_skills",
  {
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    skillKey: text("skill_key")
      .notNull()
      .references(() => skills.key),
    xp: integer("xp").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.characterId, t.skillKey] }),
    check("character_skills_xp_non_negative", sql`${t.xp} >= 0`),
  ],
);

export const characterTitles = pgTable(
  "character_titles",
  {
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    titleKey: text("title_key")
      .notNull()
      .references(() => titles.key),
    unlockedAt: createdAt("unlocked_at"),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.titleKey] })],
);

// ---------------------------------------------------------------------------
// Progression ledger + activity
// ---------------------------------------------------------------------------

export const progressionTransactions = pgTable(
  "progression_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Monotonic insertion order; ledger replay uses this, not timestamps. */
    seq: bigserial("seq", { mode: "number" }).notNull().unique(),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    /** XP | GP | QP | COMBAT_POINTS */
    kind: text("kind").notNull(),
    amount: integer("amount").notNull(),
    skillKey: text("skill_key").references(() => skills.key),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id"),
    idempotencyKey: text("idempotency_key"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [
    check("progression_kind_valid", sql`${t.kind} IN ('XP', 'GP', 'QP', 'COMBAT_POINTS')`),
    check("progression_amount_nonzero", sql`${t.amount} <> 0`),
    check("progression_only_gp_negative", sql`${t.kind} = 'GP' OR ${t.amount} > 0`),
    check(
      "progression_skill_for_xp_only",
      sql`(${t.kind} = 'XP') = (${t.skillKey} IS NOT NULL)`,
    ),
    uniqueIndex("progression_idempotency_unique")
      .on(t.characterId, t.idempotencyKey)
      .where(sql`${t.idempotencyKey} IS NOT NULL`),
    index("progression_character_created_idx").on(t.characterId, t.createdAt),
    index("progression_source_idx").on(t.sourceType, t.sourceId),
  ],
);

export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    entityId: text("entity_id"),
    payload: jsonb("payload").notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [index("activity_character_created_idx").on(t.characterId, t.createdAt)],
);

// ---------------------------------------------------------------------------
// Quests
// ---------------------------------------------------------------------------

/** Seed content: reusable Quest Board adventures. Never mutated by play. */
export const questTemplates = pgTable("quest_templates", {
  key: text("key").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  skillKey: text("skill_key").references(() => skills.key),
  difficulty: text("difficulty"),
  objectives: jsonb("objectives").notNull().default([]),
  icon: text("icon").notNull(),
  isCustom: boolean("is_custom").notNull().default(false),
  sortOrder: integer("sort_order").notNull(),
});

export const questlines = pgTable(
  "questlines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    /** Skill that receives the Questline completion bonus XP. */
    skillKey: text("skill_key")
      .notNull()
      .references(() => skills.key),
    icon: text("icon").notNull().default("questlines"),
    status: text("status").notNull().default("ACTIVE"),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    createdAt: createdAt(),
  },
  (t) => [
    check("questlines_status_valid", sql`${t.status} IN ('ACTIVE', 'COMPLETED', 'ARCHIVED')`),
    index("questlines_character_idx").on(t.characterId),
  ],
);

export const quests = pgTable(
  "quests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    templateKey: text("template_key").references(() => questTemplates.key),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    skillKey: text("skill_key")
      .notNull()
      .references(() => skills.key),
    difficulty: text("difficulty").notNull(),
    status: text("status").notNull(),
    priority: text("priority").notNull().default("SIDE"),
    targetDate: date("target_date", { mode: "string" }),
    deadline: date("deadline", { mode: "string" }),
    /** Reward snapshot taken at acceptance (CLAUDE.md §10). */
    rewardXp: integer("reward_xp").notNull(),
    rewardGp: integer("reward_gp").notNull(),
    rewardQp: integer("reward_qp").notNull(),
    notes: text("notes").notNull().default(""),
    questlineId: uuid("questline_id").references(() => questlines.id, { onDelete: "set null" }),
    /** Boss designation. Only one active Boss per character (partial unique index). */
    isBoss: boolean("is_boss").notNull().default(false),
    bossDesignatedAt: timestamp("boss_designated_at", { withTimezone: true, mode: "date" }),
    /** Bounty configuration snapshotted when the Boss was designated. */
    bounty: jsonb("bounty"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "date" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    /** The player's local calendar date at completion (for on-time tracking). */
    completedLocalDate: date("completed_local_date", { mode: "string" }),
    abandonedAt: timestamp("abandoned_at", { withTimezone: true, mode: "date" }),
    createdAt: createdAt(),
    updatedAt: createdAt("updated_at"),
  },
  (t) => [
    check(
      "quests_status_valid",
      sql`${t.status} IN ('AVAILABLE', 'LOCKED', 'ACCEPTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ABANDONED')`,
    ),
    check(
      "quests_difficulty_valid",
      sql`${t.difficulty} IN ('NOVICE', 'INTERMEDIATE', 'EXPERIENCED', 'MASTER', 'GRANDMASTER')`,
    ),
    check("quests_priority_valid", sql`${t.priority} IN ('MAIN', 'SIDE')`),
    check("quests_rewards_non_negative", sql`${t.rewardXp} >= 0 AND ${t.rewardGp} >= 0 AND ${t.rewardQp} >= 0`),
    check("quests_completed_has_timestamp", sql`(${t.status} = 'COMPLETED') = (${t.completedAt} IS NOT NULL)`),
    index("quests_character_status_idx").on(t.characterId, t.status),
    index("quests_questline_idx").on(t.questlineId),
    uniqueIndex("quests_one_active_boss")
      .on(t.characterId)
      .where(sql`${t.isBoss} AND ${t.status} IN ('ACCEPTED', 'IN_PROGRESS', 'ON_HOLD')`),
  ],
);

/** Questline dependency edges: the child unlocks when all its parents are complete. */
export const questDependencies = pgTable(
  "quest_dependencies",
  {
    parentQuestId: uuid("parent_quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    childQuestId: uuid("child_quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.parentQuestId, t.childQuestId] }),
    check("quest_dependencies_no_self", sql`${t.parentQuestId} <> ${t.childQuestId}`),
  ],
);

export const questRequirements = pgTable(
  "quest_requirements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questId: uuid("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    /** Quest id, Questline id, Skill key, Collection item key, or ISO date depending on type. */
    reference: text("reference"),
    requiredValue: integer("required_value"),
    /** Description for manual requirements. */
    label: text("label"),
    manualMet: boolean("manual_met").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    check(
      "quest_requirements_type_valid",
      sql`${t.type} IN ('QUEST_COMPLETED', 'QUESTLINE_COMPLETED', 'SKILL_LEVEL', 'QUEST_POINTS', 'COMBAT_POINTS', 'COLLECTION_ITEM', 'DATE_REACHED', 'MANUAL')`,
    ),
    index("quest_requirements_quest_idx").on(t.questId),
  ],
);

export const focusSessions = pgTable(
  "focus_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    questId: uuid("quest_id").references(() => quests.id, { onDelete: "set null" }),
    objectiveId: uuid("objective_id").references(() => questObjectives.id, { onDelete: "set null" }),
    plannedMinutes: integer("planned_minutes").notNull(),
    status: text("status").notNull().default("ACTIVE"),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true, mode: "date" }),
    qualifyingMinutes: integer("qualifying_minutes").notNull().default(0),
    focusXpAwarded: integer("focus_xp_awarded").notNull().default(0),
  },
  (t) => [
    check("focus_sessions_status_valid", sql`${t.status} IN ('ACTIVE', 'COMPLETED', 'CANCELLED')`),
    check("focus_sessions_minutes_valid", sql`${t.plannedMinutes} BETWEEN 5 AND 180`),
    uniqueIndex("focus_sessions_one_active").on(t.characterId).where(sql`${t.status} = 'ACTIVE'`),
    index("focus_sessions_character_started_idx").on(t.characterId, t.startedAt),
  ],
);

export const questObjectives = pgTable(
  "quest_objectives",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questId: uuid("quest_id")
      .notNull()
      .references(() => quests.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: integer("position").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    createdAt: createdAt(),
  },
  (t) => [index("quest_objectives_quest_idx").on(t.questId, t.position)],
);

// ---------------------------------------------------------------------------
// Meta progression: Combat Achievements, Collection Log, Achievement Diaries
// ---------------------------------------------------------------------------

export const combatAchievements = pgTable("combat_achievements", {
  key: text("key").primaryKey(),
  tier: text("tier").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  rule: jsonb("rule").notNull(),
  combatPoints: integer("combat_points").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const characterCombatAchievements = pgTable(
  "character_combat_achievements",
  {
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    achievementKey: text("achievement_key")
      .notNull()
      .references(() => combatAchievements.key),
    completedAt: createdAt("completed_at"),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.achievementKey] })],
);

export const collectionItems = pgTable("collection_items", {
  key: text("key").primaryKey(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  rarity: text("rarity").notNull(),
  secret: boolean("secret").notNull().default(false),
  icon: text("icon").notNull(),
  /** Null = claimed manually. */
  rule: jsonb("rule"),
  sortOrder: integer("sort_order").notNull(),
});

export const characterCollectionItems = pgTable(
  "character_collection_items",
  {
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    itemKey: text("item_key")
      .notNull()
      .references(() => collectionItems.key),
    unlockedAt: createdAt("unlocked_at"),
    /** AUTO (rule met) or MANUAL (claimed by the player). */
    source: text("source").notNull(),
    note: text("note").notNull().default(""),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.itemKey] })],
);

export const diaryEntryTemplates = pgTable("diary_entry_templates", {
  key: text("key").primaryKey(),
  period: text("period").notNull(),
  tier: text("tier").notNull(),
  title: text("title").notNull(),
  rule: jsonb("rule").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

/** Player-written manual Diary entries for a specific period. */
export const diaryCustomEntries = pgTable(
  "diary_custom_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    period: text("period").notNull(),
    periodStart: date("period_start", { mode: "string" }).notNull(),
    tier: text("tier").notNull(),
    title: text("title").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    createdAt: createdAt(),
  },
  (t) => [index("diary_custom_character_period_idx").on(t.characterId, t.period, t.periodStart)],
);

/** One row per claimed Diary tier: the primary key makes claims one-time. */
export const diaryClaims = pgTable(
  "diary_claims",
  {
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    period: text("period").notNull(),
    periodStart: date("period_start", { mode: "string" }).notNull(),
    tier: text("tier").notNull(),
    claimedAt: createdAt("claimed_at"),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.period, t.periodStart, t.tier] })],
);

export type QuestRow = typeof quests.$inferSelect;
export type QuestlineRow = typeof questlines.$inferSelect;
export type QuestRequirementRow = typeof questRequirements.$inferSelect;
export type FocusSessionRow = typeof focusSessions.$inferSelect;
export type QuestObjectiveRow = typeof questObjectives.$inferSelect;
export type QuestTemplateRow = typeof questTemplates.$inferSelect;

export type CharacterRow = typeof characters.$inferSelect;
export type SkillRow = typeof skills.$inferSelect;
export type ProgressionTransactionRow = typeof progressionTransactions.$inferSelect;
export type ActivityEventRow = typeof activityEvents.$inferSelect;
