import { describe, it, expect } from "vitest";
import type {
	WhatsAppLink,
	WhatsAppNotification,
	WhatsAppNotificationType,
	InteractiveAction,
} from "../types.js";

describe("WhatsApp types", () => {
	it("creates a valid WhatsAppLink", () => {
		const link: WhatsAppLink = {
			id: "01JTEST000000000000000000",
			accountId: "01JTEST000000000000000001",
			phoneNumber: "+1234567890",
			waId: "1234567890",
			linkedAt: new Date(),
			active: true,
		};
		expect(link.phoneNumber).toMatch(/^\+\d+$/);
		expect(link.active).toBe(true);
	});

	it("creates a valid WhatsAppNotification", () => {
		const notification: WhatsAppNotification = {
			id: "01JTEST000000000000000002",
			accountId: "01JTEST000000000000000001",
			phoneNumber: "+1234567890",
			type: "payment_pending",
			paymentIntentId: "01JTEST000000000000000003",
			templateName: "payment_approval",
			message: "Agent wants to spend $12.00",
			interactiveActions: [
				{ type: "button", title: "Approve", id: "approve:01JTEST000000000000000003" },
				{ type: "button", title: "Reject", id: "reject:01JTEST000000000000000003" },
			],
			sentAt: new Date(),
			respondedAt: null,
			response: null,
		};
		expect(notification.type).toBe("payment_pending");
		expect(notification.interactiveActions).toHaveLength(2);
	});
});
