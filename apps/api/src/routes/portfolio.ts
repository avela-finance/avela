import type { Position, SpendingPower } from "@avela/core";
import { Hono } from "hono";
import type { AppVariables } from "../index.js";
import { authMiddleware } from "../middleware/auth.js";

type PortfolioDeps = {
	getPortfolio: (accountId: string) => Promise<Position[]>;
	calculateSpendingPower: (accountId: string) => Promise<SpendingPower>;
};

export function createPortfolioRoutes(deps: PortfolioDeps) {
	const app = new Hono<{ Variables: AppVariables }>();

	app.use("*", authMiddleware);

	app.get("/", async (c) => {
		const accountId = c.req.param("id") as string;

		const [positions, spendingPower] = await Promise.all([
			deps.getPortfolio(accountId),
			deps.calculateSpendingPower(accountId),
		]);

		return c.json({
			data: {
				accountId,
				positions: positions.map((p) => ({ ...p, amount: p.amount.toString() })),
				spendingPower,
			},
			meta: {
				requestId: c.get("requestId"),
				timestamp: new Date().toISOString(),
			},
		});
	});

	return app;
}
