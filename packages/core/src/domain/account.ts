import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import type { Database } from "../db/client.js";
import { accountsTable } from "../db/schema.js";
import type { Account } from "./types.js";

export async function createAccount(db: Database, walletAddress: string): Promise<Account> {
	const now = new Date();
	const row = {
		id: ulid(),
		walletAddress,
		username: null,
		status: "active" as const,
		createdAt: now,
		updatedAt: now,
	};

	const [inserted] = await db.insert(accountsTable).values(row).returning();
	return inserted as Account;
}

export async function getAccount(db: Database, id: string): Promise<Account | null> {
	const rows = await db.select().from(accountsTable).where(eq(accountsTable.id, id));
	return (rows[0] as Account) ?? null;
}

export async function getAccountByWallet(
	db: Database,
	walletAddress: string,
): Promise<Account | null> {
	const rows = await db
		.select()
		.from(accountsTable)
		.where(eq(accountsTable.walletAddress, walletAddress));
	return (rows[0] as Account) ?? null;
}
