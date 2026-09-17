// packages/core/tests/domain/receipt.test.ts
import { describe, expect, it } from "vitest";
import { generateReceipt } from "../../src/domain/receipt.js";
import { FundingSource } from "../../src/types.js";
import { makePaymentIntentId } from "../helpers/fixtures.js";

describe("generateReceipt", () => {
	const intentId = makePaymentIntentId();
	const basePlan = {
		stablecoinAmount: "100",
		conversionAmount: "0",
		conversionAsset: null,
		totalAmount: "100",
		requiresApproval: false,
		rulesChecked: [],
	};

	it("returns a receipt with correct payment fields", () => {
		const receipt = generateReceipt({
			paymentIntentId: intentId,
			payer: "0xpayer",
			recipient: "0xrecipient",
			amount: "100",
			currency: "USDC",
			fundingPlan: basePlan,
			approvalRecord: null,
			executionRefs: null,
			fundedAt: null,
			settledAt: null,
		});

		expect(receipt.paymentIntentId).toBe(intentId);
		expect(receipt.payer).toBe("0xpayer");
		expect(receipt.recipient).toBe("0xrecipient");
		expect(receipt.amount).toBe("100");
		expect(receipt.currency).toBe("USDC");
	});

	it("assigns stablecoin funding source when only stablecoin used", () => {
		const receipt = generateReceipt({
			paymentIntentId: intentId,
			payer: "0xpayer",
			recipient: "0xrecipient",
			amount: "100",
			currency: "USDC",
			fundingPlan: { ...basePlan, stablecoinAmount: "100", conversionAmount: "0" },
			approvalRecord: null,
			executionRefs: null,
			fundedAt: null,
			settledAt: null,
		});

		expect(receipt.fundingSource).toBe(FundingSource.stablecoin);
	});

	it("assigns stock_conversion funding source when only conversion used", () => {
		const receipt = generateReceipt({
			paymentIntentId: intentId,
			payer: "0xpayer",
			recipient: "0xrecipient",
			amount: "100",
			currency: "USDC",
			fundingPlan: {
				...basePlan,
				stablecoinAmount: "0",
				conversionAmount: "100",
				conversionAsset: "AAPL",
			},
			approvalRecord: null,
			executionRefs: null,
			fundedAt: null,
			settledAt: null,
		});

		expect(receipt.fundingSource).toBe(FundingSource.stock_conversion);
	});

	it("assigns mixed funding source when both stablecoin and conversion used", () => {
		const receipt = generateReceipt({
			paymentIntentId: intentId,
			payer: "0xpayer",
			recipient: "0xrecipient",
			amount: "100",
			currency: "USDC",
			fundingPlan: {
				...basePlan,
				stablecoinAmount: "50",
				conversionAmount: "50",
				conversionAsset: "AAPL",
			},
			approvalRecord: null,
			executionRefs: null,
			fundedAt: null,
			settledAt: null,
		});

		expect(receipt.fundingSource).toBe(FundingSource.mixed);
	});

	it("includes policyDecision with rulesChecked and plan", () => {
		const rulesChecked = [{ rule: "reserve_minimum", passed: true, reason: "ok" }];
		const receipt = generateReceipt({
			paymentIntentId: intentId,
			payer: "0xpayer",
			recipient: "0xrecipient",
			amount: "100",
			currency: "USDC",
			fundingPlan: { ...basePlan, rulesChecked },
			approvalRecord: null,
			executionRefs: null,
			fundedAt: null,
			settledAt: null,
		});

		expect(receipt.policyDecision).toMatchObject({
			rulesChecked,
			plan: {
				stablecoinAmount: "100",
				conversionAmount: "0",
				conversionAsset: null,
			},
		});
	});

	it("passes through approvalRecord, executionRefs, fundedAt, settledAt", () => {
		const approvalRecord = { approvedBy: "0xapprover" };
		const executionRefs = { txHash: "0xabc123" };
		const fundedAt = new Date("2026-01-01");
		const settledAt = new Date("2026-01-02");

		const receipt = generateReceipt({
			paymentIntentId: intentId,
			payer: "0xpayer",
			recipient: "0xrecipient",
			amount: "100",
			currency: "USDC",
			fundingPlan: basePlan,
			approvalRecord,
			executionRefs,
			fundedAt,
			settledAt,
		});

		expect(receipt.approvalRecord).toEqual(approvalRecord);
		expect(receipt.executionRefs).toEqual(executionRefs);
		expect(receipt.fundedAt).toBe(fundedAt);
		expect(receipt.settledAt).toBe(settledAt);
	});

	it("sets createdAt and completedAt to current time", () => {
		const before = Date.now();
		const receipt = generateReceipt({
			paymentIntentId: intentId,
			payer: "0xpayer",
			recipient: "0xrecipient",
			amount: "100",
			currency: "USDC",
			fundingPlan: basePlan,
			approvalRecord: null,
			executionRefs: null,
			fundedAt: null,
			settledAt: null,
		});
		const after = Date.now();

		expect(receipt.createdAt.getTime()).toBeGreaterThanOrEqual(before);
		expect(receipt.createdAt.getTime()).toBeLessThanOrEqual(after);
		expect(receipt.completedAt.getTime()).toBeGreaterThanOrEqual(before);
		expect(receipt.completedAt.getTime()).toBeLessThanOrEqual(after);
	});

	it("generates a unique id for each receipt", () => {
		const params = {
			paymentIntentId: intentId,
			payer: "0xpayer",
			recipient: "0xrecipient",
			amount: "100",
			currency: "USDC",
			fundingPlan: basePlan,
			approvalRecord: null,
			executionRefs: null,
			fundedAt: null,
			settledAt: null,
		};

		const r1 = generateReceipt(params);
		const r2 = generateReceipt(params);
		expect(r1.id).not.toBe(r2.id);
	});
});
