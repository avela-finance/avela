import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
	createDefaultPolicy,
	getDailySpending,
	getPolicy,
	recordSpending,
} from "../spending-policy.js";

const TEST_DB_URL = process.env.TEST_DATABASE_URL;
const describeDb = TEST_DB_URL ? describe : describe.skip;

describeDb("daily spending tracking (requires TEST_DATABASE_URL)", () => {
	let db: Awaited<ReturnType<typeof import("../../db/client.js").createDb>>;
	let sql: ReturnType<typeof import("postgres").default>;

	beforeEach(async () => {
		const postgres = (await import("postgres")).default;
		const { createDb } = await import("../../db/client.js");
		sql = postgres(TEST_DB_URL!);
		db = createDb(TEST_DB_URL!);

		await sql`DELETE FROM daily_spending_log`;
		await sql`DELETE FROM spending_policies`;
		await sql`DELETE FROM accounts`;
		await sql`INSERT INTO accounts (id, wallet_address, status, created_at, updated_at) VALUES ('01JACCOUNT0000000000000', '0x1234567890abcdef1234567890abcdef12345678', 'active', NOW(), NOW())`;
		await createDefaultPolicy(db, "01JACCOUNT0000000000000");
	});

	afterAll(async () => {
		if (sql) await sql.end();
	});

	it("inserts a spending log entry", async () => {
		await recordSpending(db, "01JACCOUNT0000000000000", 25);

		const rows = await sql`SELECT * FROM daily_spending_log`;
		expect(rows).toHaveLength(1);
		expect(Number(rows[0].amount)).toBe(25);
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
