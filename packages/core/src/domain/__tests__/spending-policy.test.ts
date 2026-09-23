import { describe, expect, it } from "vitest";
import { DEFAULT_POLICY } from "../policy-defaults.js";
import { evaluatePolicyRules } from "../spending-policy.js";

describe("DEFAULT_POLICY", () => {
	it("has a daily limit of $500", () => {
		expect(DEFAULT_POLICY.dailyLimit).toBe(500);
	});

	it("has an approval threshold of $100", () => {
		expect(DEFAULT_POLICY.approvalThreshold).toBe(100);
	});

	it("defaults to spending power first, then stablecoin balance", () => {
		expect(DEFAULT_POLICY.fundingPriority).toEqual(["spending_power", "stablecoin_balance"]);
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

describe("evaluatePolicyRules", () => {
	it("passes when amount is within daily limit", () => {
		const result = evaluatePolicyRules({
			amount: 50,
			dailyLimit: 500,
			dailySpent: 100,
			approvalThreshold: 100,
			priceFloors: [],
			minimumBalances: [],
			currentPrices: {},
			currentPositions: {},
		});

		expect(result.passed).toBe(true);
		expect(result.requiresApproval).toBe(false);
		expect(result.violations).toHaveLength(0);
	});

	it("fails when amount exceeds daily limit", () => {
		const result = evaluatePolicyRules({
			amount: 200,
			dailyLimit: 500,
			dailySpent: 400,
			approvalThreshold: 100,
			priceFloors: [],
			minimumBalances: [],
			currentPrices: {},
			currentPositions: {},
		});

		expect(result.passed).toBe(false);
		expect(result.violations).toHaveLength(1);
		expect(result.violations[0]?.rule).toBe("daily_limit");
	});

	it("requires approval when amount exceeds threshold", () => {
		const result = evaluatePolicyRules({
			amount: 150,
			dailyLimit: 500,
			dailySpent: 0,
			approvalThreshold: 100,
			priceFloors: [],
			minimumBalances: [],
			currentPrices: {},
			currentPositions: {},
		});

		expect(result.passed).toBe(true);
		expect(result.requiresApproval).toBe(true);
	});

	it("does not require approval when amount is below threshold", () => {
		const result = evaluatePolicyRules({
			amount: 50,
			dailyLimit: 500,
			dailySpent: 0,
			approvalThreshold: 100,
			priceFloors: [],
			minimumBalances: [],
			currentPrices: {},
			currentPositions: {},
		});

		expect(result.passed).toBe(true);
		expect(result.requiresApproval).toBe(false);
	});

	it("fails when asset price is below price floor", () => {
		const result = evaluatePolicyRules({
			amount: 50,
			dailyLimit: 500,
			dailySpent: 0,
			approvalThreshold: 100,
			priceFloors: [{ assetSymbol: "wSPYx", floorPrice: 600 }],
			minimumBalances: [],
			currentPrices: { wSPYx: 550 },
			currentPositions: {},
		});

		expect(result.passed).toBe(false);
		expect(result.violations).toHaveLength(1);
		expect(result.violations[0]?.rule).toBe("price_floor");
	});

	it("passes when asset price is above price floor", () => {
		const result = evaluatePolicyRules({
			amount: 50,
			dailyLimit: 500,
			dailySpent: 0,
			approvalThreshold: 100,
			priceFloors: [{ assetSymbol: "wSPYx", floorPrice: 500 }],
			minimumBalances: [],
			currentPrices: { wSPYx: 550 },
			currentPositions: {},
		});

		expect(result.passed).toBe(true);
	});

	it("passes with null daily limit (no limit)", () => {
		const result = evaluatePolicyRules({
			amount: 10000,
			dailyLimit: null,
			dailySpent: 50000,
			approvalThreshold: null,
			priceFloors: [],
			minimumBalances: [],
			currentPrices: {},
			currentPositions: {},
		});

		expect(result.passed).toBe(true);
		expect(result.requiresApproval).toBe(false);
	});

	it("collects multiple violations", () => {
		const result = evaluatePolicyRules({
			amount: 600,
			dailyLimit: 500,
			dailySpent: 100,
			approvalThreshold: 100,
			priceFloors: [{ assetSymbol: "wSPYx", floorPrice: 600 }],
			minimumBalances: [],
			currentPrices: { wSPYx: 550 },
			currentPositions: {},
		});

		expect(result.passed).toBe(false);
		expect(result.violations.length).toBeGreaterThanOrEqual(2);
	});
});
