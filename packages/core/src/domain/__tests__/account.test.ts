import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import * as schema from "../../db/schema.js";
import { createAccount, getAccount, getAccountByWallet } from "../account.js";
import { cleanDatabase } from "./helpers.js";

const testClient = postgres(process.env.TEST_DATABASE_URL ?? "postgres://localhost:5432/skipped");
const db = drizzle(testClient, { schema });

afterEach(async () => {
	await cleanDatabase(db);
});

afterAll(async () => {
	await testClient.end();
});

describe("account operations", () => {
	it("createAccount returns an Account with ULID id", async () => {
		const account = await createAccount(db, "0x1234567890abcdef1234567890abcdef12345678");
		expect(account.walletAddress).toBe("0x1234567890abcdef1234567890abcdef12345678");
		expect(account.status).toBe("active");
		expect(account.id).toMatch(/^[0-9A-Z]{26}$/i);
	});

	it("getAccount queries by id", async () => {
		const created = await createAccount(db, "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
		const account = await getAccount(db, created.id);
		expect(account).toBeDefined();
		expect(account?.id).toBe(created.id);
		expect(account?.walletAddress).toBe("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
	});

	it("getAccount returns null for missing id", async () => {
		const account = await getAccount(db, "01JMISSING0000000000000000");
		expect(account).toBeNull();
	});

	it("getAccountByWallet returns account by wallet address", async () => {
		await createAccount(db, "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
		const account = await getAccountByWallet(db, "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
		expect(account).toBeDefined();
		expect(account?.walletAddress).toBe("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
	});
});
