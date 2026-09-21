import type { PriceFeedAdapter } from "../adapters/price-feed.js";
import type { Database } from "../db/client.js";
import { getAsset } from "./asset.js";
import { getPortfolio } from "./position.js";
import type { SpendingPower, SpendingPowerBreakdown } from "./types.js";

export function computeAssetSpendingPower(
	amount: bigint,
	decimals: number,
	price: number,
	haircut: number,
): Omit<SpendingPowerBreakdown, "assetSymbol"> {
	// TODO: bigint-safe arithmetic for amounts above ~9 tokens (Number.MAX_SAFE_INTEGER at 18 decimals)
	const tokenAmount = Number(amount) / 10 ** decimals;
	const positionValue = tokenAmount * price;
	const spendingPower = positionValue * (1 - haircut);

	return {
		positionValue,
		haircut,
		spendingPower,
	};
}

export async function calculateSpendingPower(
	db: Database,
	priceFeed: PriceFeedAdapter,
	accountId: string,
): Promise<SpendingPower> {
	const positions = await getPortfolio(db, accountId);

	const breakdowns = await Promise.all(
		positions.map(async (position) => {
			const asset = getAsset(position.assetSymbol);
			if (!asset) return null;

			const priceResult = await priceFeed.getPrice(asset.address, 196);
			const breakdown = computeAssetSpendingPower(
				position.amount,
				asset.decimals,
				priceResult.price,
				asset.haircut,
			);

			return {
				assetSymbol: position.assetSymbol,
				...breakdown,
			};
		}),
	);

	const perAsset: SpendingPowerBreakdown[] = breakdowns.filter(
		(b): b is SpendingPowerBreakdown => b !== null,
	);

	// TODO: add stablecoin balances (query stablecoinBalancesTable)
	const stablecoinBalance = 0;

	const totalSpendingPower =
		perAsset.reduce((sum, a) => sum + a.spendingPower, 0) + stablecoinBalance;

	return {
		accountId,
		perAsset,
		stablecoinBalance,
		totalSpendingPower,
		calculatedAt: new Date(),
	};
}
