CREATE TABLE "focus_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"quest_id" uuid,
	"objective_id" uuid,
	"planned_minutes" integer NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"qualifying_minutes" integer DEFAULT 0 NOT NULL,
	"focus_xp_awarded" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "focus_sessions_status_valid" CHECK ("focus_sessions"."status" IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
	CONSTRAINT "focus_sessions_minutes_valid" CHECK ("focus_sessions"."planned_minutes" BETWEEN 5 AND 180)
);
--> statement-breakpoint
CREATE TABLE "quest_dependencies" (
	"parent_quest_id" uuid NOT NULL,
	"child_quest_id" uuid NOT NULL,
	CONSTRAINT "quest_dependencies_parent_quest_id_child_quest_id_pk" PRIMARY KEY("parent_quest_id","child_quest_id"),
	CONSTRAINT "quest_dependencies_no_self" CHECK ("quest_dependencies"."parent_quest_id" <> "quest_dependencies"."child_quest_id")
);
--> statement-breakpoint
CREATE TABLE "quest_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quest_id" uuid NOT NULL,
	"type" text NOT NULL,
	"reference" text,
	"required_value" integer,
	"label" text,
	"manual_met" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quest_requirements_type_valid" CHECK ("quest_requirements"."type" IN ('QUEST_COMPLETED', 'QUESTLINE_COMPLETED', 'SKILL_LEVEL', 'QUEST_POINTS', 'COMBAT_POINTS', 'COLLECTION_ITEM', 'DATE_REACHED', 'MANUAL'))
);
--> statement-breakpoint
CREATE TABLE "questlines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"skill_key" text NOT NULL,
	"icon" text DEFAULT 'questlines' NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "questlines_status_valid" CHECK ("questlines"."status" IN ('ACTIVE', 'COMPLETED', 'ARCHIVED'))
);
--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "questline_id" uuid;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "is_boss" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "boss_designated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "bounty" jsonb;--> statement-breakpoint
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_objective_id_quest_objectives_id_fk" FOREIGN KEY ("objective_id") REFERENCES "public"."quest_objectives"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_dependencies" ADD CONSTRAINT "quest_dependencies_parent_quest_id_quests_id_fk" FOREIGN KEY ("parent_quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_dependencies" ADD CONSTRAINT "quest_dependencies_child_quest_id_quests_id_fk" FOREIGN KEY ("child_quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_requirements" ADD CONSTRAINT "quest_requirements_quest_id_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questlines" ADD CONSTRAINT "questlines_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questlines" ADD CONSTRAINT "questlines_skill_key_skills_key_fk" FOREIGN KEY ("skill_key") REFERENCES "public"."skills"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "focus_sessions_one_active" ON "focus_sessions" USING btree ("character_id") WHERE "focus_sessions"."status" = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "focus_sessions_character_started_idx" ON "focus_sessions" USING btree ("character_id","started_at");--> statement-breakpoint
CREATE INDEX "quest_requirements_quest_idx" ON "quest_requirements" USING btree ("quest_id");--> statement-breakpoint
CREATE INDEX "questlines_character_idx" ON "questlines" USING btree ("character_id");--> statement-breakpoint
ALTER TABLE "quests" ADD CONSTRAINT "quests_questline_id_questlines_id_fk" FOREIGN KEY ("questline_id") REFERENCES "public"."questlines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quests_questline_idx" ON "quests" USING btree ("questline_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quests_one_active_boss" ON "quests" USING btree ("character_id") WHERE "quests"."is_boss" AND "quests"."status" IN ('ACCEPTED', 'IN_PROGRESS', 'ON_HOLD');