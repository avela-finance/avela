import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { createAccountMiddleware, resolveAccountId } from "../account.js";

const mockAccount = { id: "01JACCOUNT000000000000001" } as {
	id: string;
	walletAddress: string;
};

describe("resolveAccountId", () => {
	const withCtx = (id: string | undefined) => ({
		get: (_key: "accountId") => id,
	});

	it("returns the context account when no param is given", () => {
		expect(resolveAccountId(withCtx("01JAAA"), undefined)).toBe("01JAAA");
	});

	it("accepts the literal 'me' with context", () => {
		expect(resolveAccountId(withCtx("01JAAA"), "me")).toBe("01JAAA");
	});

	it("accepts a matching param", () => {
		expect(resolveAccountId(withCtx("01JAAA"), "01JAAA")).toBe("01JAAA");
	});

	it("rejects a mismatched param", () => {
		expect(() => resolveAccountId(withCtx("01JAAA"), "01JBBB")).toThrow();
	});

	it("falls back to params without context (service callers, tests)", () => {
		expect(resolveAccountId(withCtx(undefined), "01JBBB")).toBe("01JBBB");
	});

	it("throws 401 with neither context nor params", () => {
		expect(() => resolveAccountId(withCtx(undefined), undefined)).toThrow();
		expect(() => resolveAccountId(withCtx(undefined), "me")).toThrow();
	});
});

describe("createAccountMiddleware", () => {
	it("sets accountId from the resolver (first-login provisioning)", async () => {
		const resolve = vi.fn().mockResolvedValue(mockAccount);
		const app = new Hono<{ Variables: { privyUserId: string; accountId?: string } }>();
		app.use("*", async (c, next) => {
			c.set("privyUserId", "did:privy:abc");
			await next();
		});
		app.use("*", createAccountMiddleware(resolve));
		app.get("/whoami", (c) => c.json({ accountId: c.get("accountId") }));

		const res = await app.request("/whoami");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ accountId: mockAccount.id });
		expect(resolve).toHaveBeenCalledWith("did:privy:abc");
	});

	it("returns 401 without privy context", async () => {
		const resolve = vi.fn();
		const app = new Hono<{ Variables: { privyUserId: string; accountId?: string } }>();
		app.use("*", createAccountMiddleware(resolve));
		app.get("/whoami", (c) => c.json({ accountId: c.get("accountId") }));

		const res = await app.request("/whoami");
		expect(res.status).toBe(401);
		expect(resolve).not.toHaveBeenCalled();
	});
});
