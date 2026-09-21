import type { PublicClient } from "viem";
import type { PriceResult } from "../domain/types.js";
import type { PriceFeedAdapter } from "./price-feed.js";

const UNISWAP_V3_POOL_ABI = [
	{
		inputs: [],
		name: "slot0",
		outputs: [
			{ internalType: "uint160", name: "sqrtPriceX96", type: "uint160" },
			{ internalType: "int24", name: "tick", type: "int24" },
			{ internalType: "uint16", name: "observationIndex", type: "uint16" },
			{ internalType: "uint16", name: "observationCardinality", type: "uint16" },
			{ internalType: "uint16", name: "observationCardinalityNext", type: "uint16" },
			{ internalType: "uint8", name: "feeProtocol", type: "uint8" },
			{ internalType: "bool", name: "unlocked", type: "bool" },
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "token0",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "token1",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
] as const;

// Mapping: asset address → pool address. Populated at runtime or by config.
type PoolConfig = {
	poolAddress: `0x${string}`;
	stablecoinDecimals: number;
	assetDecimals: number;
};

export function createUniswapTwapAdapter(
	client: PublicClient,
	poolMap: Record<string, PoolConfig>,
): PriceFeedAdapter {
	return {
		async getPrice(assetAddress: string, _chainId: number): Promise<PriceResult> {
			const config = poolMap[assetAddress.toLowerCase()];
			if (!config) {
				throw new Error(`No pool configured for asset ${assetAddress}`);
			}

			const [slot0Result, token0] = await Promise.all([
				client.readContract({
					address: config.poolAddress,
					abi: UNISWAP_V3_POOL_ABI,
					functionName: "slot0",
				}),
				client.readContract({
					address: config.poolAddress,
					abi: UNISWAP_V3_POOL_ABI,
					functionName: "token0",
				}),
			]);

			const sqrtPriceX96 = slot0Result[0];
			const isToken0 = token0.toLowerCase() === assetAddress.toLowerCase();

			// sqrtPriceX96 = sqrt(price) * 2^96
			// price = (sqrtPriceX96 / 2^96)^2 adjusted for decimal difference
			const sqrtPrice = Number(sqrtPriceX96) / 2 ** 96;
			let price = sqrtPrice * sqrtPrice;

			// Adjust for decimal difference between token0 and token1
			const decimalDiff = config.assetDecimals - config.stablecoinDecimals;
			price = price * 10 ** decimalDiff;

			// If asset is token1, invert the price
			if (!isToken0) {
				price = 1 / price;
			}

			return {
				price,
				source: "uniswap_twap",
				confidence: 0.9,
				timestamp: new Date(),
			};
		},
	};
}
