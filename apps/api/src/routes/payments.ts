import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "../index.js";
import { resolveAccountId } from "../middleware/account.js";

const createPaymentIntentSchema = z.object({
	accountId: z.string().min(1).optional(),
	amount: z.number().positive(),
	recipientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address"),
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
	const app = new Hono<{ Variables: AppVariables }>();

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

		const accountId = resolveAccountId(c, parsed.data.accountId);
		const intent = await deps.createPaymentIntent({ ...parsed.data, accountId });
		return c.json({ data: intent }, 201);
	});

	app.get("/:id", async (c) => {
		const id = c.req.param("id");
		const intent = await deps.getPaymentIntent(id);

		if (!intent) {
			return c.json({ error: { code: "NOT_FOUND", message: `Payment ${id} not found` } }, 404);
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
			return c.json({ error: { code: "NOT_FOUND", message: `Payment ${id} not found` } }, 404);
		}

		const result = await deps.executePayment(id);
		return c.json({ data: result });
	});

	app.post("/:id/reject", async (c) => {
		const id = c.req.param("id");
		const intent = await deps.getPaymentIntent(id);

		if (!intent) {
			return c.json({ error: { code: "NOT_FOUND", message: `Payment ${id} not found` } }, 404);
		}

		try {
			const result = await deps.updatePaymentStatus(id, "rejected");
			return c.json({ data: result });
		} catch {
			return c.json(
				{
					error: {
						code: "INVALID_STATE",
						message: "Payment cannot be rejected in its current state",
					},
				},
				400,
			);
		}
	});

	return app;
}
