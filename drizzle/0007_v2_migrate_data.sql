-- Questly V2 data migration. Runs after the V2 columns exist (0006) and before
-- obsolete tables/columns are dropped (0008). Nothing meaningful is discarded:
--   * every GP ledger entry is copied into gp_transactions (balances unchanged);
--   * quests keep their GP reward, dates, and history; statuses collapse to
--     active / completed / archived; active quests get a deterministic order;
--   * quest objectives are folded into the description as a checklist.

-- 1. GP ledger → gp_transactions (in original order).
INSERT INTO "gp_transactions" ("character_id", "amount", "transaction_type", "source_type", "source_id", "description", "idempotency_key", "created_at")
SELECT
  pt."character_id",
  pt."amount",
  CASE WHEN pt."amount" > 0 THEN 'EARN' ELSE 'SPEND' END,
  CASE pt."source_type" WHEN 'QUEST' THEN 'QUEST' WHEN 'REWARD_REDEMPTION' THEN 'REWARD' ELSE 'SYSTEM' END,
  pt."source_id",
  COALESCE(
    pt."metadata"->>'questTitle',
    pt."metadata"->>'rewardName',
    pt."metadata"->>'questlineTitle',
    initcap(replace(lower(pt."source_type"), '_', ' '))
  ),
  pt."idempotency_key",
  pt."created_at"
FROM "progression_transactions" pt
WHERE pt."kind" = 'GP'
ORDER BY pt."seq";
--> statement-breakpoint

-- 2. Objectives → description checklist.
UPDATE "quests" q
SET "description" = trim(both E'\n' from q."description" || E'\n\n' || o.checklist)
FROM (
  SELECT "quest_id", string_agg(CASE WHEN "completed_at" IS NULL THEN '- [ ] ' ELSE '- [x] ' END || "title", E'\n' ORDER BY "position") AS checklist
  FROM "quest_objectives"
  GROUP BY "quest_id"
) o
WHERE o."quest_id" = q."id";
--> statement-breakpoint

-- 3. Rewards, statuses, archive timestamps.
UPDATE "quests" SET
  "gp_reward" = "reward_gp",
  "archived_at" = CASE WHEN "status" = 'ABANDONED' THEN COALESCE("abandoned_at", "updated_at") ELSE NULL END,
  "status" = CASE "status" WHEN 'COMPLETED' THEN 'completed' WHEN 'ABANDONED' THEN 'archived' ELSE 'active' END;
--> statement-breakpoint

-- 4. Deterministic order for active quests (old Main Quests first, then oldest).
UPDATE "quests" q SET "position" = ordered.pos
FROM (
  SELECT "id", (row_number() OVER (PARTITION BY "character_id" ORDER BY ("priority" = 'MAIN') DESC, "created_at", "id") - 1)::int AS pos
  FROM "quests" WHERE "status" = 'active'
) ordered
WHERE ordered."id" = q."id";
--> statement-breakpoint

ALTER TABLE "quests" ADD CONSTRAINT "quests_status_v2" CHECK ("status" IN ('active', 'completed', 'archived'));
--> statement-breakpoint
ALTER TABLE "quests" ADD CONSTRAINT "quests_completed_v2" CHECK (("status" = 'completed') = ("completed_at" IS NOT NULL));
--> statement-breakpoint

-- 5. Reward icons outside the V2 icon set fall back to the gift icon.
UPDATE "rewards" SET "icon" = CASE "icon" WHEN 'combat' THEN 'gamepad' WHEN 'gp' THEN 'burger' WHEN 'settings' THEN 'monitor' WHEN 'skill-creator' THEN 'star' ELSE 'gift' END
WHERE "icon" NOT IN ('gamepad', 'burger', 'gift', 'monitor', 'tent', 'collection', 'shop', 'star', 'world', 'diaries', 'sword', 'character');
