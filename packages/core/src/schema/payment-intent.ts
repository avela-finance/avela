import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { accounts } from "./account.js";

export const paymentIntents = pgTable(
	"payment_intents",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id")
			.notNull()
			.references(() => accounts.id, { onDelete: "cascade" }),
		recipientAddress: text("recipient_address").notNull(),
		amount: text("amount").notNull(),
		currency: text("currency").notNull(),
		memo: text("memo"),
		idempotencyKey: text("idempotency_key").notNull().unique(),
		state: text("state").notNull().default("draft"),
		fundingPlan: jsonb("funding_plan"),
		approvalId: text("approval_id"),
		settlementTxHash: text("settlement_tx_hash"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		completedAt: timestamp("completed_at"),
	},
	(table) => [
		index("payment_intents_account_id_idx").on(table.accountId),
		index("payment_intents_state_idx").on(table.state),
		index("payment_intents_idempotency_key_idx").on(table.idempotencyKey),
	],
);
