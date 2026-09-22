import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { agentsRoutes } from "../agents.js";

const mockAgent = {
	id: "01JAGENT0000000000000001",
	accountId: "01JACCOUNT000000000000001",
	name: "Test Agent",
	walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
	permissions: {
		maxPerTransaction: 50,
		maxPerDay: 200,
		allowedAssets: ["wSPYx"],
		allowedRecipients: [],
		requiresApproval: false,
		approvalThreshold: 25,
	},
	status: "active" as const,
	createdAt: new Date("2026-09-22T00:00:00Z"),
	expiresAt: null,
};

function makeDeps(overrides = {}) {
	return {
		registerAgent: vi.fn().mockResolvedValue(mockAgent),
		getAgent: vi.fn().mockResolvedValue(mockAgent),
		updateAgentPermissions: vi.fn().mockResolvedValue(mockAgent),
		revokeAgent: vi.fn().mockResolvedValue({ ...mockAgent, status: "revoked" }),
		getAgentSpendingLog: vi.fn().mockResolvedValue([]),
		...overrides,
	};
}

function makeApp(deps = makeDeps()) {
	const app = new Hono();
	app.route("/agents", agentsRoutes(deps));
	return app;
}

describe("POST /agents", () => {
	it("registers an agent and returns 201", async () => {
		const deps = makeDeps();
		const app = makeApp(deps);

		const res = await app.request("/agents", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				accountId: "01JACCOUNT000000000000001",
				name: "Test Agent",
				walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
				permissions: {
					maxPerTransaction: 50,
					maxPerDay: 200,
					allowedAssets: ["wSPYx"],
					allowedRecipients: [],
					requiresApproval: false,
					approvalThreshold: 25,
				},
			}),
		});

		expect(res.status).toBe(201);
		const body = (await res.json()) as { data: typeof mockAgent };
		expect(body.data.id).toBe("01JAGENT0000000000000001");
		expect(deps.registerAgent).toHaveBeenCalledOnce();
	});

	it("returns 400 for missing required fields", async () => {
		const app = makeApp();

		const res = await app.request("/agents", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "Test" }),
		});

		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe("VALIDATION_ERROR");
	});

	it("returns 400 for invalid wallet address", async () => {
		const app = makeApp();

		const res = await app.request("/agents", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				accountId: "01JACCOUNT000000000000001",
				name: "Test Agent",
				walletAddress: "not-an-address",
				permissions: {
					maxPerTransaction: 50,
					maxPerDay: 200,
					allowedAssets: [],
					allowedRecipients: [],
					requiresApproval: false,
					approvalThreshold: 25,
				},
			}),
		});

		expect(res.status).toBe(400);
	});
});

describe("GET /agents/:id", () => {
	it("returns agent with 200", async () => {
		const app = makeApp();

		const res = await app.request("/agents/01JAGENT0000000000000001");
		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: typeof mockAgent };
		expect(body.data.id).toBe("01JAGENT0000000000000001");
	});

	it("returns 404 when agent not found", async () => {
		const app = makeApp(makeDeps({ getAgent: vi.fn().mockResolvedValue(null) }));

		const res = await app.request("/agents/01JNOTFOUND000000000000000");
		expect(res.status).toBe(404);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe("NOT_FOUND");
	});
});

describe("GET /agents/:id/permissions", () => {
	it("returns agent permissions with 200", async () => {
		const app = makeApp();

		const res = await app.request("/agents/01JAGENT0000000000000001/permissions");
		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: typeof mockAgent.permissions };
		expect(body.data.maxPerTransaction).toBe(50);
	});

	it("returns 404 when agent not found", async () => {
		const app = makeApp(makeDeps({ getAgent: vi.fn().mockResolvedValue(null) }));

		const res = await app.request("/agents/01JNOTFOUND000000000000000/permissions");
		expect(res.status).toBe(404);
	});
});

describe("PUT /agents/:id/permissions", () => {
	it("updates permissions and returns 200", async () => {
		const updated = { ...mockAgent, permissions: { ...mockAgent.permissions, maxPerTransaction: 100 } };
		const deps = makeDeps({ updateAgentPermissions: vi.fn().mockResolvedValue(updated) });
		const app = makeApp(deps);

		const res = await app.request("/agents/01JAGENT0000000000000001/permissions", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ maxPerTransaction: 100 }),
		});

		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: typeof updated };
		expect(body.data.permissions.maxPerTransaction).toBe(100);
	});

	it("returns 400 for invalid permissions", async () => {
		const app = makeApp();

		const res = await app.request("/agents/01JAGENT0000000000000001/permissions", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ maxPerTransaction: -5 }),
		});

		expect(res.status).toBe(400);
	});

	it("returns 404 when agent not found", async () => {
		const deps = makeDeps({
			updateAgentPermissions: vi.fn().mockRejectedValue(new Error("Agent 01JNOTFOUND not found")),
		});
		const app = makeApp(deps);

		const res = await app.request("/agents/01JNOTFOUND000000000000000/permissions", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ maxPerTransaction: 100 }),
		});

		expect(res.status).toBe(404);
	});
});

describe("DELETE /agents/:id", () => {
	it("revokes agent and returns 200", async () => {
		const app = makeApp();

		const res = await app.request("/agents/01JAGENT0000000000000001", {
			method: "DELETE",
		});

		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: { status: string } };
		expect(body.data.status).toBe("revoked");
	});

	it("returns 404 when agent not found", async () => {
		const deps = makeDeps({
			revokeAgent: vi.fn().mockRejectedValue(new Error("Agent 01JNOTFOUND not found")),
		});
		const app = makeApp(deps);

		const res = await app.request("/agents/01JNOTFOUND000000000000000", {
			method: "DELETE",
		});

		expect(res.status).toBe(404);
	});
});

describe("GET /agents/:id/spending-log", () => {
	it("returns spending log with 200", async () => {
		const mockLog = [
			{
				id: "01JLOG00000000000000000001",
				agentId: "01JAGENT0000000000000001",
				paymentIntentId: "01JPAYMENT000000000000001",
				amount: 25,
				asset: "wSPYx",
				recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
				permissionSnapshot: mockAgent.permissions,
				status: "auto_approved" as const,
				decidedAt: new Date("2026-09-22T00:00:00Z"),
			},
		];
		const deps = makeDeps({ getAgentSpendingLog: vi.fn().mockResolvedValue(mockLog) });
		const app = makeApp(deps);

		const res = await app.request("/agents/01JAGENT0000000000000001/spending-log");
		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: typeof mockLog };
		expect(body.data).toHaveLength(1);
		expect(body.data[0]!.amount).toBe(25);
	});

	it("passes limit query param to dep", async () => {
		const deps = makeDeps();
		const app = makeApp(deps);

		await app.request("/agents/01JAGENT0000000000000001/spending-log?limit=5");
		expect(deps.getAgentSpendingLog).toHaveBeenCalledWith("01JAGENT0000000000000001", 5);
	});
});
