import type { Identity } from "@avela/core";
import { validateUsername } from "@avela/core";
import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "../index.js";
import { resolveAccountId } from "../middleware/account.js";

const registerSchema = z.object({
	accountId: z.string().min(1),
	username: z.string().min(3).max(32),
	displayName: z.string().optional(),
});

export type IdentityDeps = {
	getIdentityByAccount: (accountId: string) => Promise<Identity | null>;
	registerUsername: (
		accountId: string,
		username: string,
		displayName?: string,
	) => Promise<Identity>;
	resolveUsername: (
		username: string,
	) => Promise<{ accountId: string; walletAddress: string } | null>;
	isUsernameAvailable: (username: string) => Promise<boolean>;
};

export function createIdentityRoutes(deps: IdentityDeps) {
	const app = new Hono<{ Variables: AppVariables }>();

	// Authenticated caller's own identity (requires auth middleware at mount).
	app.get("/me", async (c) => {
		const accountId = resolveAccountId(c);
		const identity = await deps.getIdentityByAccount(accountId);
		return c.json({ data: { username: identity?.username ?? null } });
	});

	app.post("/register", async (c) => {
		let body: unknown;
		try {
			body = await c.req.json();
		} catch {
			return c.json({ error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } }, 400);
		}

		const parsed = registerSchema.safeParse(body);
		if (!parsed.success) {
			return c.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, 400);
		}

		try {
			// TODO(auth): Replace body.accountId with authenticated user's accountId from Privy session
			const identity = await deps.registerUsername(
				parsed.data.accountId,
				parsed.data.username,
				parsed.data.displayName,
			);
			return c.json({ data: identity }, 201);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Registration failed";
			return c.json({ error: { code: "REGISTRATION_FAILED", message } }, 400);
		}
	});

	app.get("/available/:username", async (c) => {
		const username = c.req.param("username");
		const validation = validateUsername(username);
		if (!validation.valid) {
			return c.json({ error: { code: "INVALID_USERNAME", message: validation.error } }, 400);
		}
		const available = await deps.isUsernameAvailable(username);
		return c.json({ data: { username, available } });
	});

	app.get("/resolve/:username", async (c) => {
		const username = c.req.param("username");
		const validation = validateUsername(username);
		if (!validation.valid) {
			return c.json({ error: { code: "INVALID_USERNAME", message: validation.error } }, 400);
		}
		const result = await deps.resolveUsername(username);
		if (!result) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: `Username "${username}" not found` } },
				404,
			);
		}
		return c.json({ data: { username, walletAddress: result.walletAddress } });
	});

	return app;
}
