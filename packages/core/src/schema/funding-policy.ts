import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { accounts } from "./account.js";

export const fundingPolicies = pgTable("funding_policies", {
	id: text("id").primaryKey(),
	accountId: text("account_id")
		.notNull()
		.unique()
		.references(() => accounts.id, { onDelete: "cascade" }),
	reserveMinimum: text("reserve_minimum").notNull().default("0"),
	approvalThreshold: text("approval_threshold").notNull().default("0"),
	dailyCap: text("daily_cap").notNull().default("0"),
	priceFloor: text("price_floor").notNull().default("0"),
	executionLimit: text("execution_limit").notNull().default("0"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});
