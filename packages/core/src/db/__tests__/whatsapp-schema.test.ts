import { describe, expect, it } from "vitest";
import { whatsappLinksTable, whatsappNotificationsTable } from "../schema.js";

describe("WhatsApp schema", () => {
	it("exports whatsappLinksTable with correct columns", () => {
		expect(whatsappLinksTable).toBeDefined();
		const columns = Object.keys(whatsappLinksTable);
		expect(columns).toContain("id");
		expect(columns).toContain("accountId");
		expect(columns).toContain("phoneNumber");
		expect(columns).toContain("waId");
		expect(columns).toContain("linkedAt");
		expect(columns).toContain("active");
	});

	it("exports whatsappNotificationsTable with correct columns", () => {
		expect(whatsappNotificationsTable).toBeDefined();
		const columns = Object.keys(whatsappNotificationsTable);
		expect(columns).toContain("id");
		expect(columns).toContain("accountId");
		expect(columns).toContain("phoneNumber");
		expect(columns).toContain("type");
		expect(columns).toContain("paymentIntentId");
		expect(columns).toContain("templateName");
		expect(columns).toContain("message");
		expect(columns).toContain("sentAt");
		expect(columns).toContain("response");
	});
});
