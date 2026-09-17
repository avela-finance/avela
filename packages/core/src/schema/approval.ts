import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { paymentIntents } from "./payment-intent.js";
import { accounts } from "./account.js";

export const approvals = pgTable(
	"approvals",
	{
		id: text("id").primaryKey(),
		paymentIntentId: text("payment_intent_id")
			.notNull()
			.references(() => paymentIntents.id, { onDelete: "cascade" }),
		approverAccountId: text("approver_account_id")
			.notNull()
			.references(() => accounts.id),
		status: text("status").notNull().default("pending"),
		expiresAt: timestamp("expires_at").notNull(),
		decidedAt: timestamp("decided_at"),
		snapshotAmount: text("snapshot_amount").notNull(),
		snapshotRecipient: text("snapshot_recipient").notNull(),
		snapshotFundingPlan: jsonb("snapshot_funding_plan").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("approvals_payment_intent_id_idx").on(table.paymentIntentId),
		index("approvals_status_idx").on(table.status),
	],
);
