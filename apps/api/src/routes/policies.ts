import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "../index.js";
import { resolveAccountId } from "../middleware/account.js";

const updatePolicySchema = z.object({
	dailyLimit: z.number().positive().nullable().optional(),
	approvalThreshold: z.number().positive().nullable().optional(),
	priceFloors: z
		.array(
			z.object({
				assetSymbol: z.string(),
				floorPrice: z.number().positive(),
			}),
		)
		.optional(),
	minimumBalances: z
		.array(
			z.object({
				assetSymbol: z.string(),
				minimumAmount: z.string(),
			}),
		)
		.optional(),
	fundingPriority: z
		.array(z.enum(["spending_power", "stablecoin_balance"]))
		.min(1)
		.optional(),
	enabled: z.boolean().optional(),
});

type PolicyDeps = {
	getPolicy: (accountId: string) => Promise<unknown | null>;
	updatePolicy: (accountId: string, updates: unknown) => Promise<unknown>;
	getDailySpending: (
		accountId: string,
		policy: unknown,
	) => Promise<{ total: number; limit: number | null; remaining: number | null }>;
};

export function policiesRoutes(deps: PolicyDeps) {
	const app = new Hono<{ Variables: AppVariables }>();

	app.get("/", async (c) => {
		const accountId = resolveAccountId(c, c.req.param("accountId"));
		const policy = await deps.getPolicy(accountId);

		if (!policy) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "No policy found for this account" } },
				404,
			);
		}

		const dailySpending = await deps.getDailySpending(accountId, policy);
		return c.json({ data: { policy, dailySpending } });
	});

	app.put("/", async (c) => {
		const accountId = resolveAccountId(c, c.req.param("accountId"));
		const body = await c.req.json();
		const parsed = updatePolicySchema.safeParse(body);

		if (!parsed.success) {
			return c.json(
				{
					error: {
						code: "VALIDATION_ERROR",
						message: "Invalid policy update",
						details: parsed.error.flatten(),
					},
				},
				400,
			);
		}

		const updated = await deps.updatePolicy(accountId, parsed.data);
		return c.json({ data: updated });
	});

	return app;
}
