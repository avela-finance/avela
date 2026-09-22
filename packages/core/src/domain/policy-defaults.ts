import type { FundingSource, MinimumBalance, PriceFloor } from "./spending-policy.js";

export const DEFAULT_POLICY = {
	dailyLimit: 500,
	approvalThreshold: 100,
	priceFloors: [] as PriceFloor[],
	minimumBalances: [] as MinimumBalance[],
	fundingPriority: ["spending_power", "stablecoin_balance"] as FundingSource[],
	enabled: true,
} as const;
