import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import * as schema from "../../db/schema.js";
import { createAccount } from "../account.js";
import { getPortfolio, type RecordDepositParams, recordDeposit } from "../position.js";

const testClient = postgres(process.env.TEST_DATABASE_URL!);
const db = drizzle(testClient, { schema });

afterEach(async () => {
	await db.execute(sql`DELETE FROM positions`);
	await db.execute(sql`DELETE FROM stablecoin_balances`);
	await db.execute(sql`DELETE FROM accounts`);
});

afterAll(async () => {
	await testClient.end();
});

describe("position operations", () => {
	it("recordDeposit creates a position with ULID", async () => {
		const account = await createAccount(db, "0x1234567890abcdef1234567890abcdef12345678");
		const params: RecordDepositParams = {
			accountId: account.id,
			assetSymbol: "wSPYx",
			amount: 1000000000000000000n,
			depositTxHash: "0xabc123def456789000000000000000000000000000000000000000000000abcd",
		};
		const position = await recordDeposit(db, params);
		expect(position.accountId).toBe(account.id);
		expect(position.assetSymbol).toBe("wSPYx");
		expect(position.amount).toBe(1000000000000000000n);
		expect(position.id).toMatch(/^[0-9A-Z]{26}$/i);
	});

	it("recordDeposit rejects ineligible asset", async () => {
		const account = await createAccount(db, "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
		const params: RecordDepositParams = {
			accountId: account.id,
			assetSymbol: "wFAKE",
			amount: 100n,
			depositTxHash: "0xabc",
		};
		await expect(recordDeposit(db, params)).rejects.toThrow("Asset wFAKE is not eligible");
	});

	it("getPortfolio returns positions for account", async () => {
		const account = await createAccount(db, "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
		await recordDeposit(db, {
			accountId: account.id,
			assetSymbol: "wSPYx",
			amount: 100n,
			depositTxHash: "0x0000000000000000000000000000000000000000000000000000000000000001",
		});
		const positions = await getPortfolio(db, account.id);
		expect(positions).toHaveLength(1);
		expect(positions[0]?.assetSymbol).toBe("wSPYx");
	});
});
