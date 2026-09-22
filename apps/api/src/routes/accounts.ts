import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "../index.js";
import { authMiddleware } from "../middleware/auth.js";

const createAccountSchema = z.object({
	walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
});

export const accountRoutes = new Hono<{ Variables: AppVariables }>();

accountRoutes.use("*", authMiddleware);

accountRoutes.post("/", async (c) => {
	const body = await c.req.json();
	const parsed = createAccountSchema.parse(body);

	// TODO: wire up DB when DATABASE_URL is configured
	// const db = getDb();
	// const existing = await getAccountByWallet(db, parsed.walletAddress);
	// if (existing) {
	//   return c.json({ data: existing }, 200);
	// }
	// const account = await createAccount(db, parsed.walletAddress);

	return c.json(
		{
			data: {
				id: "placeholder",
				walletAddress: parsed.walletAddress,
				username: null,
				status: "active",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			meta: {
				requestId: c.get("requestId"),
				timestamp: new Date().toISOString(),
			},
		},
		201,
	);
});

accountRoutes.get("/:id", async (c) => {
	const id = c.req.param("id");

	// TODO: wire up DB
	// const db = getDb();
	// const account = await getAccount(db, id);
	// if (!account) throw new HTTPException(404, { message: "Account not found" });

	return c.json({
		data: {
			id,
			message: "Account lookup placeholder — wire DB in next task",
		},
		meta: {
			requestId: c.get("requestId"),
			timestamp: new Date().toISOString(),
		},
	});
});
