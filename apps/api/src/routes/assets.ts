import { getAsset, getSupportedAssets } from "@avela/core";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppVariables } from "../index.js";

export const assetRoutes = new Hono<{ Variables: AppVariables }>();

assetRoutes.get("/", (c) => {
	const assets = getSupportedAssets();
	return c.json({
		data: assets,
		meta: {
			requestId: c.get("requestId"),
			timestamp: new Date().toISOString(),
		},
	});
});

assetRoutes.get("/:symbol/price", async (c) => {
	const symbol = c.req.param("symbol");
	const asset = getAsset(symbol);

	if (!asset) {
		throw new HTTPException(404, { message: `Asset ${symbol} not found` });
	}

	// TODO: wire up price feed adapter when ready
	return c.json({
		data: {
			symbol: asset.symbol,
			name: asset.name,
			address: asset.address,
			price: null,
			source: "not_configured",
			message: "Price feed placeholder — wire Uniswap TWAP in next phase",
		},
		meta: {
			requestId: c.get("requestId"),
			timestamp: new Date().toISOString(),
		},
	});
});
