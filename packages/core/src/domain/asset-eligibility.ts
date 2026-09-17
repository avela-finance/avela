// packages/core/src/domain/asset-eligibility.ts
const STABLECOINS = new Set(["USDC"]);
const SUPPORTED_STOCKS = new Set(["xAAPL", "xTSLA", "xGOOG", "xAMZN", "xMSFT"]);

export function isAssetEligible(
	asset: string,
	hasPrice: boolean,
	policyAllowsConversion: boolean,
): { eligible: boolean; reason: string } {
	if (STABLECOINS.has(asset)) {
		return { eligible: true, reason: "stablecoin" };
	}

	if (!SUPPORTED_STOCKS.has(asset)) {
		return { eligible: false, reason: `unsupported asset: ${asset}` };
	}

	if (!hasPrice) {
		return { eligible: false, reason: `no price data for ${asset}` };
	}

	if (!policyAllowsConversion) {
		return { eligible: false, reason: `policy disallows conversion for ${asset}` };
	}

	return { eligible: true, reason: "eligible stock" };
}
