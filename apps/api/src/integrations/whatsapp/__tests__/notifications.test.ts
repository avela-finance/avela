import { describe, expect, it } from "vitest";
import {
	formatApprovalMessage,
	formatBalanceMessage,
	formatReceiptMessage,
	formatSpendingAlertMessage,
	formatSpendingPowerMessage,
} from "../notifications.js";

describe("notification formatters", () => {
	it("formats approval request message", () => {
		const msg = formatApprovalMessage({
			agentName: "Trading Bot",
			amount: 12.0,
			sourceAsset: "wSPYx",
			settlementCurrency: "USDG",
			recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
		});
		expect(msg).toContain("Trading Bot");
		expect(msg).toContain("$12.00");
		expect(msg).toContain("wSPYx");
		expect(msg).toContain("0x1234...5678");
	});

	it("formats receipt message", () => {
		const msg = formatReceiptMessage({
			amount: 25.0,
			recipientAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
			sourceAsset: "wSPYx",
			sourceAmount: "0.045",
			settlementCurrency: "USDG",
			txHash: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
		});
		expect(msg).toContain("$25.00");
		expect(msg).toContain("wSPYx");
		expect(msg).toContain("0.045");
		expect(msg).toContain("0xdead...beef");
	});

	it("formats spending alert message", () => {
		const msg = formatSpendingAlertMessage({
			currentSpendingPower: 480,
			previousSpendingPower: 620,
			threshold: 500,
		});
		expect(msg).toContain("$480");
		expect(msg).toContain("$500");
	});

	it("formats balance message", () => {
		const msg = formatBalanceMessage({
			totalValue: 3200,
			positions: [
				{ symbol: "wSPYx", amount: "2.5", valueUsd: 1400 },
				{ symbol: "wQQQx", amount: "1.8", valueUsd: 920 },
				{ symbol: "wNVDAx", amount: "6.2", valueUsd: 880 },
			],
			totalSpendingPower: 1600,
		});
		expect(msg).toContain("$3,200");
		expect(msg).toContain("wSPYx");
		expect(msg).toContain("$1,600");
	});

	it("formats spending power message", () => {
		const msg = formatSpendingPowerMessage({
			perAsset: [
				{ symbol: "wSPYx", value: 1400, haircut: 0.5, spendingPower: 700 },
				{ symbol: "wQQQx", value: 920, haircut: 0.5, spendingPower: 460 },
			],
			stablecoinBalance: 200,
			totalSpendingPower: 1360,
		});
		expect(msg).toContain("wSPYx");
		expect(msg).toContain("$700");
		expect(msg).toContain("$1,360");
	});
});
