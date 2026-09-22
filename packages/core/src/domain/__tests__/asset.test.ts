import { describe, expect, it } from "vitest";
import { getAsset, getSupportedAssets, isAssetEligible, STABLECOINS } from "../asset.js";

describe("asset registry", () => {
	it("returns 3 MVP assets", () => {
		const assets = getSupportedAssets();
		expect(assets).toHaveLength(3);
		expect(assets.map((a) => a.symbol)).toEqual(["wSPYx", "wQQQx", "wNVDAx"]);
	});

	it("returns correct wSPYx config", () => {
		const spy = getAsset("wSPYx");
		expect(spy).toBeDefined();
		expect(spy?.address).toBe("0xe7e553cd128f0011777323a0b44a7b96ea1cb540");
		expect(spy?.haircut).toBe(0.5);
		expect(spy?.settlementStablecoin).toBe("USDG");
		expect(spy?.assetType).toBe("index");
	});

	it("returns correct wQQQx config", () => {
		const qqq = getAsset("wQQQx");
		expect(qqq).toBeDefined();
		expect(qqq?.address).toBe("0x4c1ae29c159838fc1b224636e28e086eb69101f7");
		expect(qqq?.settlementStablecoin).toBe("USDC");
	});

	it("returns correct wNVDAx config", () => {
		const nvda = getAsset("wNVDAx");
		expect(nvda).toBeDefined();
		expect(nvda?.address).toBe("0xa8ddb5cd96b5222afe198316e9a57caa642850d5");
		expect(nvda?.assetType).toBe("single_stock");
	});

	it("returns undefined for unknown asset", () => {
		expect(getAsset("wFAKE")).toBeUndefined();
	});

	it("checks eligibility", () => {
		expect(isAssetEligible("wSPYx")).toBe(true);
		expect(isAssetEligible("wFAKE")).toBe(false);
	});

	it("has USDG and USDC stablecoin addresses", () => {
		expect(STABLECOINS.USDG).toBe("0x4ae46a509f6b1d9056937ba4500cb143933d2dc8");
		expect(STABLECOINS.USDC).toBe("0xb6ceceab302e2e4948951ee7843fc24e92933061");
	});
});
