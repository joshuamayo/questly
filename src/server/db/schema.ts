/**
 * Questly V2 database schema (PostgreSQL via Drizzle).
 *
 * Five entities: the character (the spec's User), Quests, the GP ledger,
 * Rewards, and Reward redemptions.
 *
 * - Current / Locked are never stored: the Current Quest is the first active
 *   Quest by `position`, and every later active Quest is Locked.
 * - `gp_transactions` is the append-only GP ledger; `characters.gp_balance` is
 *   its cached projection and must always reconcile with it.
 */

import { sql } from "drizzle-orm";
import { bigserial, boolean, check, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

const createdAt = (name = "created_at") => timestamp(name, { withTimezone: true, mode: "date" }).notNull().defaultNow();

export const characters = pgTable(
  "characters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Supabase auth user id. Null for the local single-player character. */
    authSubject: text("auth_subject").unique(),
    displayName: text("display_name").notNull(),
    avatarConfig: jsonb("avatar_config").notNull().default({}),
    settings: jsonb("settings").notNull().default({}),
    gpBalance: integer("gp_balance").notNull().default(0),
    lifetimeGpEarned: integer("lifetime_gp_earned").notNull().default(0),
    lifetimeGpSpent: integer("lifetime_gp_spent").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    check("characters_gp_non_negative", sql`${t.gpBalance} >= 0`),
    check("characters_lifetime_gp_non_negative", sql`${t.lifetimeGpEarned} >= 0 AND ${t.lifetimeGpSpent} >= 0`),
    check("characters_gp_reconciles", sql`${t.gpBalance} = ${t.lifetimeGpEarned} - ${t.lifetimeGpSpent}`),
  ],
);

export const quests = pgTable(
  "quests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    gpReward: integer("gp_reward").notNull().default(10),
    /** Order among active Quests (0 = Current). Rewritten contiguously on every change. */
    position: integer("position").notNull().default(0),
    /** active | completed | archived */
    status: text("status").notNull(),
    createdAt: createdAt(),
    updatedAt: createdAt("updated_at"),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
  },
  (t) => [
    check("quests_status_v2", sql`${t.status} IN ('active', 'completed', 'archived')`),
    check("quests_completed_v2", sql`(${t.status} = 'completed') = (${t.completedAt} IS NOT NULL)`),
    check("quests_gp_reward_range", sql`${t.gpReward} >= 0 AND ${t.gpReward} <= 100000`),
    index("quests_character_status_position_idx").on(t.characterId, t.status, t.position),
    index("quests_character_completed_idx").on(t.characterId, t.completedAt),
  ],
);

/** Append-only GP ledger. EARN > 0, SPEND < 0; idempotency keys prevent double rewards. */
export const gpTransactions = pgTable(
  "gp_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seq: bigserial("seq", { mode: "number" }).notNull().unique(),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    transactionType: text("transaction_type").notNull(),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id"),
    description: text("description").notNull().default(""),
    idempotencyKey: text("idempotency_key"),
    createdAt: createdAt(),
  },
  (t) => [
    check("gp_tx_amount_nonzero", sql`${t.amount} <> 0`),
    check("gp_tx_type_valid", sql`${t.transactionType} IN ('EARN', 'SPEND', 'ADJUST')`),
    check("gp_tx_sign_matches_type", sql`(${t.transactionType} <> 'EARN' OR ${t.amount} > 0) AND (${t.transactionType} <> 'SPEND' OR ${t.amount} < 0)`),
    check("gp_tx_source_valid", sql`${t.sourceType} IN ('QUEST', 'REWARD', 'SYSTEM')`),
    uniqueIndex("gp_tx_idempotency_unique").on(t.characterId, t.idempotencyKey).where(sql`${t.idempotencyKey} IS NOT NULL`),
    index("gp_tx_character_created_idx").on(t.characterId, t.createdAt),
  ],
);

/** Player-defined real-life rewards. Archived (inactive), never deleted, once redeemed. */
export const rewards = pgTable(
  "rewards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    icon: text("icon").notNull(),
    gpCost: integer("gp_cost").notNull(),
    repeatable: boolean("repeatable").notNull().default(true),
    active: boolean("active").notNull().default(true),
    /** The one Reward shown as "Saving for" on the Quest Log. */
    featuredGoal: boolean("featured_goal").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    check("rewards_cost_positive", sql`${t.gpCost} > 0`),
    index("rewards_character_idx").on(t.characterId),
    uniqueIndex("rewards_one_featured_goal").on(t.characterId).where(sql`${t.featuredGoal}`),
  ],
);

export const rewardRedemptions = pgTable(
  "reward_redemptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rewardId: uuid("reward_id")
      .notNull()
      .references(() => rewards.id),
    characterId: uuid("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    gpCostSnapshot: integer("gp_cost_snapshot").notNull(),
    rewardNameSnapshot: text("reward_name_snapshot").notNull(),
    redeemedAt: createdAt("redeemed_at"),
  },
  (t) => [index("reward_redemptions_character_idx").on(t.characterId, t.redeemedAt)],
);

export type CharacterRow = typeof characters.$inferSelect;
export type QuestRow = typeof quests.$inferSelect;
export type GpTransactionRow = typeof gpTransactions.$inferSelect;
export type RewardRow = typeof rewards.$inferSelect;
export type RewardRedemptionRow = typeof rewardRedemptions.$inferSelect;
