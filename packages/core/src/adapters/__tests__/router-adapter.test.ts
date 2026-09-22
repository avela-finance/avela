import { describe, expect, it } from "vitest";
import type { RouterAdapter } from "../router-adapter.js";

describe("RouterAdapter interface", () => {
	it("executePayment returns expected shape", async () => {
		const testAdapter: RouterAdapter = {
			executePayment: async () => ({
				txHash: "0xabc123",
				blockNumber: 1000,
				gasUsed: 150000n,
			}),
			isPaymentExecuted: async () => false,
		};

		const result = await testAdapter.executePayment({
			token: "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
			merchant: "0x1234567890abcdef1234567890abcdef12345678",
			amount: 25000000n,
			paymentId: "0x0000000000000000000000000000000000000000000000000000000000000001",
			collateralOwner: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
		});

		expect(result.txHash).toBe("0xabc123");
		expect(result.gasUsed).toBe(150000n);
	});

	it("isPaymentExecuted returns boolean", async () => {
		const testAdapter: RouterAdapter = {
			executePayment: async () => ({
				txHash: "0x",
				blockNumber: 0,
				gasUsed: 0n,
			}),
			isPaymentExecuted: async () => true,
		};

		const result = await testAdapter.isPaymentExecuted(
			"0x0000000000000000000000000000000000000000000000000000000000000001",
		);
		expect(result).toBe(true);
	});
});
