import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import * as schema from "../../db/schema.js";
import { getAgentSpendingLog, logAgentSpending, registerAgent } from "../agent.js";
import { DEMO_AGENT_PERMISSION } from "../types.js";
import { cleanDatabase } from "./helpers.js";

const TEST_DB_URL = process.env.TEST_DATABASE_URL;
const describeDb = TEST_DB_URL ? describe : describe.skip;

describeDb("agent spending log (requires TEST_DATABASE_URL)", () => {
	const testClient = postgres(TEST_DB_URL ?? "postgres://localhost:5432/skipped");
	const db = drizzle(testClient, { schema });

	let testAgentId: string;

	beforeEach(async () => {
		await cleanDatabase(db);
		await testClient`INSERT INTO accounts (id, wallet_address, status, created_at, updated_at) VALUES ('01JACCOUNT000000000000001', '0x1234567890abcdef1234567890abcdef12345678', 'active', NOW(), NOW())`;

		const agent = await registerAgent(db, {
			accountId: "01JACCOUNT000000000000001",
			name: "Spending Log Test Bot",
			walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
			permissions: DEMO_AGENT_PERMISSION,
		});
		testAgentId = agent.id;
	});

	afterEach(async () => {
		await cleanDatabase(db);
	});

	afterAll(async () => {
		await testClient.end();
	});

	describe("logAgentSpending", () => {
		it("records a spending log entry", async () => {
			const result = await logAgentSpending(db, {
				agentId: testAgentId,
				paymentIntentId: "01JPAY0000000000000000001",
				amount: 25,
				asset: "wSPYx",
				recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
				permissionSnapshot: DEMO_AGENT_PERMISSION,
				status: "auto_approved",
			});

			expect(result.amount).toBe(25);
			expect(result.status).toBe("auto_approved");
			expect(result.agentId).toBe(testAgentId);
			expect(result.asset).toBe("wSPYx");
		});

		it("stores permissionSnapshot as provided", async () => {
			const result = await logAgentSpending(db, {
				agentId: testAgentId,
				paymentIntentId: "01JPAY0000000000000000002",
				amount: 10,
				asset: "wSPYx",
				recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
				permissionSnapshot: DEMO_AGENT_PERMISSION,
				status: "approved",
			});

			expect(result.permissionSnapshot.maxPerTransaction).toBe(
				DEMO_AGENT_PERMISSION.maxPerTransaction,
			);
		});
	});

	describe("getAgentSpendingLog", () => {
		it("returns spending log entries for an agent", async () => {
			await logAgentSpending(db, {
				agentId: testAgentId,
				paymentIntentId: "01JPAY0000000000000000003",
				amount: 25,
				asset: "wSPYx",
				recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
				permissionSnapshot: DEMO_AGENT_PERMISSION,
				status: "auto_approved",
			});

			const result = await getAgentSpendingLog(db, testAgentId, 10);
			expect(result.length).toBeGreaterThanOrEqual(1);
			expect(result[0]?.agentId).toBe(testAgentId);
		});

		it("returns empty array for unknown agent", async () => {
			const result = await getAgentSpendingLog(db, "nonexistent", 10);
			expect(result).toHaveLength(0);
		});

		it("respects the limit parameter", async () => {
			await Promise.all(
				Array.from({ length: 5 }, (_, i) =>
					logAgentSpending(db, {
						agentId: testAgentId,
						paymentIntentId: `01JPAY000000000000000000${i}`,
						amount: 10,
						asset: "wSPYx",
						recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
						permissionSnapshot: DEMO_AGENT_PERMISSION,
						status: "auto_approved",
					}),
				),
			);

			const result = await getAgentSpendingLog(db, testAgentId, 3);
			expect(result).toHaveLength(3);
		});
	});
});
