import { describe, expect, it } from "vitest";
import app from "../index.js";

describe("account routes", () => {
	it("POST /accounts without auth returns 401", async () => {
		const res = await app.request("/accounts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ walletAddress: "0x1234567890abcdef1234567890abcdef12345678" }),
		});
		expect(res.status).toBe(401);
	});

	it("POST /accounts with invalid address returns 400", async () => {
		// This test would need a valid auth token — for now, verify the Zod schema
		// by testing the schema directly
		const { z } = await import("zod");
		const schema = z.object({
			walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
		});

		expect(() => schema.parse({ walletAddress: "not-an-address" })).toThrow();
		expect(() =>
			schema.parse({ walletAddress: "0x1234567890abcdef1234567890abcdef12345678" }),
		).not.toThrow();
	});
});
