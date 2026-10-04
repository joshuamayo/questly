CREATE TABLE "gp_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seq" bigserial NOT NULL,
	"character_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"transaction_type" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text,
	"description" text DEFAULT '' NOT NULL,
	"idempotency_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gp_transactions_seq_unique" UNIQUE("seq"),
	CONSTRAINT "gp_tx_amount_nonzero" CHECK ("gp_transactions"."amount" <> 0),
	CONSTRAINT "gp_tx_type_valid" CHECK ("gp_transactions"."transaction_type" IN ('EARN', 'SPEND', 'ADJUST')),
	CONSTRAINT "gp_tx_sign_matches_type" CHECK (("gp_transactions"."transaction_type" <> 'EARN' OR "gp_transactions"."amount" > 0) AND ("gp_transactions"."transaction_type" <> 'SPEND' OR "gp_transactions"."amount" < 0)),
	CONSTRAINT "gp_tx_source_valid" CHECK ("gp_transactions"."source_type" IN ('QUEST', 'REWARD', 'SYSTEM'))
);
--> statement-breakpoint
ALTER TABLE "quests" DROP CONSTRAINT "quests_status_valid";--> statement-breakpoint
ALTER TABLE "quests" DROP CONSTRAINT "quests_completed_has_timestamp";--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "gp_reward" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "quests" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "rewards" ADD COLUMN "featured_goal" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "gp_transactions" ADD CONSTRAINT "gp_transactions_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gp_tx_idempotency_unique" ON "gp_transactions" USING btree ("character_id","idempotency_key") WHERE "gp_transactions"."idempotency_key" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "gp_tx_character_created_idx" ON "gp_transactions" USING btree ("character_id","created_at");--> statement-breakpoint
ALTER TABLE "gp_transactions" ENABLE ROW LEVEL SECURITY;