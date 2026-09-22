import type { Asset, SettlementStablecoin } from "./types.js";

export const STABLECOINS: Record<SettlementStablecoin, string> = {
	USDG: "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
	USDC: "0xb6ceceab302e2e4948951ee7843fc24e92933061",
} as const;

export const STABLECOIN_DECIMALS: Record<SettlementStablecoin, number> = {
	USDG: 18,
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
		poolAddress: "0x0000000000000000000000000000000000000000", // TODO: verify exact Uniswap V3 pool address
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
		poolAddress: "0x0000000000000000000000000000000000000000", // TODO: verify exact Uniswap V3 pool address
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
		poolAddress: "0x0000000000000000000000000000000000000000", // TODO: verify exact Uniswap V3 pool address
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
		poolAddress: "0x0000000000000000000000000000000000000000", // TODO: verify exact Uniswap V3 pool address
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
		poolAddress: "0x0000000000000000000000000000000000000000", // TODO: verify exact Uniswap V3 pool address
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
