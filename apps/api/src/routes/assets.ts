import type { Asset } from "@avela/core";
import { getAsset, getSupportedAssets } from "@avela/core";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppVariables } from "../index.js";

type AssetDeps = {
	getPrice: (
		asset: Asset,
	) => Promise<{ price: number; source: string; confidence: number; timestamp: Date }>;
};

export function createAssetRoutes(deps: AssetDeps) {
	const app = new Hono<{ Variables: AppVariables }>();

	app.get("/", (c) => {
		const assets = getSupportedAssets();
		return c.json({
			data: assets,
			meta: {
				requestId: c.get("requestId"),
				timestamp: new Date().toISOString(),
			},
		});
	});

	app.get("/:symbol/price", async (c) => {
		const symbol = c.req.param("symbol");
		const asset = getAsset(symbol);

		if (!asset) {
			throw new HTTPException(404, { message: `Asset ${symbol} not found` });
		}

		try {
			const quote = await deps.getPrice(asset);
			return c.json({
				data: {
					symbol: asset.symbol,
					name: asset.name,
					address: asset.address,
					price: quote.price,
					source: quote.source,
					confidence: quote.confidence,
					timestamp: quote.timestamp,
				},
				meta: {
					requestId: c.get("requestId"),
					timestamp: new Date().toISOString(),
				},
			});
		} catch {
			throw new HTTPException(503, {
				message: `Price unavailable for ${symbol} — pool read failed`,
			});
		}
	});

	return app;
}
