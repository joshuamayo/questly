CREATE TABLE "character_collection_items" (
	"character_id" uuid NOT NULL,
	"item_key" text NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	CONSTRAINT "character_collection_items_character_id_item_key_pk" PRIMARY KEY("character_id","item_key")
);
--> statement-breakpoint
CREATE TABLE "character_combat_achievements" (
	"character_id" uuid NOT NULL,
	"achievement_key" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "character_combat_achievements_character_id_achievement_key_pk" PRIMARY KEY("character_id","achievement_key")
);
--> statement-breakpoint
CREATE TABLE "collection_items" (
	"key" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"rarity" text NOT NULL,
	"secret" boolean DEFAULT false NOT NULL,
	"icon" text NOT NULL,
	"rule" jsonb,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "combat_achievements" (
	"key" text PRIMARY KEY NOT NULL,
	"tier" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"rule" jsonb NOT NULL,
	"combat_points" integer NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diary_claims" (
	"character_id" uuid NOT NULL,
	"period" text NOT NULL,
	"period_start" date NOT NULL,
	"tier" text NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diary_claims_character_id_period_period_start_tier_pk" PRIMARY KEY("character_id","period","period_start","tier")
);
--> statement-breakpoint
CREATE TABLE "diary_custom_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"period" text NOT NULL,
	"period_start" date NOT NULL,
	"tier" text NOT NULL,
	"title" text NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diary_entry_templates" (
	"key" text PRIMARY KEY NOT NULL,
	"period" text NOT NULL,
	"tier" text NOT NULL,
	"title" text NOT NULL,
	"rule" jsonb NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "completed_local_date" date;--> statement-breakpoint
ALTER TABLE "titles" ADD COLUMN "rule" jsonb;--> statement-breakpoint
ALTER TABLE "character_collection_items" ADD CONSTRAINT "character_collection_items_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_collection_items" ADD CONSTRAINT "character_collection_items_item_key_collection_items_key_fk" FOREIGN KEY ("item_key") REFERENCES "public"."collection_items"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_combat_achievements" ADD CONSTRAINT "character_combat_achievements_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_combat_achievements" ADD CONSTRAINT "character_combat_achievements_achievement_key_combat_achievements_key_fk" FOREIGN KEY ("achievement_key") REFERENCES "public"."combat_achievements"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_claims" ADD CONSTRAINT "diary_claims_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_custom_entries" ADD CONSTRAINT "diary_custom_entries_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "diary_custom_character_period_idx" ON "diary_custom_entries" USING btree ("character_id","period","period_start");