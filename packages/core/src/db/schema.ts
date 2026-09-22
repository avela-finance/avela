import {
	bigint,
	boolean,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const accountsTable = pgTable("accounts", {
	id: varchar("id", { length: 26 }).primaryKey(),
	walletAddress: varchar("wallet_address", { length: 42 }).notNull().unique(),
	username: varchar("username", { length: 32 }).unique(),
	status: varchar("status", { length: 20 }).notNull().default("active"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const positionsTable = pgTable("positions", {
	id: varchar("id", { length: 26 }).primaryKey(),
	accountId: varchar("account_id", { length: 26 })
		.notNull()
		.references(() => accountsTable.id),
	assetSymbol: varchar("asset_symbol", { length: 20 }).notNull(),
	amount: bigint("amount", { mode: "bigint" }).notNull(),
	depositTxHash: varchar("deposit_tx_hash", { length: 66 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stablecoinBalancesTable = pgTable("stablecoin_balances", {
	id: varchar("id", { length: 26 }).primaryKey(),
	accountId: varchar("account_id", { length: 26 })
		.notNull()
		.references(() => accountsTable.id),
	stablecoin: varchar("stablecoin", { length: 10 }).notNull(),
	amount: bigint("amount", { mode: "bigint" }).notNull().default(0n),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentStatusEnum = pgEnum("payment_status", [
	"created",
	"policy_check",
	"awaiting_approval",
	"collateral_verify",
	"settling",
	"settled",
	"failed",
	"rejected",
]);

export const paymentIntentsTable = pgTable("payment_intents", {
	id: varchar("id", { length: 26 }).primaryKey(),
	accountId: varchar("account_id", { length: 26 })
		.notNull()
		.references(() => accountsTable.id),
	amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
	recipientAddress: varchar("recipient_address", { length: 42 }).notNull(),
	recipientUsername: varchar("recipient_username", { length: 32 }),
	status: paymentStatusEnum("status").notNull().default("created"),
	fundingDecision: jsonb("funding_decision"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settlementsTable = pgTable("settlements", {
	id: varchar("id", { length: 26 }).primaryKey(),
	paymentIntentId: varchar("payment_intent_id", { length: 26 })
		.notNull()
		.references(() => paymentIntentsTable.id)
		.unique(),
	paymentId: varchar("payment_id", { length: 66 }).notNull(),
	txHash: varchar("tx_hash", { length: 66 }).notNull(),
	blockNumber: integer("block_number").notNull(),
	amountSettled: varchar("amount_settled", { length: 78 }).notNull(),
	settlementToken: varchar("settlement_token", { length: 10 }).notNull(),
	gasUsed: varchar("gas_used", { length: 78 }).notNull(),
	settledAt: timestamp("settled_at", { withTimezone: true }).notNull().defaultNow(),
});

export const spendingPoliciesTable = pgTable("spending_policies", {
	id: varchar("id", { length: 26 }).primaryKey(),
	accountId: varchar("account_id", { length: 26 })
		.notNull()
		.references(() => accountsTable.id)
		.unique(),
	dailyLimit: numeric("daily_limit", { precision: 18, scale: 6 }),
	approvalThreshold: numeric("approval_threshold", { precision: 18, scale: 6 }),
	priceFloors: jsonb("price_floors").notNull().default([]),
	minimumBalances: jsonb("minimum_balances").notNull().default([]),
	fundingPriority: jsonb("funding_priority")
		.notNull()
		.default(["spending_power", "stablecoin_balance"]),
	enabled: boolean("enabled").notNull().default(true),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dailySpendingLogTable = pgTable(
	"daily_spending_log",
	{
		id: varchar("id", { length: 26 }).primaryKey(),
		accountId: varchar("account_id", { length: 26 })
			.notNull()
			.references(() => accountsTable.id),
		amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
		paymentIntentId: varchar("payment_intent_id", { length: 26 }),
		spentAt: timestamp("spent_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("daily_spending_account_spent_idx").on(table.accountId, table.spentAt)],
);

export const agentsTable = pgTable(
	"agents",
	{
		id: varchar("id", { length: 26 }).primaryKey(),
		accountId: varchar("account_id", { length: 26 })
			.notNull()
			.references(() => accountsTable.id),
		name: varchar("name", { length: 100 }).notNull(),
		walletAddress: varchar("wallet_address", { length: 42 }).notNull(),
		permissions: jsonb("permissions").notNull(),
		status: varchar("status", { length: 20 }).notNull().default("active"),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
		expiresAt: timestamp("expires_at", { withTimezone: true }),
	},
	(table) => [index("agents_account_id_idx").on(table.accountId)],
);

export const agentSpendingLogTable = pgTable(
	"agent_spending_log",
	{
		id: varchar("id", { length: 26 }).primaryKey(),
		agentId: varchar("agent_id", { length: 26 })
			.notNull()
			.references(() => agentsTable.id),
		paymentIntentId: varchar("payment_intent_id", { length: 26 }).notNull(),
		amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
		asset: varchar("asset", { length: 20 }).notNull(),
		recipient: varchar("recipient", { length: 42 }).notNull(),
		permissionSnapshot: jsonb("permission_snapshot").notNull(),
		status: varchar("status", { length: 20 }).notNull(),
		decidedAt: timestamp("decided_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("agent_spending_log_agent_decided_idx").on(table.agentId, table.decidedAt)],
);

export const watchersTable = pgTable(
	"watchers",
	{
		id: varchar("id", { length: 26 }).primaryKey(),
		accountId: varchar("account_id", { length: 26 })
			.notNull()
			.references(() => accountsTable.id),
		type: varchar("type", { length: 50 }).notNull().default("spending_power_threshold"),
		config: jsonb("config").notNull().$type<import("../domain/types.js").SpendingPowerThresholdConfig>(),
		status: varchar("status", { length: 20 }).notNull().default("active"),
		lastEvaluatedAt: timestamp("last_evaluated_at", { withTimezone: true }),
		lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
		cooldownMinutes: integer("cooldown_minutes").notNull().default(60),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("watchers_account_id_idx").on(table.accountId)],
);

export const whatsappLinksTable = pgTable(
	"whatsapp_links",
	{
		id: varchar("id", { length: 26 }).primaryKey(),
		accountId: varchar("account_id", { length: 26 })
			.notNull()
			.references(() => accountsTable.id),
		phoneNumber: varchar("phone_number", { length: 50 }).notNull().unique(),
		waId: varchar("wa_id", { length: 100 }).notNull(),
		linkedAt: timestamp("linked_at", { withTimezone: true }).notNull().defaultNow(),
		active: boolean("active").notNull().default(true),
	},
	(table) => [index("whatsapp_links_account_id_idx").on(table.accountId)],
);

export const whatsappNotificationsTable = pgTable(
	"whatsapp_notifications",
	{
		id: varchar("id", { length: 26 }).primaryKey(),
		accountId: varchar("account_id", { length: 26 })
			.notNull()
			.references(() => accountsTable.id),
		phoneNumber: varchar("phone_number", { length: 50 }).notNull(),
		type: varchar("type", { length: 50 }).notNull(),
		paymentIntentId: varchar("payment_intent_id", { length: 26 }),
		templateName: varchar("template_name", { length: 100 }).notNull(),
		message: varchar("message", { length: 1000 }).notNull(),
		interactiveActions: jsonb("interactive_actions"),
		sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
		respondedAt: timestamp("responded_at", { withTimezone: true }),
		response: varchar("response", { length: 1000 }),
	},
	(table) => [index("whatsapp_notifications_account_id_idx").on(table.accountId)],
);
