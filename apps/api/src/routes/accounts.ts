import type { Account } from "@avela/core";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppVariables } from "../index.js";
import { resolveAccountId } from "../middleware/account.js";

const createAccountSchema = z.object({
	walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
});

type AccountDeps = {
	createAccount: (walletAddress: string) => Promise<Account>;
	getAccount: (id: string) => Promise<Account | null>;
	getAccountByWallet: (walletAddress: string) => Promise<Account | null>;
};

export function createAccountRoutes(deps: AccountDeps) {
	const app = new Hono<{ Variables: AppVariables }>();

	// Auth + account context are applied at mount (see index.ts).

	app.post("/", async (c) => {
		const body = await c.req.json();
		const parsed = createAccountSchema.parse(body);

		const existing = await deps.getAccountByWallet(parsed.walletAddress);
		if (existing) {
			return c.json(
				{
					data: existing,
					meta: {
						requestId: c.get("requestId"),
						timestamp: new Date().toISOString(),
					},
				},
				200,
			);
		}

		const account = await deps.createAccount(parsed.walletAddress);
		return c.json(
			{
				data: account,
				meta: {
					requestId: c.get("requestId"),
					timestamp: new Date().toISOString(),
				},
			},
			201,
		);
	});

	app.get("/:id", async (c) => {
		const id = resolveAccountId(c, c.req.param("id"));
		const account = await deps.getAccount(id);

		if (!account) {
			throw new HTTPException(404, { message: "Account not found" });
		}

		return c.json({
			data: account,
			meta: {
				requestId: c.get("requestId"),
				timestamp: new Date().toISOString(),
			},
		});
	});

	return app;
}
