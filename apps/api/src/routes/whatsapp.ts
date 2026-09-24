import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "../index.js";
import { resolveAccountId } from "../middleware/account.js";

const linkSchema = z.object({
	phoneNumber: z.string().regex(/^\+[1-9]\d{6,14}$/, "Must be E.164 format (e.g. +15551234567)"),
});

type WhatsAppLinkDeps = {
	linkAccount: (accountId: string, phoneNumber: string) => Promise<{ phoneNumber: string }>;
};

export function createWhatsAppLinkRoutes(deps: WhatsAppLinkDeps) {
	const app = new Hono<{ Variables: AppVariables }>();

	app.post("/link", async (c) => {
		const accountId = resolveAccountId(c);
		const body = await c.req.json();
		const parsed = linkSchema.safeParse(body);
		if (!parsed.success) {
			return c.json(
				{
					error: {
						code: "VALIDATION_ERROR",
						message: "Invalid link request",
						details: parsed.error.flatten(),
					},
				},
				400,
			);
		}

		try {
			const link = await deps.linkAccount(accountId, parsed.data.phoneNumber);
			return c.json({ data: link }, 201);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Link failed";
			return c.json({ error: { code: "LINK_FAILED", message } }, 400);
		}
	});

	return app;
}
