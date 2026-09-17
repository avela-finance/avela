import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { paymentIntents } from "./payment-intent.js";

export const paymentEvents = pgTable(
	"payment_events",
	{
		id: text("id").primaryKey(),
		paymentIntentId: text("payment_intent_id")
			.notNull()
			.references(() => paymentIntents.id, { onDelete: "cascade" }),
		fromState: text("from_state").notNull(),
		toState: text("to_state").notNull(),
		reason: text("reason").notNull(),
		actor: text("actor").notNull(),
		timestamp: timestamp("timestamp").defaultNow().notNull(),
	},
	(table) => [
		index("payment_events_payment_intent_id_idx").on(table.paymentIntentId),
	],
);
