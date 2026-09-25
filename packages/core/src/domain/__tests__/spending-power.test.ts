import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { PriceFeedAdapter } from "../../adapters/price-feed.js";
import * as schema from "../../db/schema.js";
import { createAccount } from "../account.js";
import { recordDeposit } from "../position.js";
import { calculateSpendingPower, computeAssetSpendingPower } from "../spending-power.js";
import { cleanDatabase } from "./helpers.js";

const testClient = postgres(process.env.TEST_DATABASE_URL ?? "postgres://localhost:5432/skipped");
const db = drizzle(testClient, { schema });

beforeEach(async () => {
	await cleanDatabase(db);
});

afterAll(async () => {
	await testClient.end();
});

describe("spending power", () => {
	describe("computeAssetSpendingPower", () => {
		it("applies haircut correctly", () => {
			const result = computeAssetSpendingPower(1000000000000000000n, 18, 550.0, 0.5);
			expect(result.positionValue).toBeCloseTo(550.0, 1);
			expect(result.spendingPower).toBeCloseTo(275.0, 1);
			expect(result.haircut).toBe(0.5);
		});

		it("handles zero amount", () => {
			const result = computeAssetSpendingPower(0n, 18, 100.0, 0.5);
			expect(result.positionValue).toBe(0);
			expect(result.spendingPower).toBe(0);
		});

		it("handles fractional tokens", () => {
			const result = computeAssetSpendingPower(500000000000000000n, 18, 1000.0, 0.5);
			expect(result.positionValue).toBeCloseTo(500.0, 1);
			expect(result.spendingPower).toBeCloseTo(250.0, 1);
		});
	});

	describe("calculateSpendingPower", () => {
		it("aggregates spending power across positions", async () => {
			const account = await createAccount(db, "0x1234567890abcdef1234567890abcdef12345678");

			await recordDeposit(db, {
				accountId: account.id,
				assetSymbol: "wSPYx",
				amount: 2000000000000000000n,
				depositTxHash: "0x0000000000000000000000000000000000000000000000000000000000000001",
			});
			await recordDeposit(db, {
				accountId: account.id,
				assetSymbol: "wNVDAx",
				amount: 5000000000000000000n,
				depositTxHash: "0x0000000000000000000000000000000000000000000000000000000000000002",
			});

			const testPriceFeed: PriceFeedAdapter = {
				getPrice: async (address: string) => {
					if (address === "0xe7e553cd128f0011777323a0b44a7b96ea1cb540") {
						return { price: 550, source: "test", confidence: 1, timestamp: new Date() };
					}
					if (address === "0xa8ddb5cd96b5222afe198316e9a57caa642850d5") {
						return { price: 140, source: "test", confidence: 1, timestamp: new Date() };
					}
					throw new Error("Unknown asset");
				},
			};

			const sp = await calculateSpendingPower(db, testPriceFeed, account.id);
			// wSPYx: 2 * 550 = 1100 value, 50% haircut = 550 SP
			// wNVDAx: 5 * 140 = 700 value, 50% haircut = 350 SP
			// Total = 900 SP
			expect(sp.perAsset).toHaveLength(2);
			expect(sp.totalSpendingPower).toBeCloseTo(900.0, 0);
			expect(sp.accountId).toBe(account.id);
		});
	});
});
