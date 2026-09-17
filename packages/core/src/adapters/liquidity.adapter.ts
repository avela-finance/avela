export interface QuoteParams {
	fromAsset: string;
	toAsset: string;
	amount: string;
	fromChainId: number;
	toChainId: number;
	slippageTolerance: string;
}

export interface Quote {
	fromAsset: string;
	toAsset: string;
	amountIn: string;
	expectedOut: string;
	route: string;
	provider: string;
	expiresAt: Date;
	priceImpact: string;
}

export interface SwapResult {
	txHash: string;
	actualOut: string;
}

export interface LiquidityAdapter {
	getQuote(params: QuoteParams): Promise<Quote>;
	executeSwap(quote: Quote): Promise<SwapResult>;
}
