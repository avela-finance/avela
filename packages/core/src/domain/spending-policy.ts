export type FundingSource = "spending_power" | "stablecoin_balance";

export type PriceFloor = {
	assetSymbol: string;
	floorPrice: number;
};

export type MinimumBalance = {
	assetSymbol: string;
	minimumAmount: string;
};

export type SpendingPolicy = {
	id: string;
	accountId: string;
	dailyLimit: number | null;
	approvalThreshold: number | null;
	priceFloors: PriceFloor[];
	minimumBalances: MinimumBalance[];
	fundingPriority: FundingSource[];
	enabled: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export type PolicyViolation = {
	rule: string;
	message: string;
	currentValue: number;
	threshold: number;
};

export type PolicyCheckResult = {
	passed: boolean;
	requiresApproval: boolean;
	violations: PolicyViolation[];
};
