import { describe, expect, it } from "vitest";
import app from "../index.js";

describe("portfolio routes", () => {
	it("GET /accounts/:id/portfolio without auth returns 401", async () => {
		const res = await app.request("/accounts/01JTEST/portfolio");
		expect(res.status).toBe(401);
	});
});
