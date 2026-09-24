import type { Position, SpendingPower } from "@avela/core";
import { Hono } from "hono";
import type { AppVariables } from "../index.js";
import { resolveAccountId } from "../middleware/account.js";

type PortfolioDeps = {
	getPortfolio: (accountId: string) => Promise<Position[]>;
	calculateSpendingPower: (accountId: string) => Promise<SpendingPower>;
};

export function createPortfolioRoutes(deps: PortfolioDeps) {
	const app = new Hono<{ Variables: AppVariables }>();

	// Auth + account context are applied at mount (see index.ts).
	// The `:id` param also accepts the literal "me" (used by apps/web).

	app.get("/", async (c) => {
		const accountId = resolveAccountId(c, c.req.param("id") as string);

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
