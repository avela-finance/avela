import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "../../db/schema.js";
import {
	createDefaultPolicy,
	getDailySpending,
	getPolicy,
	recordSpending,
} from "../spending-policy.js";

const TEST_DB_URL = process.env.TEST_DATABASE_URL;
const describeDb = TEST_DB_URL ? describe : describe.skip;

describeDb("daily spending tracking (requires TEST_DATABASE_URL)", () => {
	const testClient = postgres(TEST_DB_URL!);
	const db = drizzle(testClient, { schema });

	beforeEach(async () => {
		await testClient`DELETE FROM daily_spending_log`;
		await testClient`DELETE FROM spending_policies`;
		await testClient`DELETE FROM accounts`;
		await testClient`INSERT INTO accounts (id, wallet_address, status, created_at, updated_at) VALUES ('01JACCOUNT0000000000000', '0x1234567890abcdef1234567890abcdef12345678', 'active', NOW(), NOW())`;
		await createDefaultPolicy(db, "01JACCOUNT0000000000000");
	});

	afterAll(async () => {
		await testClient.end();
	});

	it("inserts a spending log entry", async () => {
		await recordSpending(db, "01JACCOUNT0000000000000", 25);

		const rows = await testClient`SELECT * FROM daily_spending_log`;
		expect(rows).toHaveLength(1);
		expect(Number(rows[0]?.amount)).toBe(25);
	});

	it("returns zero when no spending today", async () => {
		const policy = await getPolicy(db, "01JACCOUNT0000000000000");
		const result = await getDailySpending(db, "01JACCOUNT0000000000000", policy!);

		expect(result.total).toBe(0);
		expect(result.limit).toBe(500);
		expect(result.remaining).toBe(500);
	});

	it("returns correct totals after spending", async () => {
		await recordSpending(db, "01JACCOUNT0000000000000", 100);
		await recordSpending(db, "01JACCOUNT0000000000000", 50);

		const policy = await getPolicy(db, "01JACCOUNT0000000000000");
		const result = await getDailySpending(db, "01JACCOUNT0000000000000", policy!);

		expect(result.total).toBe(150);
		expect(result.limit).toBe(500);
		expect(result.remaining).toBe(350);
	});
});
