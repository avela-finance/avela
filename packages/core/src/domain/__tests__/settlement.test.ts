import { describe, expect, it } from "vitest";
import { buildReceipt } from "../settlement.js";

describe("buildReceipt", () => {
	it("builds a receipt from payment intent and settlement data", () => {
		const receipt = buildReceipt({
			intent: {
				id: "01JPAYMENT0000000000000000",
				accountId: "01JACCOUNT0000000000000",
				amount: 25,
				recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
				fundingDecision: {
					source: "spending_power",
					collateralAsset: "wSPYx",
					collateralVerified: true,
					collateralAmount: 1000000000000000000n,
					settlementToken: "USDG",
					paymentId: "0x0000000000000000000000000000000000000000000000000000000000000001",
					spendingPowerAtDecision: 800,
					decidedAt: new Date("2026-09-21T12:00:00Z"),
				},
			},
			settlement: {
				paymentId: "0x0000000000000000000000000000000000000000000000000000000000000001",
				txHash: "0xabc123def456",
				blockNumber: 12345,
				amountSettled: 25000000n,
				settlementToken: "USDG",
				gasUsed: 150000n,
				settledAt: new Date("2026-09-21T12:00:05Z"),
			},
		});

		expect(receipt.paymentId).toBe("0x0000000000000000000000000000000000000000000000000000000000000001");
		expect(receipt.accountId).toBe("01JACCOUNT0000000000000");
		expect(receipt.amount).toBe(25);
		expect(receipt.collateralAsset).toBe("wSPYx");
		expect(receipt.settlementToken).toBe("USDG");
		expect(receipt.settlementTxHash).toBe("0xabc123def456");
		expect(receipt.recipientAddress).toBe("0x1234567890abcdef1234567890abcdef12345678");
	});

	it("handles stablecoin balance funding source", () => {
		const receipt = buildReceipt({
			intent: {
				id: "01JPAYMENT0000000000000001",
				accountId: "01JACCOUNT0000000000000",
				amount: 10,
				recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
				fundingDecision: {
					source: "stablecoin_balance",
					collateralAsset: null,
					collateralVerified: false,
					collateralAmount: null,
					settlementToken: "USDC",
					paymentId: "0x0000000000000000000000000000000000000000000000000000000000000002",
					spendingPowerAtDecision: 100,
					decidedAt: new Date("2026-09-21T12:00:00Z"),
				},
			},
			settlement: {
				paymentId: "0x0000000000000000000000000000000000000000000000000000000000000002",
				txHash: "0xdef789",
				blockNumber: 12346,
				amountSettled: 10000000n,
				settlementToken: "USDC",
				gasUsed: 50000n,
				settledAt: new Date("2026-09-21T12:00:02Z"),
			},
		});

		expect(receipt.collateralAsset).toBe("stablecoin");
		expect(receipt.settlementToken).toBe("USDC");
	});
});
