import { describe, expect, it } from "vitest";
import { buildFundingPlan } from "../../src/domain/funding-policy.js";
import { PolicyViolationError } from "../../src/errors.js";

const baseParams = {
	amount: "100",
	stablecoinBalance: "500",
	stablecoinLocked: "0",
	stockBalance: "1000",
	stockLocked: "0",
	stockAsset: "xAAPL",
	stockPriceUsd: "150.00",
	stockPriceTimestamp: new Date(),
	policy: {
		reserveMinimum: "50",
		approvalThreshold: "500",
		dailyCap: "1000",
		priceFloor: "100",
		executionLimit: "500",
	},
	dailySpentSoFar: "0",
	isAgentInitiated: false,
	recipientApproved: true,
};

describe("buildFundingPlan", () => {
	it("step 1: rejects when daily cap exceeded", () => {
		expect(() =>
			buildFundingPlan({ ...baseParams, dailySpentSoFar: "950", amount: "100" }),
		).toThrow(PolicyViolationError);
	});

	it("step 2: rejects agent-initiated with unapproved recipient", () => {
		expect(() =>
			buildFundingPlan({ ...baseParams, isAgentInitiated: true, recipientApproved: false }),
		).toThrow(PolicyViolationError);
	});

	it("step 4: stablecoin covers full amount", () => {
		const plan = buildFundingPlan(baseParams);
		expect(plan.stablecoinAmount).toBe("100");
		expect(plan.conversionAmount).toBe("0");
		expect(plan.conversionAsset).toBeNull();
		expect(plan.requiresApproval).toBe(false);
	});

	it("step 5-7: mixed funding when stablecoin insufficient", () => {
		const plan = buildFundingPlan({
			...baseParams,
			amount: "600",
			stablecoinBalance: "500",
			policy: { ...baseParams.policy, reserveMinimum: "50" },
		});
		expect(plan.stablecoinAmount).toBe("450");
		expect(plan.conversionAmount).toBe("150");
		expect(plan.conversionAsset).toBe("xAAPL");
	});

	it("step 6: rejects when stock price below floor", () => {
		expect(() =>
			buildFundingPlan({
				...baseParams,
				amount: "600",
				stablecoinBalance: "100",
				stockPriceUsd: "50.00",
				policy: { ...baseParams.policy, priceFloor: "100" },
			}),
		).toThrow(PolicyViolationError);
	});

	it("step 6: rejects when conversion exceeds execution limit", () => {
		expect(() =>
			buildFundingPlan({
				...baseParams,
				amount: "1000",
				stablecoinBalance: "100",
				policy: { ...baseParams.policy, reserveMinimum: "50", executionLimit: "200" },
			}),
		).toThrow(PolicyViolationError);
	});

	it("step 8: requires approval when amount exceeds threshold", () => {
		const plan = buildFundingPlan({
			...baseParams,
			amount: "600",
			policy: { ...baseParams.policy, approvalThreshold: "500" },
		});
		expect(plan.requiresApproval).toBe(true);
	});

	it("does not require approval when amount is under threshold", () => {
		const plan = buildFundingPlan({
			...baseParams,
			amount: "100",
			policy: { ...baseParams.policy, approvalThreshold: "500" },
		});
		expect(plan.requiresApproval).toBe(false);
	});

	it("rejects when no eligible asset and stablecoin insufficient", () => {
		expect(() =>
			buildFundingPlan({
				...baseParams,
				amount: "600",
				stablecoinBalance: "100",
				stockPriceUsd: null,
				stockPriceTimestamp: null,
			}),
		).toThrow(PolicyViolationError);
	});

	it("step 6c: rejects when insufficient stock balance for conversion", () => {
		expect(() =>
			buildFundingPlan({
				...baseParams,
				amount: "600",
				stablecoinBalance: "100",
				stockBalance: "0.5",
				stockLocked: "0",
				stockPriceUsd: "150.00",
				policy: { ...baseParams.policy, reserveMinimum: "50" },
			}),
		).toThrow(PolicyViolationError);
	});

	it("records all rules checked in the plan", () => {
		const plan = buildFundingPlan(baseParams);
		expect(plan.rulesChecked.length).toBeGreaterThan(0);
		expect(plan.rulesChecked.every((r) => typeof r.rule === "string")).toBe(true);
		expect(plan.rulesChecked.every((r) => typeof r.passed === "boolean")).toBe(true);
	});
});
