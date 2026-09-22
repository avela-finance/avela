import { bigint, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

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
