import { eq } from "drizzle-orm";
import type { PriceFeedAdapter } from "../adapters/price-feed.js";
import type { Database } from "../db/client.js";
import { stablecoinBalancesTable } from "../db/schema.js";
import { getAsset, STABLECOIN_DECIMALS } from "./asset.js";
import { getPortfolio } from "./position.js";
import type { SettlementStablecoin, SpendingPower, SpendingPowerBreakdown } from "./types.js";

function isSettlementStablecoin(value: string): value is SettlementStablecoin {
	return value === "USDG" || value === "USDC";
}

export function computeAssetSpendingPower(
	amount: bigint,
	decimals: number,
	price: number,
	haircut: number,
): Omit<SpendingPowerBreakdown, "assetSymbol"> {
	// Bigint-safe: split into whole tokens + 6dp fraction so neither
	// Number() conversion exceeds MAX_SAFE_INTEGER for realistic balances.
	const base = 10n ** BigInt(decimals);
	const whole = amount / base;
	const fracScale = 10n ** BigInt(Math.max(decimals - 6, 0));
	const fracDp = Math.min(decimals, 6);
	const tokenAmount = Number(whole) + Number((amount % base) / fracScale) / 10 ** fracDp;
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

	const stablecoinRows = await db
		.select()
		.from(stablecoinBalancesTable)
		.where(eq(stablecoinBalancesTable.accountId, accountId));

	const stablecoinBalance = stablecoinRows.reduce((sum, row) => {
		if (!isSettlementStablecoin(row.stablecoin)) return sum;
		const decimals = STABLECOIN_DECIMALS[row.stablecoin];
		return sum + Number(row.amount) / 10 ** decimals;
	}, 0);

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
