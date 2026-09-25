import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import * as schema from "../../db/schema.js";
import { createWatcher, updateWatcher } from "../watcher.js";
import { evaluateAllActiveWatchers, evaluateWatcher } from "../watcher-evaluator.js";
import { cleanDatabase } from "./helpers.js";

const TEST_DB_URL = process.env.TEST_DATABASE_URL;
const describeDb = TEST_DB_URL ? describe : describe.skip;

type SpendingPowerResult = { totalSpendingPower: number };
type AlertRecord = { accountId: string; message: string };

describeDb("evaluateWatcher (requires TEST_DATABASE_URL)", () => {
	const testClient = postgres(TEST_DB_URL ?? "postgres://localhost:5432/skipped");
	const db = drizzle(testClient, { schema });

	let spendingPowerResponses: SpendingPowerResult[] = [];
	let alertsSent: AlertRecord[] = [];
	let spendingPowerCallCount = 0;

	const testGetSpendingPower = async (
		_db: typeof db,
		_accountId: string,
	): Promise<SpendingPowerResult> => {
		spendingPowerCallCount++;
		return spendingPowerResponses.shift() ?? { totalSpendingPower: 0 };
	};

	const testSendAlert = async (accountId: string, message: string): Promise<void> => {
		alertsSent.push({ accountId, message });
	};

	beforeEach(async () => {
		await cleanDatabase(db);
		await testClient`
			INSERT INTO accounts (id, wallet_address, status, created_at, updated_at)
			VALUES
				('01JACCOUNT000000000000001', '0x1111111111111111111111111111111111111111', 'active', NOW(), NOW()),
				('01JACCOUNT000000000000002', '0x2222222222222222222222222222222222222222', 'active', NOW(), NOW())
			ON CONFLICT (id) DO NOTHING
		`;
		spendingPowerResponses = [];
		alertsSent = [];
		spendingPowerCallCount = 0;
	});

	afterEach(async () => {
		await cleanDatabase(db);
	});

	afterAll(async () => {
		await cleanDatabase(db);
		await testClient.end();
	});

	it("does not trigger when spending power is above threshold", async () => {
		const watcher = await createWatcher(db, {
			accountId: "01JACCOUNT000000000000001",
			threshold: 500,
			cooldownMinutes: 60,
		});
		spendingPowerResponses = [{ totalSpendingPower: 600 }];

		const result = await evaluateWatcher(db, watcher.id, testGetSpendingPower, testSendAlert);

		expect(result.triggered).toBe(false);
		expect(result.currentValue).toBe(600);
		expect(result.threshold).toBe(500);
		expect(alertsSent).toHaveLength(0);
	});

	it("triggers when spending power drops below threshold", async () => {
		const watcher = await createWatcher(db, {
			accountId: "01JACCOUNT000000000000001",
			threshold: 500,
			cooldownMinutes: 60,
		});
		spendingPowerResponses = [{ totalSpendingPower: 480 }];

		const result = await evaluateWatcher(db, watcher.id, testGetSpendingPower, testSendAlert);

		expect(result.triggered).toBe(true);
		expect(result.currentValue).toBe(480);
		expect(alertsSent).toHaveLength(1);
		expect(alertsSent[0]?.accountId).toBe("01JACCOUNT000000000000001");
		expect(alertsSent[0]?.message).toContain("480");
	});

	it("respects cooldown — does not re-trigger within window", async () => {
		const watcher = await createWatcher(db, {
			accountId: "01JACCOUNT000000000000001",
			threshold: 500,
			cooldownMinutes: 60,
		});

		// First trigger to set lastTriggeredAt
		spendingPowerResponses = [{ totalSpendingPower: 480 }];
		await evaluateWatcher(db, watcher.id, testGetSpendingPower, testSendAlert);

		// Second evaluation within cooldown window
		alertsSent = [];
		spendingPowerResponses = [{ totalSpendingPower: 480 }];
		const result = await evaluateWatcher(db, watcher.id, testGetSpendingPower, testSendAlert);

		expect(result.triggered).toBe(false);
		expect(alertsSent).toHaveLength(0);
	});

	it("skips paused watchers without calling getSpendingPower", async () => {
		const watcher = await createWatcher(db, {
			accountId: "01JACCOUNT000000000000001",
			threshold: 500,
			cooldownMinutes: 60,
		});
		await updateWatcher(db, watcher.id, { status: "paused" });

		const prevCallCount = spendingPowerCallCount;
		const result = await evaluateWatcher(db, watcher.id, testGetSpendingPower, testSendAlert);

		expect(result.triggered).toBe(false);
		expect(spendingPowerCallCount).toBe(prevCallCount);
	});
});

describeDb("evaluateAllActiveWatchers (requires TEST_DATABASE_URL)", () => {
	const testClient = postgres(TEST_DB_URL ?? "postgres://localhost:5432/skipped");
	const db = drizzle(testClient, { schema });

	let spendingPowerResponses: SpendingPowerResult[] = [];
	let alertsSent: AlertRecord[] = [];

	const testGetSpendingPower = async (
		_db: typeof db,
		_accountId: string,
	): Promise<SpendingPowerResult> => {
		return spendingPowerResponses.shift() ?? { totalSpendingPower: 0 };
	};

	const testSendAlert = async (accountId: string, message: string): Promise<void> => {
		alertsSent.push({ accountId, message });
	};

	beforeEach(async () => {
		await cleanDatabase(db);
		await testClient`
			INSERT INTO accounts (id, wallet_address, status, created_at, updated_at)
			VALUES
				('01JACCOUNT000000000000001', '0x1111111111111111111111111111111111111111', 'active', NOW(), NOW()),
				('01JACCOUNT000000000000002', '0x2222222222222222222222222222222222222222', 'active', NOW(), NOW())
			ON CONFLICT (id) DO NOTHING
		`;
		spendingPowerResponses = [];
		alertsSent = [];
	});

	afterEach(async () => {
		await cleanDatabase(db);
	});

	afterAll(async () => {
		await cleanDatabase(db);
		await testClient.end();
	});

	it("evaluates all active watchers and returns results", async () => {
		await createWatcher(db, {
			accountId: "01JACCOUNT000000000000001",
			threshold: 500,
			cooldownMinutes: 60,
		});
		await createWatcher(db, {
			accountId: "01JACCOUNT000000000000002",
			threshold: 500,
			cooldownMinutes: 60,
		});

		spendingPowerResponses = [{ totalSpendingPower: 600 }, { totalSpendingPower: 400 }];

		const results = await evaluateAllActiveWatchers(db, testGetSpendingPower, testSendAlert);

		expect(results.length).toBeGreaterThanOrEqual(2);
		const triggered = results.filter((r) => r.triggered);
		expect(triggered).toHaveLength(1);
	});
});
