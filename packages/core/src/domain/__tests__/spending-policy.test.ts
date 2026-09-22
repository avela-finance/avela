import { describe, expect, it } from "vitest";
import { DEFAULT_POLICY } from "../policy-defaults.js";

describe("DEFAULT_POLICY", () => {
	it("has a daily limit of $500", () => {
		expect(DEFAULT_POLICY.dailyLimit).toBe(500);
	});

	it("has an approval threshold of $100", () => {
		expect(DEFAULT_POLICY.approvalThreshold).toBe(100);
	});

	it("defaults to spending power first, then stablecoin balance", () => {
		expect(DEFAULT_POLICY.fundingPriority).toEqual([
			"spending_power",
			"stablecoin_balance",
		]);
	});

	it("has no price floors by default", () => {
		expect(DEFAULT_POLICY.priceFloors).toEqual([]);
	});

	it("has no minimum balances by default", () => {
		expect(DEFAULT_POLICY.minimumBalances).toEqual([]);
	});

	it("is enabled by default", () => {
		expect(DEFAULT_POLICY.enabled).toBe(true);
	});
});
