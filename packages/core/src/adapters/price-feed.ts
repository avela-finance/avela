import type { PriceResult } from "../domain/types.js";

export interface PriceFeedAdapter {
	getPrice(assetAddress: string, chainId: number): Promise<PriceResult>;
}
