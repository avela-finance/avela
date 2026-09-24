import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createIdentityRoutes } from "../identity.js";

const mockIdentity = {
	id: "01JTEST",
	accountId: "01JACCOUNT",
	username: "testuser",
	displayName: null,
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe("identity routes", () => {
	it("exports createIdentityRoutes", () => {
		expect(createIdentityRoutes).toBeTypeOf("function");
	});

	it("creates a Hono app with routes", () => {
		const routes = createIdentityRoutes({
			getIdentityByAccount: async () => null,
			registerUsername: async () => mockIdentity,
			resolveUsername: async () => ({
				accountId: "01JACCOUNT",
				walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
			}),
			isUsernameAvailable: async () => true,
		});
		expect(routes).toBeDefined();
	});
});

describe("POST /register", () => {
	function createApp(registerFn: () => Promise<typeof mockIdentity> = async () => mockIdentity) {
		const routes = createIdentityRoutes({
			getIdentityByAccount: async () => null,
			registerUsername: registerFn,
			resolveUsername: async () => null,
			isUsernameAvailable: async () => true,
		});
		const app = new Hono();
		app.route("/identity", routes);
		return app;
	}

	it("returns 201 with identity data on success", async () => {
		const app = createApp();
		const res = await app.request("/identity/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				accountId: "01JACCOUNT",
				username: "testuser",
				displayName: "Test User",
			}),
		});
		expect(res.status).toBe(201);
		const body = (await res.json()) as { data: typeof mockIdentity };
		expect(body.data.username).toBe("testuser");
	});

	it("returns 400 for invalid JSON body", async () => {
		const app = createApp();
		const res = await app.request("/identity/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: "not-json",
		});
		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe("VALIDATION_ERROR");
	});

	it("returns 400 for validation error (short username)", async () => {
		const app = createApp();
		const res = await app.request("/identity/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ accountId: "01JACCOUNT", username: "ab" }),
		});
		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe("VALIDATION_ERROR");
	});

	it("returns 400 with REGISTRATION_FAILED when dep throws", async () => {
		const app = createApp(async () => {
			throw new Error("Username already taken");
		});
		const res = await app.request("/identity/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ accountId: "01JACCOUNT", username: "existinguser" }),
		});
		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: { code: string; message: string } };
		expect(body.error.code).toBe("REGISTRATION_FAILED");
		expect(body.error.message).toBe("Username already taken");
	});
});

describe("GET /available/:username", () => {
	function createApp(available: boolean) {
		const routes = createIdentityRoutes({
			getIdentityByAccount: async () => null,
			registerUsername: async () => {
				throw new Error("not called");
			},
			resolveUsername: async () => null,
			isUsernameAvailable: async () => available,
		});
		const app = new Hono();
		app.route("/identity", routes);
		return app;
	}

	it("returns available: true for unclaimed username", async () => {
		const app = createApp(true);
		const res = await app.request("/identity/available/newuser");
		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: { username: string; available: boolean } };
		expect(body.data.available).toBe(true);
	});

	it("returns available: false for taken username", async () => {
		const app = createApp(false);
		const res = await app.request("/identity/available/taken");
		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: { username: string; available: boolean } };
		expect(body.data.available).toBe(false);
	});

	it("returns 400 for invalid username param", async () => {
		const app = createApp(true);
		const res = await app.request("/identity/available/ab");
		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe("INVALID_USERNAME");
	});
});

describe("GET /resolve/:username", () => {
	it("returns username and walletAddress for existing username", async () => {
		const routes = createIdentityRoutes({
			getIdentityByAccount: async () => null,
			registerUsername: async () => {
				throw new Error("not called");
			},
			resolveUsername: async () => ({
				accountId: "01JACCOUNT",
				walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
			}),
			isUsernameAvailable: async () => false,
		});
		const app = new Hono();
		app.route("/identity", routes);

		const res = await app.request("/identity/resolve/samuel");
		expect(res.status).toBe(200);
		const body = (await res.json()) as {
			data: { username: string; walletAddress: string };
		};
		expect(body.data.walletAddress).toBe("0x1234567890abcdef1234567890abcdef12345678");
		expect(body.data.username).toBe("samuel");
		expect((body.data as Record<string, unknown>).accountId).toBeUndefined();
	});

	it("returns 404 for unknown username", async () => {
		const routes = createIdentityRoutes({
			getIdentityByAccount: async () => null,
			registerUsername: async () => {
				throw new Error("not called");
			},
			resolveUsername: async () => null,
			isUsernameAvailable: async () => true,
		});
		const app = new Hono();
		app.route("/identity", routes);

		const res = await app.request("/identity/resolve/unknown");
		expect(res.status).toBe(404);
	});

	it("returns 400 for invalid username param", async () => {
		const routes = createIdentityRoutes({
			getIdentityByAccount: async () => null,
			registerUsername: async () => {
				throw new Error("not called");
			},
			resolveUsername: async () => null,
			isUsernameAvailable: async () => true,
		});
		const app = new Hono();
		app.route("/identity", routes);

		const res = await app.request("/identity/resolve/ab");
		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe("INVALID_USERNAME");
	});
});

describe("GET /identity/me", () => {
	// Mounted with account context, mirroring production (/identity/me is
	// auth-gated at mount; /resolve and /available stay public).
	function makeAuthedApp(identity: unknown) {
		const routes = createIdentityRoutes({
			getIdentityByAccount: async () => identity as never,
			registerUsername: async () => {
				throw new Error("not called");
			},
			resolveUsername: async () => null,
			isUsernameAvailable: async () => true,
		});
		const app = new Hono<{ Variables: { accountId?: string } }>();
		app.use("*", async (c, next) => {
			c.set("accountId", "01JACCOUNT");
			await next();
		});
		app.route("/identity", routes);
		return app;
	}

	it("returns the username when set", async () => {
		const app = makeAuthedApp({ username: "samuel" });
		const res = await app.request("/identity/me");
		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: { username: string | null } };
		expect(body.data.username).toBe("samuel");
	});

	it("returns null username when unset", async () => {
		const app = makeAuthedApp(null);
		const res = await app.request("/identity/me");
		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: { username: string | null } };
		expect(body.data.username).toBeNull();
	});
});
