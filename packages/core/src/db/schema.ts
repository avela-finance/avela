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
