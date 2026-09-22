import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { createWebhookRoutes } from "../webhook.js";

describe("WhatsApp webhook", () => {
	const app = new Hono();
	app.route(
		"/webhooks/whatsapp",
		createWebhookRoutes({
			verifyToken: "test-verify-token",
			onTextMessage: async () => {},
			onButtonReply: async () => {},
		}),
	);

	it("GET verifies the webhook with correct token", async () => {
		const res = await app.request(
			"/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=challenge123",
		);
		expect(res.status).toBe(200);
		const text = await res.text();
		expect(text).toBe("challenge123");
	});

	it("GET rejects incorrect verify token", async () => {
		const res = await app.request(
			"/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=challenge123",
		);
		expect(res.status).toBe(403);
	});

	it("POST returns 200 for valid webhook payload", async () => {
		const payload = {
			object: "whatsapp_business_account",
			entry: [
				{
					id: "BIZ_ID",
					changes: [
						{
							value: {
								messaging_product: "whatsapp",
								metadata: {
									display_phone_number: "+1555000000",
									phone_number_id: "PHONE_ID",
								},
								messages: [
									{
										from: "1234567890",
										id: "wamid.test",
										timestamp: "1234567890",
										type: "text",
										text: { body: "balance" },
									},
								],
							},
							field: "messages",
						},
					],
				},
			],
		};
		const res = await app.request("/webhooks/whatsapp", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		expect(res.status).toBe(200);
	});
});
