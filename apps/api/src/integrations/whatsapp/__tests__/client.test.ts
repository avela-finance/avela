import { describe, expect, it } from "vitest";
import { createWhatsAppClient } from "../client.js";

describe("WhatsAppClient", () => {
	it("creates a client with required config", () => {
		const client = createWhatsAppClient({
			phoneNumberId: "123456789",
			accessToken: "test-token",
			verifyToken: "test-verify",
		});
		expect(client).toBeDefined();
		expect(client.sendTextMessage).toBeTypeOf("function");
		expect(client.sendInteractiveButtons).toBeTypeOf("function");
		expect(client.sendTemplate).toBeTypeOf("function");
	});

	it("buildTextPayload creates correct structure", () => {
		const client = createWhatsAppClient({
			phoneNumberId: "123456789",
			accessToken: "test-token",
			verifyToken: "test-verify",
		});
		const payload = client.buildTextPayload("+1234567890", "Hello");
		expect(payload).toEqual({
			messaging_product: "whatsapp",
			to: "+1234567890",
			type: "text",
			text: { body: "Hello" },
		});
	});

	it("buildInteractivePayload creates buttons", () => {
		const client = createWhatsAppClient({
			phoneNumberId: "123456789",
			accessToken: "test-token",
			verifyToken: "test-verify",
		});
		const payload = client.buildInteractivePayload("+1234567890", "Approve payment?", [
			{ type: "button", title: "Approve", id: "approve:123" },
			{ type: "button", title: "Reject", id: "reject:123" },
		]);
		expect(payload.type).toBe("interactive");
		expect(payload.interactive.type).toBe("button");
		expect(payload.interactive.action.buttons).toHaveLength(2);
		expect(payload.interactive.action.buttons[0].reply.id).toBe("approve:123");
	});
});
