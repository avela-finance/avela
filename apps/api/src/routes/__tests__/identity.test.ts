import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { createIdentityRoutes } from "../identity.js";

describe("identity routes", () => {
	it("exports createIdentityRoutes", () => {
		expect(createIdentityRoutes).toBeTypeOf("function");
	});

	it("creates a Hono app with routes", () => {
		const routes = createIdentityRoutes({
			registerUsername: async () => ({
				id: "01JTEST",
				accountId: "01JACCOUNT",
				username: "testuser",
				displayName: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
			resolveUsername: async () => ({
				accountId: "01JACCOUNT",
				walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
			}),
			isUsernameAvailable: async () => true,
		});
		expect(routes).toBeDefined();
	});
});

describe("GET /available/:username", () => {
	function createApp(available: boolean) {
		const routes = createIdentityRoutes({
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
});

describe("GET /resolve/:username", () => {
	it("returns account for existing username", async () => {
		const routes = createIdentityRoutes({
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
		const body = (await res.json()) as { data: { accountId: string; walletAddress: string } };
		expect(body.data.walletAddress).toBe("0x1234567890abcdef1234567890abcdef12345678");
	});

	it("returns 404 for unknown username", async () => {
		const routes = createIdentityRoutes({
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
});
