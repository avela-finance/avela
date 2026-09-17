export interface PriceData {
	priceUsd: string;
	timestamp: Date;
	source: string;
}

export interface PriceAdapter {
	getPrice(asset: string): Promise<PriceData>;
}
