import { describe, expect, it, vi } from "vitest";
import { PaymentService } from "../../src/services/payment.service.js";

const mockPriceAdapter = {
	getPrice: vi.fn().mockResolvedValue({ priceUsd: "150", timestamp: new Date() }),
};

const mockLiquidityAdapter = {
	getQuote: vi.fn().mockResolvedValue({
		from: "xAAPL",
		to: "USDC",
		amountIn: "100",
		expectedOut: "100",
		route: "uniswap",
	}),
	executeSwap: vi.fn().mockResolvedValue({ txHash: "0xswap", actualOut: "100" }),
};

const mockSettlementAdapter = {
	transfer: vi.fn().mockResolvedValue({ txHash: "0xsettle", confirmed: true }),
	confirmTransfer: vi.fn().mockResolvedValue({ confirmed: true, blockNumber: 123 }),
};

// biome-ignore lint/suspicious/noExplicitAny: test mock for db
const mockDb = {} as any;

describe("PaymentService", () => {
	it("exists and can be instantiated", () => {
		const service = new PaymentService(
			mockDb,
			mockPriceAdapter,
			mockLiquidityAdapter,
			mockSettlementAdapter,
		);
		expect(service).toBeDefined();
	});
});
