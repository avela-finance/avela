import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { policiesRoutes } from "../policies.js";

describe("GET /policies", () => {
	it("returns policy with 200", async () => {
		const app = new Hono();
		app.route(
			"/accounts/:accountId/policies",
			policiesRoutes({
				getPolicy: vi.fn().mockResolvedValue({
					id: "01JPOLICY0000000000000000",
					dailyLimit: "500.000000",
					approvalThreshold: "100.000000",
					enabled: true,
				}),
				updatePolicy: vi.fn(),
				getDailySpending: vi.fn().mockResolvedValue({
					total: 50,
					limit: 500,
					remaining: 450,
				}),
			}),
		);

		const res = await app.request("/accounts/01JACCOUNT0000000000000/policies");
		expect(res.status).toBe(200);
		const body = (await res.json()) as {
			data: {
				policy: { dailyLimit: string };
				dailySpending: { remaining: number };
			};
		};
		expect(body.data.policy.dailyLimit).toBe("500.000000");
		expect(body.data.dailySpending.remaining).toBe(450);
	});

	it("returns 404 when no policy exists", async () => {
		const app = new Hono();
		app.route(
			"/accounts/:accountId/policies",
			policiesRoutes({
				getPolicy: vi.fn().mockResolvedValue(null),
				updatePolicy: vi.fn(),
				getDailySpending: vi.fn(),
			}),
		);

		const res = await app.request("/accounts/01JNOTFOUND0000000000000/policies");
		expect(res.status).toBe(404);
	});
});

describe("PUT /policies", () => {
	it("updates policy and returns 200", async () => {
		const app = new Hono();
		app.route(
			"/accounts/:accountId/policies",
			policiesRoutes({
				getPolicy: vi.fn(),
				updatePolicy: vi.fn().mockResolvedValue({
					id: "01JPOLICY0000000000000000",
					dailyLimit: "1000.000000",
					approvalThreshold: "200.000000",
				}),
				getDailySpending: vi.fn(),
			}),
		);

		const res = await app.request("/accounts/01JACCOUNT0000000000000/policies", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ dailyLimit: 1000, approvalThreshold: 200 }),
		});

		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: { dailyLimit: string } };
		expect(body.data.dailyLimit).toBe("1000.000000");
	});

	it("returns 400 for invalid input", async () => {
		const app = new Hono();
		app.route(
			"/accounts/:accountId/policies",
			policiesRoutes({
				getPolicy: vi.fn(),
				updatePolicy: vi.fn(),
				getDailySpending: vi.fn(),
			}),
		);

		const res = await app.request("/accounts/01JACCOUNT0000000000000/policies", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ dailyLimit: -100 }),
		});

		expect(res.status).toBe(400);
	});
});
