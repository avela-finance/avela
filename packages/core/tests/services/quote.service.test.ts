import { describe, expect, it } from "vitest";
import { QuoteService } from "../../src/services/quote.service.js";

describe("QuoteService", () => {
	it("returns a funding plan for a given amount", () => {
		const service = new QuoteService();
		const plan = service.getQuote({
			amount: "100",
			stablecoinBalance: "500",
			stablecoinLocked: "0",
			stockBalance: "1000",
			stockLocked: "0",
			stockAsset: "xAAPL",
			stockPriceUsd: "150",
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
		});
		expect(plan.stablecoinAmount).toBe("100");
		expect(plan.totalAmount).toBe("100");
	});
});
