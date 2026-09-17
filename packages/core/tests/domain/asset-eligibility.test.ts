// packages/core/tests/domain/asset-eligibility.test.ts
import { describe, expect, it } from "vitest";
import { isAssetEligible } from "../../src/domain/asset-eligibility.js";

describe("isAssetEligible", () => {
	it("stablecoin is always eligible", () => {
		const result = isAssetEligible("USDC", false, false);
		expect(result.eligible).toBe(true);
	});

	it("stock is eligible when price exists and policy allows conversion", () => {
		const result = isAssetEligible("xAAPL", true, true);
		expect(result.eligible).toBe(true);
	});

	it("stock is not eligible when no price data", () => {
		const result = isAssetEligible("xAAPL", false, true);
		expect(result.eligible).toBe(false);
		expect(result.reason).toContain("price");
	});

	it("stock is not eligible when policy disallows conversion", () => {
		const result = isAssetEligible("xAAPL", true, false);
		expect(result.eligible).toBe(false);
		expect(result.reason).toContain("policy");
	});

	it("unknown asset is not eligible", () => {
		const result = isAssetEligible("RANDOM", true, true);
		expect(result.eligible).toBe(false);
		expect(result.reason).toContain("unsupported");
	});
});
