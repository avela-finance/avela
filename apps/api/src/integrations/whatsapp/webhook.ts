import { Hono } from "hono";
import type { WhatsAppWebhookEntry } from "./types.js";

export type WebhookHandlers = {
	verifyToken: string;
	onTextMessage: (from: string, text: string) => Promise<void>;
	onButtonReply: (from: string, buttonId: string) => Promise<void>;
};

export function createWebhookRoutes(handlers: WebhookHandlers): Hono {
	const app = new Hono();

	app.get("/", (c) => {
		const mode = c.req.query("hub.mode");
		const token = c.req.query("hub.verify_token");
		const challenge = c.req.query("hub.challenge");

		if (mode === "subscribe" && token === handlers.verifyToken) {
			return c.text(challenge ?? "", 200);
		}
		return c.text("Forbidden", 403);
	});

	app.post("/", async (c) => {
		const body = await c.req.json<{ object: string; entry: WhatsAppWebhookEntry[] }>();

		if (body.object !== "whatsapp_business_account") {
			return c.text("Not Found", 404);
		}

		for (const entry of body.entry) {
			for (const change of entry.changes) {
				const messages = change.value.messages ?? [];
				for (const msg of messages) {
					if (msg.type === "text" && msg.text) {
						await handlers.onTextMessage(msg.from, msg.text.body);
					} else if (
						msg.type === "interactive" &&
						msg.interactive?.type === "button_reply"
					) {
						await handlers.onButtonReply(msg.from, msg.interactive.button_reply.id);
					}
				}
			}
		}

		return c.text("OK", 200);
	});

	return app;
}
