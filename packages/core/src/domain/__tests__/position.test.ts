import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import * as schema from "../../db/schema.js";
import { createAccount } from "../account.js";
import {
	getPortfolio,
	type RecordDepositParams,
	recordDeposit,
	recordWithdrawal,
} from "../position.js";
import { cleanDatabase } from "./helpers.js";

const testClient = postgres(process.env.TEST_DATABASE_URL ?? "postgres://localhost:5432/skipped");
const db = drizzle(testClient, { schema });

beforeEach(async () => {
	await cleanDatabase(db);
});

afterEach(async () => {
	await cleanDatabase(db);
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

	it("recordWithdrawal reduces position amount", async () => {
		const account = await createAccount(db, "0xcccccccccccccccccccccccccccccccccccccccc");
		const position = await recordDeposit(db, {
			accountId: account.id,
			assetSymbol: "wSPYx",
			amount: 1000n,
			depositTxHash: "0x0000000000000000000000000000000000000000000000000000000000000010",
		});
		const updated = await recordWithdrawal(db, {
			accountId: account.id,
			positionId: position.id,
			amount: 400n,
		});
		expect(updated.amount).toBe(600n);
	});

	it("recordWithdrawal rejects insufficient balance", async () => {
		const account = await createAccount(db, "0xdddddddddddddddddddddddddddddddddddddddd");
		const position = await recordDeposit(db, {
			accountId: account.id,
			assetSymbol: "wQQQx",
			amount: 100n,
			depositTxHash: "0x0000000000000000000000000000000000000000000000000000000000000011",
		});
		await expect(
			recordWithdrawal(db, { accountId: account.id, positionId: position.id, amount: 200n }),
		).rejects.toThrow("Withdrawal amount exceeds position balance");
	});

	it("recordWithdrawal rejects wrong account", async () => {
		const account1 = await createAccount(db, "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
		const account2 = await createAccount(db, "0xffffffffffffffffffffffffffffffffffffffff");
		const position = await recordDeposit(db, {
			accountId: account1.id,
			assetSymbol: "wSPYx",
			amount: 500n,
			depositTxHash: "0x0000000000000000000000000000000000000000000000000000000000000012",
		});
		await expect(
			recordWithdrawal(db, { accountId: account2.id, positionId: position.id, amount: 100n }),
		).rejects.toThrow("Position");
	});
});
