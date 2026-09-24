import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "../../db/schema.js";
import {
	getAgent,
	getAgentsByAccount,
	registerAgent,
	revokeAgent,
	updateAgentPermissions,
} from "../agent.js";
import { DEMO_AGENT_PERMISSION } from "../types.js";
import { cleanDatabase } from "./helpers.js";

const TEST_DB_URL = process.env.TEST_DATABASE_URL;
const describeDb = TEST_DB_URL ? describe : describe.skip;

describeDb("agent CRUD (requires TEST_DATABASE_URL)", () => {
	const testClient = postgres(TEST_DB_URL ?? "postgres://localhost:5432/skipped");
	const db = drizzle(testClient, { schema });

	beforeEach(async () => {
		await cleanDatabase(db);
		await testClient`INSERT INTO accounts (id, wallet_address, status, created_at, updated_at) VALUES ('01JACCOUNT0000000000000', '0x1234567890abcdef1234567890abcdef12345678', 'active', NOW(), NOW())`;
	});

	afterAll(async () => {
		await testClient.end();
	});

	describe("registerAgent", () => {
		it("creates an agent with valid params", async () => {
			const result = await registerAgent(db, {
				accountId: "01JACCOUNT0000000000000",
				name: "Trading Bot",
				walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
				permissions: DEMO_AGENT_PERMISSION,
			});

			expect(result.name).toBe("Trading Bot");
			expect(result.status).toBe("active");
			expect(result.permissions.maxPerTransaction).toBe(50);
		});

		it("rejects empty name", async () => {
			await expect(
				registerAgent(db, {
					accountId: "01JACCOUNT0000000000000",
					name: "",
					walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
					permissions: DEMO_AGENT_PERMISSION,
				}),
			).rejects.toThrow();
		});

		it("rejects invalid wallet address", async () => {
			await expect(
				registerAgent(db, {
					accountId: "01JACCOUNT0000000000000",
					name: "Bot",
					walletAddress: "not-an-address",
					permissions: DEMO_AGENT_PERMISSION,
				}),
			).rejects.toThrow();
		});
	});

	describe("getAgent", () => {
		it("returns agent by ID", async () => {
			const created = await registerAgent(db, {
				accountId: "01JACCOUNT0000000000000",
				name: "Trading Bot",
				walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
				permissions: DEMO_AGENT_PERMISSION,
			});

			const result = await getAgent(db, created.id);
			expect(result).not.toBeNull();
			expect(result?.id).toBe(created.id);
		});

		it("returns null for unknown ID", async () => {
			const result = await getAgent(db, "nonexistent");
			expect(result).toBeNull();
		});
	});

	describe("getAgentsByAccount", () => {
		it("returns all agents for an account", async () => {
			await registerAgent(db, {
				accountId: "01JACCOUNT0000000000000",
				name: "Bot One",
				walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
				permissions: DEMO_AGENT_PERMISSION,
			});
			await registerAgent(db, {
				accountId: "01JACCOUNT0000000000000",
				name: "Bot Two",
				walletAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
				permissions: DEMO_AGENT_PERMISSION,
			});

			const results = await getAgentsByAccount(db, "01JACCOUNT0000000000000");
			expect(results).toHaveLength(2);
		});

		it("returns empty array for unknown account", async () => {
			const results = await getAgentsByAccount(db, "nonexistent");
			expect(results).toHaveLength(0);
		});
	});

	describe("updateAgentPermissions", () => {
		it("merges updated permissions", async () => {
			const created = await registerAgent(db, {
				accountId: "01JACCOUNT0000000000000",
				name: "Trading Bot",
				walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
				permissions: DEMO_AGENT_PERMISSION,
			});

			const updated = await updateAgentPermissions(db, created.id, {
				maxPerTransaction: 100,
			});

			expect(updated.permissions.maxPerTransaction).toBe(100);
			expect(updated.permissions.maxPerDay).toBe(DEMO_AGENT_PERMISSION.maxPerDay);
		});

		it("throws for unknown agent", async () => {
			await expect(
				updateAgentPermissions(db, "nonexistent", { maxPerTransaction: 10 }),
			).rejects.toThrow("Agent nonexistent not found");
		});
	});

	describe("revokeAgent", () => {
		it("sets status to revoked", async () => {
			const created = await registerAgent(db, {
				accountId: "01JACCOUNT0000000000000",
				name: "Revoke Test Bot",
				walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
				permissions: DEMO_AGENT_PERMISSION,
			});

			const result = await revokeAgent(db, created.id);
			expect(result.status).toBe("revoked");
		});

		it("throws for unknown agent", async () => {
			await expect(revokeAgent(db, "nonexistent")).rejects.toThrow("Agent nonexistent not found");
		});
	});
});
