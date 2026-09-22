import { Hono } from "hono";
import { z } from "zod";

const createPaymentIntentSchema = z.object({
	accountId: z.string().min(1),
	amount: z.number().positive(),
	recipientAddress: z
		.string()
		.regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address"),
	recipientUsername: z.string().optional(),
});

type PaymentDeps = {
	createPaymentIntent: (params: {
		accountId: string;
		amount: number;
		recipientAddress: string;
		recipientUsername?: string;
	}) => Promise<unknown>;
	getPaymentIntent: (id: string) => Promise<unknown | null>;
	getPaymentHistory: (accountId: string, limit?: number) => Promise<unknown[]>;
	executePayment: (intentId: string) => Promise<unknown>;
	getReceipt: (paymentIntentId: string) => Promise<unknown | null>;
	updatePaymentStatus: (id: string, status: string) => Promise<unknown>;
};

export function paymentsRoutes(deps: PaymentDeps) {
	const app = new Hono();

	app.post("/intent", async (c) => {
		const body = await c.req.json();
		const parsed = createPaymentIntentSchema.safeParse(body);

		if (!parsed.success) {
			return c.json(
				{
					error: {
						code: "VALIDATION_ERROR",
						message: "Invalid request body",
						details: parsed.error.flatten(),
					},
				},
				400,
			);
		}

		const intent = await deps.createPaymentIntent(parsed.data);
		return c.json({ data: intent }, 201);
	});

	app.get("/:id", async (c) => {
		const id = c.req.param("id");
		const intent = await deps.getPaymentIntent(id);

		if (!intent) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: `Payment ${id} not found` } },
				404,
			);
		}

		return c.json({ data: intent });
	});

	app.get("/:id/receipt", async (c) => {
		const id = c.req.param("id");
		const receipt = await deps.getReceipt(id);

		if (!receipt) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: `Receipt not found for payment ${id}` } },
				404,
			);
		}

		return c.json({ data: receipt });
	});

	app.post("/:id/authorize", async (c) => {
		const id = c.req.param("id");
		const intent = await deps.getPaymentIntent(id);

		if (!intent) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: `Payment ${id} not found` } },
				404,
			);
		}

		const result = await deps.executePayment(id);
		return c.json({ data: result });
	});

	app.post("/:id/reject", async (c) => {
		const id = c.req.param("id");
		const result = await deps.updatePaymentStatus(id, "rejected");
		return c.json({ data: result });
	});

	return app;
}
