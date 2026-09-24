import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { createHealthRoutes } from "../health.js";

describe("createHealthRoutes", () => {
	it("GET / returns status ok", async () => {
		const app = new Hono();
		app.route("/health", createHealthRoutes({ checkDb: vi.fn() }));

		const res = await app.request("/health");
		expect(res.status).toBe(200);
		const body = (await res.json()) as { status: string };
		expect(body.status).toBe("ok");
	});

	it("GET /ready returns ok when the DB pings", async () => {
		const checkDb = vi.fn().mockResolvedValue(undefined);
		const app = new Hono();
		app.route("/health", createHealthRoutes({ checkDb }));

		const res = await app.request("/health/ready");
		expect(res.status).toBe(200);
		const body = (await res.json()) as { status: string; database: string };
		expect(body.database).toBe("ok");
		expect(checkDb).toHaveBeenCalled();
	});

	it("GET /ready returns 503 when the DB is unreachable", async () => {
		const app = new Hono();
		app.route(
			"/health",
			createHealthRoutes({ checkDb: vi.fn().mockRejectedValue(new Error("down")) }),
		);

		const res = await app.request("/health/ready");
		expect(res.status).toBe(503);
		const body = (await res.json()) as { status: string; database: string };
		expect(body.status).toBe("degraded");
		expect(body.database).toBe("unreachable");
	});
});
