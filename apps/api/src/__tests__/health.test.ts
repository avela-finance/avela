import { describe, expect, it } from "vitest";
import app from "../index.js";

describe("health routes", () => {
	it("GET /health returns 200 with status ok", async () => {
		const res = await app.request("/health");
		expect(res.status).toBe(200);
		const body = (await res.json()) as { status: string; version: string; requestId: string };
		expect(body.status).toBe("ok");
		expect(body.version).toBe("0.1.0");
		expect(body.requestId).toBeDefined();
	});

	it("GET /health has X-Request-Id header", async () => {
		const res = await app.request("/health");
		expect(res.headers.get("X-Request-Id")).toBeDefined();
	});
});
