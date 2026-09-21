import { describe, expect, it } from "vitest";
import type { PriceResult } from "../../domain/types.js";
import type { PriceFeedAdapter } from "../price-feed.js";

describe("PriceFeedAdapter interface", () => {
	it("adapter conforms to the interface", () => {
		const mockAdapter: PriceFeedAdapter = {
			getPrice: async (_assetAddress: string, _chainId: number): Promise<PriceResult> => ({
				price: 550.25,
				source: "test",
				confidence: 1,
				timestamp: new Date(),
			}),
		};
		expect(mockAdapter.getPrice).toBeDefined();
	});

	it("getPrice returns a PriceResult", async () => {
		const mockAdapter: PriceFeedAdapter = {
			getPrice: async () => ({
				price: 550.25,
				source: "test",
				confidence: 1,
				timestamp: new Date(),
			}),
		};
		const result = await mockAdapter.getPrice("0xabc", 196);
		expect(result.price).toBe(550.25);
		expect(result.source).toBe("test");
		expect(result.confidence).toBeGreaterThanOrEqual(0);
		expect(result.confidence).toBeLessThanOrEqual(1);
	});
});
