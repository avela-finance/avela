import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createDefaultPolicy, getPolicy, updatePolicy } from "../spending-policy.js";

const TEST_DB_URL = process.env.TEST_DATABASE_URL;
const describeDb = TEST_DB_URL ? describe : describe.skip;

describeDb("spending policy CRUD (requires TEST_DATABASE_URL)", () => {
	let db: Awaited<ReturnType<typeof import("../../db/client.js").createDb>>;
	let sql: ReturnType<typeof import("postgres").default>;

	beforeEach(async () => {
		const postgres = (await import("postgres")).default;
		const { createDb } = await import("../../db/client.js");
		sql = postgres(TEST_DB_URL!);
		db = createDb(TEST_DB_URL!);

		await sql`DELETE FROM spending_policies`;
		await sql`DELETE FROM accounts`;
		await sql`INSERT INTO accounts (id, wallet_address, status, created_at, updated_at) VALUES ('01JACCOUNT0000000000000', '0x1234567890abcdef1234567890abcdef12345678', 'active', NOW(), NOW())`;
	});

	afterAll(async () => {
		if (sql) await sql.end();
	});

	it("creates a default policy", async () => {
		const result = await createDefaultPolicy(db, "01JACCOUNT0000000000000");
		expect(result.dailyLimit).toBe("500.000000");
		expect(result.approvalThreshold).toBe("100.000000");
		expect(result.enabled).toBe(true);
	});

	it("returns null when no policy exists", async () => {
		const result = await getPolicy(db, "01JACCOUNT0000000000000");
		expect(result).toBeNull();
	});

	it("returns the policy after creation", async () => {
		await createDefaultPolicy(db, "01JACCOUNT0000000000000");
		const result = await getPolicy(db, "01JACCOUNT0000000000000");
		expect(result).not.toBeNull();
		expect(result!.dailyLimit).toBe("500.000000");
	});

	it("updates daily limit", async () => {
		await createDefaultPolicy(db, "01JACCOUNT0000000000000");
		const result = await updatePolicy(db, "01JACCOUNT0000000000000", {
			dailyLimit: 1000,
		});
		expect(result.dailyLimit).toBe("1000.000000");
	});
});
