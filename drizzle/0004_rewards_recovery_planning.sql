CREATE TABLE "activity_days" (
	"character_id" uuid NOT NULL,
	"day" date NOT NULL,
	"adventure" boolean DEFAULT false NOT NULL,
	"focus" boolean DEFAULT false NOT NULL,
	CONSTRAINT "activity_days_character_id_day_pk" PRIMARY KEY("character_id","day")
);
--> statement-breakpoint
CREATE TABLE "quest_date_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quest_id" uuid NOT NULL,
	"field" text NOT NULL,
	"old_value" date,
	"new_value" date,
	"reason" text DEFAULT 'EDIT' NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "respawns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"trigger" text NOT NULL,
	"respawn_quest_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reward_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reward_id" uuid NOT NULL,
	"character_id" uuid NOT NULL,
	"gp_cost_snapshot" integer NOT NULL,
	"reward_name_snapshot" text NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text NOT NULL,
	"icon" text NOT NULL,
	"gp_cost" integer NOT NULL,
	"repeatable" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"estimated_value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rewards_cost_positive" CHECK ("rewards"."gp_cost" > 0)
);
--> statement-breakpoint
CREATE TABLE "shield_uses" (
	"character_id" uuid NOT NULL,
	"day" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shield_uses_character_id_day_pk" PRIMARY KEY("character_id","day")
);
--> statement-breakpoint
CREATE TABLE "weekly_plan_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"day" date NOT NULL,
	"quest_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"week_start" date NOT NULL,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "streak_shields" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "is_respawn_quest" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_days" ADD CONSTRAINT "activity_days_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_date_changes" ADD CONSTRAINT "quest_date_changes_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respawns" ADD CONSTRAINT "respawns_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respawns" ADD CONSTRAINT "respawns_respawn_quest_id_quests_id_fk" FOREIGN KEY ("respawn_quest_id") REFERENCES "public"."quests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shield_uses" ADD CONSTRAINT "shield_uses_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_plan_items" ADD CONSTRAINT "weekly_plan_items_plan_id_weekly_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."weekly_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_plan_items" ADD CONSTRAINT "weekly_plan_items_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_plans" ADD CONSTRAINT "weekly_plans_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quest_date_changes_quest_idx" ON "quest_date_changes" USING btree ("quest_id");--> statement-breakpoint
CREATE INDEX "respawns_character_idx" ON "respawns" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "reward_redemptions_character_idx" ON "reward_redemptions" USING btree ("character_id","redeemed_at");--> statement-breakpoint
CREATE INDEX "rewards_character_idx" ON "rewards" USING btree ("character_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_plan_items_unique" ON "weekly_plan_items" USING btree ("plan_id","day","quest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_plans_character_week" ON "weekly_plans" USING btree ("character_id","week_start");--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_shields_non_negative" CHECK ("characters"."streak_shields" >= 0);