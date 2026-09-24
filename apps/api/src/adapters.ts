import {
	createDb,
	createRouterAdapter,
	createUniswapTwapAdapter,
	createVaultAdapter,
	createXLayerClient,
	getSupportedAssets,
	STABLECOIN_DECIMALS,
	xlayer,
} from "@avela/core";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { Env } from "./env.js";

export type AppAdapters = {
	db: ReturnType<typeof createDb>;
	vaultAdapter: ReturnType<typeof createVaultAdapter>;
	routerAdapter: ReturnType<typeof createRouterAdapter>;
	priceFeed: ReturnType<typeof createUniswapTwapAdapter>;
};

/**
 * Build all onchain + DB adapters from validated env.
 * Pool map is derived from the asset registry — poolAddress values
 * are verified Uniswap V3 pools on X Layer (see docs/ideas/SPEC.md §4.8).
 */
export function createAdapters(env: Env): AppAdapters {
	const db = createDb(env.DATABASE_URL);

	const publicClient = createXLayerClient(env.XLAYER_RPC_URL);
	const account = privateKeyToAccount(env.SIGNER_PRIVATE_KEY as `0x${string}`);
	const walletClient = createWalletClient({
		account,
		chain: xlayer,
		transport: http(env.XLAYER_RPC_URL),
	});

	const vaultAdapter = createVaultAdapter(publicClient, env.AVELA_VAULT_ADDRESS);
	const routerAdapter = createRouterAdapter(publicClient, walletClient, env.AVELA_ROUTER_ADDRESS);

	const poolMap: Record<
		string,
		{ poolAddress: `0x${string}`; stablecoinDecimals: number; assetDecimals: number }
	> = {};
	for (const asset of getSupportedAssets()) {
		poolMap[asset.address.toLowerCase()] = {
			poolAddress: asset.poolAddress as `0x${string}`,
			stablecoinDecimals: STABLECOIN_DECIMALS[asset.settlementStablecoin],
			assetDecimals: asset.decimals,
		};
	}
	const priceFeed = createUniswapTwapAdapter(publicClient, poolMap);

	return { db, vaultAdapter, routerAdapter, priceFeed };
}
