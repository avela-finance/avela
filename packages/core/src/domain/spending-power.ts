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

	const perAsset: SpendingPowerBreakdown[] = [];

	for (const position of positions) {
		const asset = getAsset(position.assetSymbol);
		if (!asset) continue;

		const priceResult = await priceFeed.getPrice(asset.address, 196);
		const breakdown = computeAssetSpendingPower(
			position.amount,
			asset.decimals,
			priceResult.price,
			asset.haircut,
		);

		perAsset.push({
			assetSymbol: position.assetSymbol,
			...breakdown,
		});
	}

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
