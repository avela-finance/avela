import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { paymentIntents } from "./payment-intent.js";

export const receipts = pgTable("receipts", {
	id: text("id").primaryKey(),
	paymentIntentId: text("payment_intent_id")
		.notNull()
		.unique()
		.references(() => paymentIntents.id, { onDelete: "cascade" }),
	payer: text("payer").notNull(),
	recipient: text("recipient").notNull(),
	amount: text("amount").notNull(),
	currency: text("currency").notNull(),
	fundingSource: text("funding_source").notNull(),
	policyDecision: jsonb("policy_decision").notNull(),
	approvalRecord: jsonb("approval_record"),
	executionRefs: jsonb("execution_refs"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	fundedAt: timestamp("funded_at"),
	settledAt: timestamp("settled_at"),
	completedAt: timestamp("completed_at"),
});
