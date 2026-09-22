import { ulid } from "ulidx";
import { keccak256, toHex } from "viem";
import { getAsset } from "./asset.js";
import type { FundingDecision } from "./payment-intent.js";
import type { SpendingPower } from "./types.js";

export function generatePaymentId(): string {
	return keccak256(toHex(ulid()));
}

export function selectFundingSource(params: {
	amount: number;
	spendingPower: SpendingPower;
}): FundingDecision {
	const { amount, spendingPower } = params;
	const paymentId = generatePaymentId();

	const eligible = spendingPower.perAsset
		.filter((a) => a.spendingPower >= amount)
		.filter((a) => getAsset(a.assetSymbol) !== undefined);

	if (eligible.length > 0) {
		const selected = eligible.sort((a, b) => b.spendingPower - a.spendingPower)[0]!;
		const asset = getAsset(selected.assetSymbol)!;

		return {
			source: "spending_power",
			collateralAsset: selected.assetSymbol,
			collateralVerified: false,
			collateralAmount: null,
			settlementToken: asset.settlementStablecoin,
			paymentId,
			spendingPowerAtDecision: spendingPower.totalSpendingPower,
			decidedAt: new Date(),
		};
	}

	if (spendingPower.stablecoinBalance >= amount) {
		return {
			source: "stablecoin_balance",
			collateralAsset: null,
			collateralVerified: false,
			collateralAmount: null,
			settlementToken: "USDG",
			paymentId,
			spendingPowerAtDecision: spendingPower.totalSpendingPower,
			decidedAt: new Date(),
		};
	}

	throw new Error("Insufficient funds: neither spending power nor stablecoin balance covers the payment");
}
