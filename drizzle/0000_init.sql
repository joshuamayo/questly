CREATE TABLE "activity_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"type" text NOT NULL,
	"entity_id" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capes" (
	"key" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"skill_key" text,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_skills" (
	"character_id" uuid NOT NULL,
	"skill_key" text NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "character_skills_character_id_skill_key_pk" PRIMARY KEY("character_id","skill_key"),
	CONSTRAINT "character_skills_xp_non_negative" CHECK ("character_skills"."xp" >= 0)
);
--> statement-breakpoint
CREATE TABLE "character_titles" (
	"character_id" uuid NOT NULL,
	"title_key" text NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_titles_character_id_title_key_pk" PRIMARY KEY("character_id","title_key")
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_subject" text,
	"display_name" text NOT NULL,
	"avatar_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"equipped_title_key" text,
	"equipped_cape_key" text,
	"gp_balance" integer DEFAULT 0 NOT NULL,
	"lifetime_gp_earned" integer DEFAULT 0 NOT NULL,
	"lifetime_gp_spent" integer DEFAULT 0 NOT NULL,
	"quest_points" integer DEFAULT 0 NOT NULL,
	"combat_points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "characters_auth_subject_unique" UNIQUE("auth_subject"),
	CONSTRAINT "characters_gp_non_negative" CHECK ("characters"."gp_balance" >= 0),
	CONSTRAINT "characters_lifetime_gp_non_negative" CHECK ("characters"."lifetime_gp_earned" >= 0 AND "characters"."lifetime_gp_spent" >= 0),
	CONSTRAINT "characters_gp_reconciles" CHECK ("characters"."gp_balance" = "characters"."lifetime_gp_earned" - "characters"."lifetime_gp_spent"),
	CONSTRAINT "characters_qp_non_negative" CHECK ("characters"."quest_points" >= 0),
	CONSTRAINT "characters_cp_non_negative" CHECK ("characters"."combat_points" >= 0)
);
--> statement-breakpoint
CREATE TABLE "progression_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seq" bigserial NOT NULL,
	"character_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"amount" integer NOT NULL,
	"skill_key" text,
	"source_type" text NOT NULL,
	"source_id" text,
	"idempotency_key" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "progression_transactions_seq_unique" UNIQUE("seq"),
	CONSTRAINT "progression_kind_valid" CHECK ("progression_transactions"."kind" IN ('XP', 'GP', 'QP', 'COMBAT_POINTS')),
	CONSTRAINT "progression_amount_nonzero" CHECK ("progression_transactions"."amount" <> 0),
	CONSTRAINT "progression_only_gp_negative" CHECK ("progression_transactions"."kind" = 'GP' OR "progression_transactions"."amount" > 0),
	CONSTRAINT "progression_skill_for_xp_only" CHECK (("progression_transactions"."kind" = 'XP') = ("progression_transactions"."skill_key" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"key" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"motto" text NOT NULL,
	"icon" text NOT NULL,
	"art_direction" text NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "titles" (
	"key" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"is_starter" boolean DEFAULT false NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capes" ADD CONSTRAINT "capes_skill_key_skills_key_fk" FOREIGN KEY ("skill_key") REFERENCES "public"."skills"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_skills" ADD CONSTRAINT "character_skills_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_skills" ADD CONSTRAINT "character_skills_skill_key_skills_key_fk" FOREIGN KEY ("skill_key") REFERENCES "public"."skills"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_titles" ADD CONSTRAINT "character_titles_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_titles" ADD CONSTRAINT "character_titles_title_key_titles_key_fk" FOREIGN KEY ("title_key") REFERENCES "public"."titles"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_equipped_title_key_titles_key_fk" FOREIGN KEY ("equipped_title_key") REFERENCES "public"."titles"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_equipped_cape_key_capes_key_fk" FOREIGN KEY ("equipped_cape_key") REFERENCES "public"."capes"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progression_transactions" ADD CONSTRAINT "progression_transactions_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progression_transactions" ADD CONSTRAINT "progression_transactions_skill_key_skills_key_fk" FOREIGN KEY ("skill_key") REFERENCES "public"."skills"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_character_created_idx" ON "activity_events" USING btree ("character_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "progression_idempotency_unique" ON "progression_transactions" USING btree ("character_id","idempotency_key") WHERE "progression_transactions"."idempotency_key" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "progression_character_created_idx" ON "progression_transactions" USING btree ("character_id","created_at");--> statement-breakpoint
CREATE INDEX "progression_source_idx" ON "progression_transactions" USING btree ("source_type","source_id");