import { describe, expect, it } from "vitest";
import app from "../index.js";

describe("asset routes", () => {
	it("GET /assets returns 5 MVP assets", async () => {
		const res = await app.request("/assets");
		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: { symbol: string }[] };
		expect(body.data).toHaveLength(5);
		const symbols = body.data.map((a) => a.symbol);
		expect(symbols).toContain("wSPYx");
		expect(symbols).toContain("wQQQx");
		expect(symbols).toContain("wNVDAx");
		expect(symbols).toContain("wGOOGLx");
		expect(symbols).toContain("wAAPLx");
	});

	it("GET /assets/:symbol/price returns asset info", async () => {
		const res = await app.request("/assets/wSPYx/price");
		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: { symbol: string; address: string } };
		expect(body.data.symbol).toBe("wSPYx");
		expect(body.data.address).toBe("0xe7e553cd128f0011777323a0b44a7b96ea1cb540");
	});

	it("GET /assets/:symbol/price returns 404 for unknown asset", async () => {
		const res = await app.request("/assets/wFAKE/price");
		expect(res.status).toBe(404);
	});
});
