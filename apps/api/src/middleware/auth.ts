import { PrivyClient } from "@privy-io/server-auth";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { env } from "../env.js";

let privyClient: PrivyClient | null = null;

function getPrivyClient(): PrivyClient {
	if (!privyClient) {
		privyClient = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET);
	}
	return privyClient;
}

export const authMiddleware = createMiddleware(async (c, next) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		throw new HTTPException(401, { message: "Missing or invalid Authorization header" });
	}

	const token = authHeader.slice(7);

	try {
		const privy = getPrivyClient();
		const verifiedClaims = await privy.verifyAuthToken(token);
		c.set("privyUserId", verifiedClaims.userId);
	} catch {
		throw new HTTPException(401, { message: "Invalid or expired access token" });
	}

	await next();
});
