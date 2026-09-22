import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { paymentsRoutes } from "../payments.js";

describe("POST /payments/intent", () => {
	it("creates a payment intent and returns 201", async () => {
		const app = new Hono();
		const mockCreatePaymentIntent = vi.fn().mockResolvedValue({
			id: "01JTEST000000000000000000",
			accountId: "01JACCOUNT0000000000000",
			amount: "25.000000",
			recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
			status: "created",
			createdAt: "2026-09-21T00:00:00Z",
		});

		app.route(
			"/payments",
			paymentsRoutes({
				createPaymentIntent: mockCreatePaymentIntent,
				getPaymentIntent: vi.fn(),
				getPaymentHistory: vi.fn(),
				executePayment: vi.fn(),
				getReceipt: vi.fn(),
				updatePaymentStatus: vi.fn(),
			}),
		);

		const res = await app.request("/payments/intent", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				accountId: "01JACCOUNT0000000000000",
				amount: 25,
				recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
			}),
		});

		expect(res.status).toBe(201);
		const body = await res.json();
		expect(body.data.id).toBe("01JTEST000000000000000000");
		expect(body.data.status).toBe("created");
	});

	it("returns 400 for invalid input", async () => {
		const app = new Hono();
		app.route(
			"/payments",
			paymentsRoutes({
				createPaymentIntent: vi.fn(),
				getPaymentIntent: vi.fn(),
				getPaymentHistory: vi.fn(),
				executePayment: vi.fn(),
				getReceipt: vi.fn(),
				updatePaymentStatus: vi.fn(),
			}),
		);

		const res = await app.request("/payments/intent", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ amount: -5 }),
		});

		expect(res.status).toBe(400);
	});
});

describe("GET /payments/:id", () => {
	it("returns payment intent with 200", async () => {
		const app = new Hono();
		const mockGetPaymentIntent = vi.fn().mockResolvedValue({
			id: "01JTEST000000000000000000",
			status: "settled",
		});

		app.route(
			"/payments",
			paymentsRoutes({
				createPaymentIntent: vi.fn(),
				getPaymentIntent: mockGetPaymentIntent,
				getPaymentHistory: vi.fn(),
				executePayment: vi.fn(),
				getReceipt: vi.fn(),
				updatePaymentStatus: vi.fn(),
			}),
		);

		const res = await app.request("/payments/01JTEST000000000000000000");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.id).toBe("01JTEST000000000000000000");
	});

	it("returns 404 when payment not found", async () => {
		const app = new Hono();
		app.route(
			"/payments",
			paymentsRoutes({
				createPaymentIntent: vi.fn(),
				getPaymentIntent: vi.fn().mockResolvedValue(null),
				getPaymentHistory: vi.fn(),
				executePayment: vi.fn(),
				getReceipt: vi.fn(),
				updatePaymentStatus: vi.fn(),
			}),
		);

		const res = await app.request("/payments/01JNOTFOUND00000000000000");
		expect(res.status).toBe(404);
	});
});
