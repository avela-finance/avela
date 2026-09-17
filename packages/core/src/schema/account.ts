import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

export const accounts = pgTable(
	"accounts",
	{
		id: text("id").primaryKey(),
		externalUserId: text("external_user_id").notNull().unique(),
		name: text("name").notNull(),
		type: text("type").notNull(),
		walletAddress: text("wallet_address").notNull().unique(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("accounts_external_user_id_idx").on(table.externalUserId),
		index("accounts_wallet_address_idx").on(table.walletAddress),
	],
);
