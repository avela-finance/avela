export type AccountStatus = "active" | "frozen" | "closed";

export type Account = {
	id: string;
	walletAddress: string;
	username: string | null;
	status: AccountStatus;
	createdAt: Date;
	updatedAt: Date;
};

export type AssetType = "index" | "single_stock";
export type SettlementStablecoin = "USDG" | "USDC";

export type Asset = {
	symbol: string;
	name: string;
	address: string;
	decimals: number;
	assetType: AssetType;
	haircut: number;
	settlementStablecoin: SettlementStablecoin;
	poolAddress: string;
	enabled: boolean;
};

export type Position = {
	id: string;
	accountId: string;
	assetSymbol: string;
	amount: bigint;
	depositTxHash: string;
	createdAt: Date;
	updatedAt: Date;
};

export type StablecoinBalance = {
	id: string;
	accountId: string;
	stablecoin: SettlementStablecoin;
	amount: bigint;
	updatedAt: Date;
};

export type SpendingPowerBreakdown = {
	assetSymbol: string;
	positionValue: number;
	haircut: number;
	spendingPower: number;
};

export type SpendingPower = {
	accountId: string;
	perAsset: SpendingPowerBreakdown[];
	stablecoinBalance: number;
	totalSpendingPower: number;
	calculatedAt: Date;
};

export type PriceResult = {
	price: number;
	source: string;
	confidence: number;
	timestamp: Date;
};
