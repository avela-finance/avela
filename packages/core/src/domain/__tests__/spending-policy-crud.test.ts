import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "../../db/schema.js";
import { createDefaultPolicy, getPolicy, updatePolicy } from "../spending-policy.js";
import { cleanDatabase } from "./helpers.js";

const TEST_DB_URL = process.env.TEST_DATABASE_URL;
const describeDb = TEST_DB_URL ? describe : describe.skip;

describeDb("spending policy CRUD (requires TEST_DATABASE_URL)", () => {
	const testClient = postgres(TEST_DB_URL ?? "postgres://localhost:5432/skipped");
	const db = drizzle(testClient, { schema });

	beforeEach(async () => {
		await cleanDatabase(db);
		await testClient`INSERT INTO accounts (id, wallet_address, status, created_at, updated_at) VALUES ('01JACCOUNT0000000000000', '0x1234567890abcdef1234567890abcdef12345678', 'active', NOW(), NOW())`;
	});

	afterAll(async () => {
		await testClient.end();
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
		expect(result?.dailyLimit).toBe("500.000000");
	});

	it("updates daily limit", async () => {
		await createDefaultPolicy(db, "01JACCOUNT0000000000000");
		const result = await updatePolicy(db, "01JACCOUNT0000000000000", {
			dailyLimit: 1000,
		});
		expect(result.dailyLimit).toBe("1000.000000");
	});
});
