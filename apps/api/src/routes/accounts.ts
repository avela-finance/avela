import type { Account, Position } from "@avela/core";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import type { AppVariables } from "../index.js";
import { resolveAccountId } from "../middleware/account.js";

const createAccountSchema = z.object({
	walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
});

const depositPlanSchema = z.object({
	assetSymbol: z.string().min(1),
	amountRaw: z.string().regex(/^[1-9]\d*$/, "amountRaw must be a positive integer string"),
});

const depositConfirmSchema = depositPlanSchema.extend({
	txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
});

export type DepositPlan = {
	accountId: string;
	assetSymbol: string;
	token: string;
	vault: string;
	amountRaw: string;
	amountDecimals: number;
	whitelisted: boolean;
	approve: { to: string; data: string };
	deposit: { to: string; data: string };
};

type AccountDeps = {
	createAccount: (walletAddress: string) => Promise<Account>;
	getAccount: (id: string) => Promise<Account | null>;
	getAccountByWallet: (walletAddress: string) => Promise<Account | null>;
	prepareDeposit: (params: {
		accountId: string;
		assetSymbol: string;
		amountRaw: string;
	}) => Promise<DepositPlan>;
	confirmDeposit: (params: {
		accountId: string;
		assetSymbol: string;
		amountRaw: string;
		txHash: string;
	}) => Promise<Position>;
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

	// Deposit plan: backend-encoded approve + deposit calldata for the
	// frontend to sign with the user's Privy embedded wallet.
	app.post("/:id/deposit", async (c) => {
		const accountId = resolveAccountId(c, c.req.param("id"));
		const body = await c.req.json();
		const parsed = depositPlanSchema.safeParse(body);
		if (!parsed.success) {
			return c.json(
				{
					error: {
						code: "VALIDATION_ERROR",
						message: "Invalid deposit request",
						details: parsed.error.flatten(),
					},
				},
				400,
			);
		}

		try {
			const plan = await deps.prepareDeposit({ accountId, ...parsed.data });
			return c.json({ data: plan }, 200);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error";
			if (message.includes("Unknown asset")) {
				throw new HTTPException(404, { message });
			}
			throw err;
		}
	});

	// Deposit confirm: record the position after on-chain confirmation.
	app.post("/:id/deposit/confirm", async (c) => {
		const accountId = resolveAccountId(c, c.req.param("id"));
		const body = await c.req.json();
		const parsed = depositConfirmSchema.safeParse(body);
		if (!parsed.success) {
			return c.json(
				{
					error: {
						code: "VALIDATION_ERROR",
						message: "Invalid deposit confirmation",
						details: parsed.error.flatten(),
					},
				},
				400,
			);
		}

		const position = await deps.confirmDeposit({ accountId, ...parsed.data });
		return c.json(
			{
				data: { ...position, amount: position.amount.toString() },
				meta: {
					requestId: c.get("requestId"),
					timestamp: new Date().toISOString(),
				},
			},
			201,
		);
	});

	return app;
}
