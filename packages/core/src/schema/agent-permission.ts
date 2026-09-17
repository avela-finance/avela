import { pgTable, text, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { accounts } from "./account.js";

export const agentPermissions = pgTable(
	"agent_permissions",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id")
			.notNull()
			.references(() => accounts.id, { onDelete: "cascade" }),
		agentId: text("agent_id").notNull(),
		allowedAssets: jsonb("allowed_assets").notNull(),
		maxTransaction: text("max_transaction").notNull(),
		dailyLimit: text("daily_limit").notNull(),
		approvedRecipients: jsonb("approved_recipients").notNull(),
		requireApproval: boolean("require_approval").notNull().default(false),
		expiresAt: timestamp("expires_at"),
		revokedAt: timestamp("revoked_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("agent_permissions_account_id_idx").on(table.accountId)],
);
