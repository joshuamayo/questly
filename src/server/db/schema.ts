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
    acceptedAt: timestamp("accepted_at", { withTimezone: true, mode: "date" }),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
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

export type QuestRow = typeof quests.$inferSelect;
export type QuestObjectiveRow = typeof questObjectives.$inferSelect;
export type QuestTemplateRow = typeof questTemplates.$inferSelect;

export type CharacterRow = typeof characters.$inferSelect;
export type SkillRow = typeof skills.$inferSelect;
export type ProgressionTransactionRow = typeof progressionTransactions.$inferSelect;
export type ActivityEventRow = typeof activityEvents.$inferSelect;
