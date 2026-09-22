import { describe, expect, it } from "vitest";
import { selectFundingSource } from "../funding-engine.js";
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
