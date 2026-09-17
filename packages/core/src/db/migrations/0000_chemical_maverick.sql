CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"external_user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"wallet_address" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_external_user_id_unique" UNIQUE("external_user_id"),
	CONSTRAINT "accounts_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "agent_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"allowed_assets" jsonb NOT NULL,
	"max_transaction" text NOT NULL,
	"daily_limit" text NOT NULL,
	"approved_recipients" jsonb NOT NULL,
	"require_approval" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_intent_id" text NOT NULL,
	"approver_account_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"decided_at" timestamp,
	"snapshot_amount" text NOT NULL,
	"snapshot_recipient" text NOT NULL,
	"snapshot_funding_plan" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "funding_policies" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"reserve_minimum" text DEFAULT '0' NOT NULL,
	"approval_threshold" text DEFAULT '0' NOT NULL,
	"daily_cap" text DEFAULT '0' NOT NULL,
	"price_floor" text DEFAULT '0' NOT NULL,
	"execution_limit" text DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "funding_policies_account_id_unique" UNIQUE("account_id")
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_intent_id" text NOT NULL,
	"from_state" text NOT NULL,
	"to_state" text NOT NULL,
	"reason" text NOT NULL,
	"actor" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_intents" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"recipient_address" text NOT NULL,
	"amount" text NOT NULL,
	"currency" text NOT NULL,
	"memo" text,
	"idempotency_key" text NOT NULL,
	"state" text DEFAULT 'draft' NOT NULL,
	"funding_plan" jsonb,
	"approval_id" text,
	"settlement_tx_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "payment_intents_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "portfolio_positions" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"asset" text NOT NULL,
	"asset_type" text NOT NULL,
	"chain_id" integer NOT NULL,
	"token_address" text,
	"decimals" integer DEFAULT 18 NOT NULL,
	"balance" text DEFAULT '0' NOT NULL,
	"locked_balance" text DEFAULT '0' NOT NULL,
	"last_price_usd" text,
	"last_price_at" timestamp,
	"price_source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_intent_id" text NOT NULL,
	"payer" text NOT NULL,
	"recipient" text NOT NULL,
	"amount" text NOT NULL,
	"currency" text NOT NULL,
	"funding_source" text NOT NULL,
	"policy_decision" jsonb NOT NULL,
	"approval_record" jsonb,
	"execution_refs" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"funded_at" timestamp,
	"settled_at" timestamp,
	"completed_at" timestamp,
	CONSTRAINT "receipts_payment_intent_id_unique" UNIQUE("payment_intent_id")
);
--> statement-breakpoint
ALTER TABLE "agent_permissions" ADD CONSTRAINT "agent_permissions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_payment_intent_id_payment_intents_id_fk" FOREIGN KEY ("payment_intent_id") REFERENCES "public"."payment_intents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approver_account_id_accounts_id_fk" FOREIGN KEY ("approver_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "funding_policies" ADD CONSTRAINT "funding_policies_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_intent_id_payment_intents_id_fk" FOREIGN KEY ("payment_intent_id") REFERENCES "public"."payment_intents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_positions" ADD CONSTRAINT "portfolio_positions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_payment_intent_id_payment_intents_id_fk" FOREIGN KEY ("payment_intent_id") REFERENCES "public"."payment_intents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_external_user_id_idx" ON "accounts" USING btree ("external_user_id");--> statement-breakpoint
CREATE INDEX "accounts_wallet_address_idx" ON "accounts" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "payment_events_payment_intent_id_idx" ON "payment_events" USING btree ("payment_intent_id");--> statement-breakpoint
CREATE INDEX "payment_intents_account_id_idx" ON "payment_intents" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "payment_intents_state_idx" ON "payment_intents" USING btree ("state");--> statement-breakpoint
CREATE INDEX "payment_intents_idempotency_key_idx" ON "payment_intents" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "portfolio_positions_account_id_idx" ON "portfolio_positions" USING btree ("account_id");