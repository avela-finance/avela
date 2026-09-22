import { Hono } from "hono";
import type { AppVariables } from "../index.js";
import { authMiddleware } from "../middleware/auth.js";

export const portfolioRoutes = new Hono<{ Variables: AppVariables }>();

portfolioRoutes.use("*", authMiddleware);

portfolioRoutes.get("/", async (c) => {
	const accountId = c.req.param("id");

	// TODO: wire up DB + price feed
	// const db = getDb();
	// const positions = await getPortfolio(db, accountId);
	// const spendingPower = await calculateSpendingPower(db, priceFeed, accountId);

	return c.json({
		data: {
			accountId,
			positions: [],
			spendingPower: {
				perAsset: [],
				stablecoinBalance: 0,
				totalSpendingPower: 0,
				calculatedAt: new Date().toISOString(),
			},
			message: "Portfolio placeholder — wire DB in next phase",
		},
		meta: {
			requestId: c.get("requestId"),
			timestamp: new Date().toISOString(),
		},
	});
});
