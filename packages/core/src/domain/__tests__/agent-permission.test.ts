import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "../../db/schema.js";
import { registerAgent, revokeAgent } from "../agent.js";
import { evaluateAgentPermission } from "../agent-permission.js";
import { DEMO_AGENT_PERMISSION } from "../types.js";
import { cleanDatabase } from "./helpers.js";

const TEST_DB_URL = process.env.TEST_DATABASE_URL;
const describeDb = TEST_DB_URL ? describe : describe.skip;

describeDb("evaluateAgentPermission", () => {
	const testClient = postgres(TEST_DB_URL ?? "postgres://localhost:5432/skipped");
	const db = drizzle(testClient, { schema });

	let activeAgentId: string;
	let revokedAgentId: string;
	let expiredAgentId: string;
	let restrictedRecipientAgentId: string;

	beforeAll(async () => {
		// Fixture account must exist: agents.account_id has a real FK.
		// Wallet is unique to this file so no other file can collide with it.
		await cleanDatabase(db);
		await testClient`INSERT INTO accounts (id, wallet_address, status, created_at, updated_at) VALUES ('01JACCOUNT000000000000001', '0x7777777777777777777777777777777777777777', 'active', NOW(), NOW()) ON CONFLICT (id) DO NOTHING`;
		const activeAgent = await registerAgent(db, {
			accountId: "01JACCOUNT000000000000001",
			name: "Active Bot",
			walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
			permissions: DEMO_AGENT_PERMISSION,
		});
		activeAgentId = activeAgent.id;

		const revokedAgent = await registerAgent(db, {
			accountId: "01JACCOUNT000000000000001",
			name: "Revoked Bot",
			walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
			permissions: DEMO_AGENT_PERMISSION,
		});
		revokedAgentId = revokedAgent.id;
		await revokeAgent(db, revokedAgentId);

		const expiredAgent = await registerAgent(db, {
			accountId: "01JACCOUNT000000000000001",
			name: "Expired Bot",
			walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
			permissions: DEMO_AGENT_PERMISSION,
			expiresAt: new Date(Date.now() - 86400000),
		});
		expiredAgentId = expiredAgent.id;

		const restrictedAgent = await registerAgent(db, {
			accountId: "01JACCOUNT000000000000001",
			name: "Restricted Bot",
			walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
			permissions: {
				...DEMO_AGENT_PERMISSION,
				allowedRecipients: ["0x0000000000000000000000000000000000000001"],
			},
		});
		restrictedRecipientAgentId = restrictedAgent.id;
	});

	afterAll(async () => {
		await cleanDatabase(db);
		await testClient.end();
	});

	it("allows payment within all limits", async () => {
		const result = await evaluateAgentPermission(db, {
			agentId: activeAgentId,
			amount: 20,
			asset: "wSPYx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
		});

		expect(result.allowed).toBe(true);
		expect(result.violations).toHaveLength(0);
	});

	it("blocks when amount exceeds per-transaction limit", async () => {
		const result = await evaluateAgentPermission(db, {
			agentId: activeAgentId,
			amount: 60,
			asset: "wSPYx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
		});

		expect(result.allowed).toBe(false);
		expect(result.violations).toContain("Amount $60 exceeds per-transaction limit of $50");
	});

	it("blocks disallowed asset", async () => {
		const result = await evaluateAgentPermission(db, {
			agentId: activeAgentId,
			amount: 10,
			asset: "wQQQx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
		});

		expect(result.allowed).toBe(false);
		expect(result.violations).toContain("Asset wQQQx not in allowed list: wSPYx");
	});

	it("blocks disallowed recipient when allowlist is set", async () => {
		const result = await evaluateAgentPermission(db, {
			agentId: restrictedRecipientAgentId,
			amount: 10,
			asset: "wSPYx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
		});

		expect(result.allowed).toBe(false);
		expect(result.violations[0]).toContain("not in allowed recipients");
	});

	it("requires approval above threshold", async () => {
		const result = await evaluateAgentPermission(db, {
			agentId: activeAgentId,
			amount: 30,
			asset: "wSPYx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
		});

		expect(result.allowed).toBe(true);
		expect(result.requiresApproval).toBe(true);
	});

	it("auto-approves below threshold", async () => {
		const result = await evaluateAgentPermission(db, {
			agentId: activeAgentId,
			amount: 10,
			asset: "wSPYx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
		});

		expect(result.allowed).toBe(true);
		expect(result.requiresApproval).toBe(false);
	});

	it("blocks revoked agent", async () => {
		const result = await evaluateAgentPermission(db, {
			agentId: revokedAgentId,
			amount: 10,
			asset: "wSPYx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
		});

		expect(result.allowed).toBe(false);
		expect(result.violations).toContain("Agent is not active (status: revoked)");
	});

	it("blocks expired agent", async () => {
		const result = await evaluateAgentPermission(db, {
			agentId: expiredAgentId,
			amount: 10,
			asset: "wSPYx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
		});

		expect(result.allowed).toBe(false);
		expect(result.violations).toContain("Agent has expired");
	});
});
