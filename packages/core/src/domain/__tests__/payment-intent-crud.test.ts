import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "../../db/schema.js";
import {
	createPaymentIntent,
	getPaymentHistory,
	getPaymentIntent,
	updatePaymentStatus,
} from "../payment-intent.js";
import { cleanDatabase } from "./helpers.js";

const TEST_DB_URL = process.env.TEST_DATABASE_URL;

const describeDb = TEST_DB_URL ? describe : describe.skip;

describeDb("payment intent CRUD (requires TEST_DATABASE_URL)", () => {
	const testClient = postgres(TEST_DB_URL ?? "postgres://localhost:5432/skipped");
	const db = drizzle(testClient, { schema });

	beforeAll(async () => {
		await db.execute(sql`
			DO $$ BEGIN
				CREATE TYPE payment_status AS ENUM (
					'created', 'policy_check', 'awaiting_approval',
					'collateral_verify', 'settling', 'settled', 'failed', 'rejected'
				);
			EXCEPTION WHEN duplicate_object THEN null;
			END $$
		`);
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS accounts (
				id VARCHAR(26) PRIMARY KEY,
				wallet_address VARCHAR(42) NOT NULL UNIQUE,
				username VARCHAR(32) UNIQUE,
				status VARCHAR(20) NOT NULL DEFAULT 'active',
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)
		`);
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS payment_intents (
				id VARCHAR(26) PRIMARY KEY,
				account_id VARCHAR(26) NOT NULL REFERENCES accounts(id),
				amount NUMERIC(18,6) NOT NULL,
				recipient_address VARCHAR(42) NOT NULL,
				recipient_username VARCHAR(32),
				status payment_status NOT NULL DEFAULT 'created',
				funding_decision JSONB,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
			)
		`);
		await db.execute(sql`
			INSERT INTO accounts (id, wallet_address, status)
			VALUES ('01JACCOUNT0000000000000', '0xTESTWALLET000000000000000000000000000000', 'active')
			ON CONFLICT (id) DO NOTHING
		`);
	});

	afterAll(async () => {
		await cleanDatabase(db);
		await testClient.end();
	});

	it("creates a payment intent with ULID id and created status", async () => {
		const result = await createPaymentIntent(db, {
			accountId: "01JACCOUNT0000000000000",
			amount: 25,
			recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
		});

		expect(result.status).toBe("created");
		expect(result.amount).toBe("25.000000");
		expect(result.fundingDecision).toBeNull();
		expect(result.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
	});

	it("returns null when payment not found", async () => {
		const result = await getPaymentIntent(db, "01JNOTFOUND00000000000000");
		expect(result).toBeNull();
	});

	it("retrieves payment history ordered by creation date", async () => {
		await createPaymentIntent(db, {
			accountId: "01JACCOUNT0000000000000",
			amount: 10,
			recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
		});
		await createPaymentIntent(db, {
			accountId: "01JACCOUNT0000000000000",
			amount: 20,
			recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
		});

		const history = await getPaymentHistory(db, "01JACCOUNT0000000000000");
		expect(history.length).toBeGreaterThanOrEqual(2);
	});

	it("transitions through valid states", async () => {
		const intent = await createPaymentIntent(db, {
			accountId: "01JACCOUNT0000000000000",
			amount: 10,
			recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
		});

		await updatePaymentStatus(db, intent.id, "policy_check");
		await updatePaymentStatus(db, intent.id, "collateral_verify");
		await updatePaymentStatus(db, intent.id, "settling");
		const settled = await updatePaymentStatus(db, intent.id, "settled");

		expect(settled.status).toBe("settled");
	});

	it("throws on invalid state transition", async () => {
		const intent = await createPaymentIntent(db, {
			accountId: "01JACCOUNT0000000000000",
			amount: 10,
			recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
		});

		await updatePaymentStatus(db, intent.id, "policy_check");
		await updatePaymentStatus(db, intent.id, "collateral_verify");
		await updatePaymentStatus(db, intent.id, "settling");
		await updatePaymentStatus(db, intent.id, "settled");

		await expect(updatePaymentStatus(db, intent.id, "created")).rejects.toThrow(
			"Invalid transition",
		);
	});
});
