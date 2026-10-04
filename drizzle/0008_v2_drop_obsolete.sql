-- Questly V2: remove obsolete systems (runs after the 0007 data migration).
DROP TABLE "activity_days" CASCADE;--> statement-breakpoint
DROP TABLE "activity_events" CASCADE;--> statement-breakpoint
DROP TABLE "capes" CASCADE;--> statement-breakpoint
DROP TABLE "character_collection_items" CASCADE;--> statement-breakpoint
DROP TABLE "character_combat_achievements" CASCADE;--> statement-breakpoint
DROP TABLE "character_skills" CASCADE;--> statement-breakpoint
DROP TABLE "character_titles" CASCADE;--> statement-breakpoint
DROP TABLE "collection_items" CASCADE;--> statement-breakpoint
DROP TABLE "combat_achievements" CASCADE;--> statement-breakpoint
DROP TABLE "diary_claims" CASCADE;--> statement-breakpoint
DROP TABLE "diary_custom_entries" CASCADE;--> statement-breakpoint
DROP TABLE "diary_entry_templates" CASCADE;--> statement-breakpoint
DROP TABLE "focus_sessions" CASCADE;--> statement-breakpoint
DROP TABLE "progression_transactions" CASCADE;--> statement-breakpoint
DROP TABLE "quest_date_changes" CASCADE;--> statement-breakpoint
DROP TABLE "quest_dependencies" CASCADE;--> statement-breakpoint
DROP TABLE "quest_objectives" CASCADE;--> statement-breakpoint
DROP TABLE "quest_requirements" CASCADE;--> statement-breakpoint
DROP TABLE "quest_templates" CASCADE;--> statement-breakpoint
DROP TABLE "questlines" CASCADE;--> statement-breakpoint
DROP TABLE "respawns" CASCADE;--> statement-breakpoint
DROP TABLE "shield_uses" CASCADE;--> statement-breakpoint
DROP TABLE "skills" CASCADE;--> statement-breakpoint
DROP TABLE "titles" CASCADE;--> statement-breakpoint
DROP TABLE "weekly_plan_items" CASCADE;--> statement-breakpoint
DROP TABLE "weekly_plans" CASCADE;--> statement-breakpoint
ALTER TABLE "characters" DROP CONSTRAINT IF EXISTS "characters_shields_non_negative";--> statement-breakpoint
ALTER TABLE "characters" DROP CONSTRAINT IF EXISTS "characters_qp_non_negative";--> statement-breakpoint
ALTER TABLE "characters" DROP CONSTRAINT IF EXISTS "characters_cp_non_negative";--> statement-breakpoint
ALTER TABLE "quests" DROP CONSTRAINT IF EXISTS "quests_difficulty_valid";--> statement-breakpoint
ALTER TABLE "quests" DROP CONSTRAINT IF EXISTS "quests_priority_valid";--> statement-breakpoint
ALTER TABLE "quests" DROP CONSTRAINT IF EXISTS "quests_rewards_non_negative";--> statement-breakpoint
ALTER TABLE "characters" DROP CONSTRAINT IF EXISTS "characters_equipped_title_key_titles_key_fk";
--> statement-breakpoint
ALTER TABLE "characters" DROP CONSTRAINT IF EXISTS "characters_equipped_cape_key_capes_key_fk";
--> statement-breakpoint
ALTER TABLE "quests" DROP CONSTRAINT IF EXISTS "quests_template_key_quest_templates_key_fk";
--> statement-breakpoint
ALTER TABLE "quests" DROP CONSTRAINT IF EXISTS "quests_skill_key_skills_key_fk";
--> statement-breakpoint
ALTER TABLE "quests" DROP CONSTRAINT IF EXISTS "quests_questline_id_questlines_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "quests_character_status_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "quests_questline_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "quests_one_active_boss";--> statement-breakpoint
CREATE INDEX "quests_character_status_position_idx" ON "quests" USING btree ("character_id","status","position");--> statement-breakpoint
CREATE INDEX "quests_character_completed_idx" ON "quests" USING btree ("character_id","completed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "rewards_one_featured_goal" ON "rewards" USING btree ("character_id") WHERE "rewards"."featured_goal";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "equipped_title_key";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "equipped_cape_key";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "quest_points";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "combat_points";--> statement-breakpoint
ALTER TABLE "characters" DROP COLUMN "streak_shields";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "template_key";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "skill_key";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "difficulty";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "priority";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "target_date";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "deadline";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "reward_xp";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "reward_gp";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "reward_qp";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "notes";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "questline_id";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "is_boss";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "boss_designated_at";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "bounty";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "is_respawn_quest";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "accepted_at";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "completed_local_date";--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "abandoned_at";--> statement-breakpoint
ALTER TABLE "rewards" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "rewards" DROP COLUMN "estimated_value";--> statement-breakpoint
ALTER TABLE "quests" ADD CONSTRAINT "quests_gp_reward_range" CHECK ("quests"."gp_reward" >= 0 AND "quests"."gp_reward" <= 100000);