CREATE TABLE "quest_objectives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quest_id" uuid NOT NULL,
	"title" text NOT NULL,
	"position" integer NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quest_templates" (
	"key" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"skill_key" text,
	"difficulty" text,
	"objectives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"icon" text NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"template_key" text,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"skill_key" text NOT NULL,
	"difficulty" text NOT NULL,
	"status" text NOT NULL,
	"priority" text DEFAULT 'SIDE' NOT NULL,
	"target_date" date,
	"deadline" date,
	"reward_xp" integer NOT NULL,
	"reward_gp" integer NOT NULL,
	"reward_qp" integer NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"accepted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"abandoned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quests_status_valid" CHECK ("quests"."status" IN ('AVAILABLE', 'LOCKED', 'ACCEPTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ABANDONED')),
	CONSTRAINT "quests_difficulty_valid" CHECK ("quests"."difficulty" IN ('NOVICE', 'INTERMEDIATE', 'EXPERIENCED', 'MASTER', 'GRANDMASTER')),
	CONSTRAINT "quests_priority_valid" CHECK ("quests"."priority" IN ('MAIN', 'SIDE')),
	CONSTRAINT "quests_rewards_non_negative" CHECK ("quests"."reward_xp" >= 0 AND "quests"."reward_gp" >= 0 AND "quests"."reward_qp" >= 0),
	CONSTRAINT "quests_completed_has_timestamp" CHECK (("quests"."status" = 'COMPLETED') = ("quests"."completed_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "quest_objectives" ADD CONSTRAINT "quest_objectives_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_templates" ADD CONSTRAINT "quest_templates_skill_key_skills_key_fk" FOREIGN KEY ("skill_key") REFERENCES "public"."skills"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quests" ADD CONSTRAINT "quests_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quests" ADD CONSTRAINT "quests_template_key_quest_templates_key_fk" FOREIGN KEY ("template_key") REFERENCES "public"."quest_templates"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quests" ADD CONSTRAINT "quests_skill_key_skills_key_fk" FOREIGN KEY ("skill_key") REFERENCES "public"."skills"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quest_objectives_quest_idx" ON "quest_objectives" USING btree ("quest_id","position");--> statement-breakpoint
CREATE INDEX "quests_character_status_idx" ON "quests" USING btree ("character_id","status");