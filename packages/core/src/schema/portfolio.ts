import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { accounts } from "./account.js";

export const portfolioPositions = pgTable(
	"portfolio_positions",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id")
			.notNull()
			.references(() => accounts.id, { onDelete: "cascade" }),
		asset: text("asset").notNull(),
		assetType: text("asset_type").notNull(),
		chainId: integer("chain_id").notNull(),
		tokenAddress: text("token_address"),
		decimals: integer("decimals").notNull().default(18),
		balance: text("balance").notNull().default("0"),
		lockedBalance: text("locked_balance").notNull().default("0"),
		lastPriceUsd: text("last_price_usd"),
		lastPriceAt: timestamp("last_price_at"),
		priceSource: text("price_source"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("portfolio_positions_account_id_idx").on(table.accountId)],
);
