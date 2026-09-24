import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { createWhatsAppLinkRoutes } from "../whatsapp.js";

function makeApp(linkAccount: ReturnType<typeof vi.fn>) {
	const app = new Hono<{ Variables: { accountId?: string } }>();
	app.use("*", async (c, next) => {
		c.set("accountId", "01JACCOUNT000000000000001");
		await next();
	});
	app.route("/integrations/whatsapp", createWhatsAppLinkRoutes({ linkAccount }));
	return app;
}

describe("POST /integrations/whatsapp/link", () => {
	it("links a phone number and returns 201", async () => {
		const linkAccount = vi.fn().mockResolvedValue({ phoneNumber: "+15551234567" });
		const app = makeApp(linkAccount);

		const res = await app.request("/integrations/whatsapp/link", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ phoneNumber: "+15551234567" }),
		});
		expect(res.status).toBe(201);
		expect(linkAccount).toHaveBeenCalledWith("01JACCOUNT000000000000001", "+15551234567");
	});

	it("returns 400 for invalid phone numbers", async () => {
		const linkAccount = vi.fn();
		const app = makeApp(linkAccount);

		const res = await app.request("/integrations/whatsapp/link", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ phoneNumber: "not-a-number" }),
		});
		expect(res.status).toBe(400);
		expect(linkAccount).not.toHaveBeenCalled();
	});
});
