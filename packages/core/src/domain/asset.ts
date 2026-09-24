import type { Asset, SettlementStablecoin } from "./types.js";

export const STABLECOINS: Record<SettlementStablecoin, string> = {
	USDG: "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
	USDC: "0xb6ceceab302e2e4948951ee7843fc24e92933061",
} as const;

export const STABLECOIN_DECIMALS: Record<SettlementStablecoin, number> = {
	// Verified onchain via cast decimals() on X Layer (chain 196): both return 6.
	USDG: 6,
	USDC: 6,
} as const;

const MVP_ASSETS: Asset[] = [
	{
		symbol: "wSPYx",
		name: "S&P 500",
		address: "0xe7e553cd128f0011777323a0b44a7b96ea1cb540",
		decimals: 18,
		assetType: "index",
		haircut: 0.5,
		settlementStablecoin: "USDG",
		// Uniswap V3 USDG/wSPYx, fee 500. Verified onchain (token0=USDG, token1=wSPYx).
		poolAddress: "0x07c40850d14064d20eb0afdef9574675392f2c11",
		enabled: true,
	},
	{
		symbol: "wQQQx",
		name: "Nasdaq 100",
		address: "0x4c1ae29c159838fc1b224636e28e086eb69101f7",
		decimals: 18,
		assetType: "index",
		haircut: 0.5,
		settlementStablecoin: "USDC",
		// Uniswap V3 wQQQx/USDC, fee 500. Verified onchain (token0=wQQQx, token1=USDC).
		poolAddress: "0x2bd90724ffc80ba22ec7af8cfd2b4b51ff395b04",
		enabled: true,
	},
	{
		symbol: "wNVDAx",
		name: "Nvidia",
		address: "0xa8ddb5cd96b5222afe198316e9a57caa642850d5",
		decimals: 18,
		assetType: "single_stock",
		haircut: 0.5,
		settlementStablecoin: "USDG",
		// Uniswap V3 USDG/wNVDAx, fee 500. Verified onchain (token0=USDG, token1=wNVDAx).
		poolAddress: "0x2a2b11730c2b6d99a58034a869dd810d7300a7b2",
		enabled: true,
	},
	{
		symbol: "wGOOGLx",
		name: "Alphabet",
		address: "0xf8c5308f80e459bb53d9ebe689854d9cbb2caa6f",
		decimals: 18,
		assetType: "single_stock",
		haircut: 0.5,
		settlementStablecoin: "USDC",
		// Uniswap V3 USDC/wGOOGLx, fee 500. Verified onchain (token0=USDC, token1=wGOOGLx).
		poolAddress: "0x9f6273e2669cd812e76788b698374c43637c87c2",
		enabled: true,
	},
	{
		symbol: "wAAPLx",
		name: "Apple",
		address: "0x943bf64d566c32a2bcd41ac92fb63c111cc9de8f",
		decimals: 18,
		assetType: "single_stock",
		haircut: 0.5,
		settlementStablecoin: "USDG",
		// Uniswap V3 USDG/wAAPLx, fee 500. Verified onchain (token0=USDG, token1=wAAPLx).
		poolAddress: "0xc44bd9c8589026d28d1632d7b86b2efb6cdc8fd2",
		enabled: true,
	},
];

export function getSupportedAssets(): Asset[] {
	return MVP_ASSETS.filter((a) => a.enabled);
}

export function getAsset(symbol: string): Asset | undefined {
	return MVP_ASSETS.find((a) => a.symbol === symbol);
}

export function isAssetEligible(symbol: string): boolean {
	return getAsset(symbol)?.enabled ?? false;
}
