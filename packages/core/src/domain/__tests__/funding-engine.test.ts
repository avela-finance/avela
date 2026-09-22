import { describe, expect, it } from "vitest";
import { executePayment, selectFundingSource } from "../funding-engine.js";
import type { ExecutePaymentDeps } from "../funding-engine.js";
import type { PaymentIntent } from "../payment-intent.js";
import type { SpendingPower } from "../types.js";

const MOCK_SPENDING_POWER: SpendingPower = {
	accountId: "01JACCOUNT0000000000000",
	perAsset: [
		{
			assetSymbol: "wSPYx",
			positionValue: 1400,
			haircut: 0.5,
			spendingPower: 700,
		},
		{
			assetSymbol: "wQQQx",
			positionValue: 920,
			haircut: 0.5,
			spendingPower: 460,
		},
		{
			assetSymbol: "wNVDAx",
			positionValue: 880,
			haircut: 0.5,
			spendingPower: 440,
		},
	],
	stablecoinBalance: 100,
	totalSpendingPower: 1700,
	calculatedAt: new Date(),
};

describe("selectFundingSource", () => {
	it("selects spending power first, picking asset with highest spending power", () => {
		const result = selectFundingSource({
			amount: 25,
			spendingPower: MOCK_SPENDING_POWER,
		});

		expect(result.source).toBe("spending_power");
		expect(result.collateralAsset).toBe("wSPYx");
		expect(result.settlementToken).toBe("USDG");
		expect(result.collateralVerified).toBe(false);
	});

	it("falls back to stablecoin balance when spending power insufficient", () => {
		const lowSpendingPower: SpendingPower = {
			...MOCK_SPENDING_POWER,
			perAsset: MOCK_SPENDING_POWER.perAsset.map((a) => ({
				...a,
				spendingPower: 5,
			})),
			stablecoinBalance: 100,
			totalSpendingPower: 115,
		};

		const result = selectFundingSource({
			amount: 25,
			spendingPower: lowSpendingPower,
		});

		expect(result.source).toBe("stablecoin_balance");
		expect(result.collateralAsset).toBeNull();
	});

	it("throws when neither source covers the amount", () => {
		const emptyPower: SpendingPower = {
			...MOCK_SPENDING_POWER,
			perAsset: [],
			stablecoinBalance: 0,
			totalSpendingPower: 0,
		};

		expect(() =>
			selectFundingSource({
				amount: 25,
				spendingPower: emptyPower,
			}),
		).toThrow("Insufficient funds");
	});

	it("records spendingPowerAtDecision", () => {
		const result = selectFundingSource({
			amount: 25,
			spendingPower: MOCK_SPENDING_POWER,
		});

		expect(result.spendingPowerAtDecision).toBe(1700);
	});

	it("generates a paymentId as bytes32 hex", () => {
		const result = selectFundingSource({
			amount: 25,
			spendingPower: MOCK_SPENDING_POWER,
		});

		expect(result.paymentId).toMatch(/^0x[a-f0-9]{64}$/);
	});
});

let callLog: string[] = [];

function buildDeps(overrides: Partial<ExecutePaymentDeps> = {}): ExecutePaymentDeps {
	callLog = [];
	return {
		db: {} as ExecutePaymentDeps["db"],
		getPaymentIntent: async () => {
			callLog.push("getPaymentIntent");
			return {
				id: "01JTEST000000000000000000",
				accountId: "01JACCOUNT0000000000000",
				amount: 25,
				recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
				status: "created",
			} as unknown as PaymentIntent;
		},
		updatePaymentStatus: async (_db, _id, status) => {
			callLog.push(`updatePaymentStatus:${status}`);
			return { status } as unknown as PaymentIntent;
		},
		evaluatePolicy: async () => {
			callLog.push("evaluatePolicy");
			return { passed: true, requiresApproval: false, violations: [] };
		},
		calculateSpendingPower: async () => {
			callLog.push("calculateSpendingPower");
			return {
				accountId: "01JACCOUNT0000000000000",
				perAsset: [{ assetSymbol: "wSPYx", positionValue: 1400, haircut: 0.5, spendingPower: 700 }],
				stablecoinBalance: 100,
				totalSpendingPower: 800,
				calculatedAt: new Date(),
			};
		},
		vaultAdapter: {
			getLockedBalance: async () => {
				callLog.push("vaultAdapter.getLockedBalance");
				return 1000000000000000000n;
			},
		},
		routerAdapter: {
			executePayment: async () => {
				callLog.push("routerAdapter.executePayment");
				return {
					txHash: "0xabc123",
					blockNumber: 1000,
					gasUsed: 150000n,
				};
			},
			isPaymentExecuted: async () => false,
		},
		recordSettlement: async () => {
			callLog.push("recordSettlement");
			return {};
		},
		getAccountWalletAddress: async () => {
			return "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
		},
		...overrides,
	};
}

describe("executePayment", () => {
	it("orchestrates: policy → collateral verify → settle", async () => {
		const deps = buildDeps();
		const result = await executePayment(deps, "01JTEST000000000000000000");

		expect(callLog).toContain("evaluatePolicy");
		expect(callLog).toContain("vaultAdapter.getLockedBalance");
		expect(callLog).toContain("routerAdapter.executePayment");
		expect(callLog).toContain("recordSettlement");
		expect(result.status).toBe("settled");
	});

	it("fails when policy check fails", async () => {
		const deps = buildDeps({
			evaluatePolicy: async () => ({
				passed: false,
				requiresApproval: false,
				violations: [
					{ rule: "daily_limit", message: "Exceeds limit", currentValue: 600, threshold: 500 },
				],
			}),
		});

		const result = await executePayment(deps, "01JTEST000000000000000000");
		expect(result.status).toBe("failed");
		expect(callLog).not.toContain("routerAdapter.executePayment");
	});

	it("routes to awaiting_approval when policy requires it", async () => {
		const deps = buildDeps({
			evaluatePolicy: async () => ({
				passed: true,
				requiresApproval: true,
				violations: [],
			}),
		});

		const result = await executePayment(deps, "01JTEST000000000000000000");
		expect(result.status).toBe("awaiting_approval");
		expect(callLog).not.toContain("routerAdapter.executePayment");
	});

	it("fails when collateral verification returns zero", async () => {
		const deps = buildDeps({
			vaultAdapter: {
				getLockedBalance: async () => 0n,
			},
		});

		const result = await executePayment(deps, "01JTEST000000000000000000");
		expect(result.status).toBe("failed");
		expect(callLog).not.toContain("routerAdapter.executePayment");
	});
});
