import { sql } from "drizzle-orm";
import type { Database } from "../../db/client.js";

// Child tables first — parents (accounts, payment_intents) last.
// Every DB integration test file must call cleanDatabase in BOTH beforeEach
// AND afterEach: files share one database and run with fixed IDs, so any
// residue causes unique/FK violations in other files. beforeEach-only leaves
// the last test's rows behind; afterEach-only inherits the previous file's.
const TABLES_IN_DELETE_ORDER = [
	"agent_spending_log",
	"agents",
	"positions",
	"stablecoin_balances",
	"settlements",
	"payment_intents",
	"daily_spending_log",
	"spending_policies",
	"watchers",
	"whatsapp_notifications",
	"whatsapp_links",
	"identities",
	"accounts",
];

export async function cleanDatabase(db: Database): Promise<void> {
	for (const table of TABLES_IN_DELETE_ORDER) {
		await db.execute(sql.raw(`DELETE FROM ${table}`));
	}
}
