import type { Account } from "@avela/core";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { AppVariables } from "../index.js";

/**
 * Resolve the authenticated Privy user to an Avela account (first-login
 * provisioning included) and expose it as `accountId` on the context.
 * Must run after authMiddleware.
 */
export function createAccountMiddleware(resolve: (privyUserId: string) => Promise<Account>) {
	return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
		const privyUserId = c.get("privyUserId");
		if (!privyUserId) {
			throw new HTTPException(401, { message: "Missing authentication context" });
		}
		const account = await resolve(privyUserId);
		c.set("accountId", account.id);
		await next();
	});
}

type AccountContext = {
	get: (key: "accountId") => string | undefined;
};

/**
 * Prefer the authenticated account. A caller-supplied id is accepted only
 * when it matches the context (or is the literal "me"); otherwise 403.
 * Without any context (unit tests, service callers) the supplied id is used.
 */
export function resolveAccountId(c: AccountContext, fromParams?: string): string {
	const ctx = c.get("accountId");
	if (ctx) {
		if (fromParams && fromParams !== "me" && fromParams !== ctx) {
			throw new HTTPException(403, { message: "Account mismatch" });
		}
		return ctx;
	}
	if (!fromParams || fromParams === "me") {
		throw new HTTPException(401, { message: "Missing account context" });
	}
	return fromParams;
}
