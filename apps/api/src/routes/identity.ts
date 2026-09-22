import { Hono } from "hono";
import { z } from "zod";
import type { Identity } from "@avela/core";

const registerSchema = z.object({
	accountId: z.string().min(1),
	username: z.string().min(3).max(32),
	displayName: z.string().optional(),
});

export type IdentityDeps = {
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
	const app = new Hono();

	app.post("/register", async (c) => {
		let body: unknown;
		try {
			body = await c.req.json();
		} catch {
			return c.json(
				{ error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
				400,
			);
		}

		const parsed = registerSchema.safeParse(body);
		if (!parsed.success) {
			return c.json(
				{ error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
				400,
			);
		}

		try {
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
		const available = await deps.isUsernameAvailable(username);
		return c.json({ data: { username, available } });
	});

	app.get("/resolve/:username", async (c) => {
		const username = c.req.param("username");
		const result = await deps.resolveUsername(username);
		if (!result) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: `Username "${username}" not found` } },
				404,
			);
		}
		return c.json({ data: result });
	});

	return app;
}
