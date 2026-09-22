import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { watchersRoutes } from "../watchers.js";
import type { Watcher, WatcherEvaluation } from "@avela/core";

const mockWatcher: Watcher = {
	id: "01JWATCHER0000000000000001",
	accountId: "01JACCOUNT000000000000001",
	type: "spending_power_threshold",
	config: { threshold: 500, direction: "below" },
	status: "active",
	lastEvaluatedAt: null,
	lastTriggeredAt: null,
	cooldownMinutes: 60,
	createdAt: new Date("2026-09-22T00:00:00Z"),
	updatedAt: new Date("2026-09-22T00:00:00Z"),
};

const mockEvaluation: WatcherEvaluation = {
	watcherId: "01JWATCHER0000000000000001",
	currentValue: 450,
	threshold: 500,
	triggered: true,
	evaluatedAt: new Date("2026-09-22T00:00:00Z"),
};

function makeDeps(overrides = {}) {
	return {
		createWatcher: vi.fn().mockResolvedValue(mockWatcher),
		getWatchersByAccount: vi.fn().mockResolvedValue([mockWatcher]),
		getWatcher: vi.fn().mockResolvedValue(mockWatcher),
		updateWatcher: vi.fn().mockResolvedValue(mockWatcher),
		deleteWatcher: vi.fn().mockResolvedValue(undefined),
		evaluateAllActiveWatchers: vi.fn().mockResolvedValue([mockEvaluation]),
		...overrides,
	};
}

function makeApp(deps = makeDeps()) {
	const app = new Hono();
	// Mount as nested under /accounts/:accountId/watchers to mirror real usage
	app.route("/accounts/:accountId/watchers", watchersRoutes(deps));
	return app;
}

describe("POST /accounts/:accountId/watchers", () => {
	it("creates a watcher and returns 201", async () => {
		const deps = makeDeps();
		const app = makeApp(deps);

		const res = await app.request("/accounts/01JACCOUNT000000000000001/watchers", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ threshold: 500, cooldownMinutes: 60 }),
		});

		expect(res.status).toBe(201);
		const body = (await res.json()) as { data: typeof mockWatcher };
		expect(body.data.id).toBe("01JWATCHER0000000000000001");
		expect(deps.createWatcher).toHaveBeenCalledWith({
			accountId: "01JACCOUNT000000000000001",
			threshold: 500,
			cooldownMinutes: 60,
		});
	});

	it("defaults cooldownMinutes to 60 when not provided", async () => {
		const deps = makeDeps();
		const app = makeApp(deps);

		await app.request("/accounts/01JACCOUNT000000000000001/watchers", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ threshold: 250 }),
		});

		expect(deps.createWatcher).toHaveBeenCalledWith({
			accountId: "01JACCOUNT000000000000001",
			threshold: 250,
			cooldownMinutes: 60,
		});
	});

	it("returns 400 for missing threshold", async () => {
		const app = makeApp();

		const res = await app.request("/accounts/01JACCOUNT000000000000001/watchers", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ cooldownMinutes: 30 }),
		});

		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe("VALIDATION_ERROR");
	});

	it("returns 400 for negative threshold", async () => {
		const app = makeApp();

		const res = await app.request("/accounts/01JACCOUNT000000000000001/watchers", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ threshold: -100 }),
		});

		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe("VALIDATION_ERROR");
	});
});

describe("GET /accounts/:accountId/watchers", () => {
	it("returns watchers list with 200", async () => {
		const deps = makeDeps();
		const app = makeApp(deps);

		const res = await app.request("/accounts/01JACCOUNT000000000000001/watchers");

		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: typeof mockWatcher[] };
		expect(body.data).toHaveLength(1);
		expect(body.data[0]!.id).toBe("01JWATCHER0000000000000001");
		expect(deps.getWatchersByAccount).toHaveBeenCalledWith("01JACCOUNT000000000000001");
	});

	it("returns empty array when no watchers", async () => {
		const deps = makeDeps({ getWatchersByAccount: vi.fn().mockResolvedValue([]) });
		const app = makeApp(deps);

		const res = await app.request("/accounts/01JACCOUNT000000000000001/watchers");

		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: unknown[] };
		expect(body.data).toHaveLength(0);
	});
});

describe("PUT /accounts/:accountId/watchers/:id", () => {
	it("updates watcher and returns 200", async () => {
		const updated = { ...mockWatcher, cooldownMinutes: 120 };
		const deps = makeDeps({ updateWatcher: vi.fn().mockResolvedValue(updated) });
		const app = makeApp(deps);

		const res = await app.request(
			"/accounts/01JACCOUNT000000000000001/watchers/01JWATCHER0000000000000001",
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ cooldownMinutes: 120 }),
			},
		);

		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: typeof updated };
		expect(body.data.cooldownMinutes).toBe(120);
	});

	it("returns 400 for invalid status", async () => {
		const app = makeApp();

		const res = await app.request(
			"/accounts/01JACCOUNT000000000000001/watchers/01JWATCHER0000000000000001",
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "invalid_status" }),
			},
		);

		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe("VALIDATION_ERROR");
	});

	it("returns 404 when watcher not found", async () => {
		const deps = makeDeps({
			getWatcher: vi.fn().mockResolvedValue(null),
		});
		const app = makeApp(deps);

		const res = await app.request(
			"/accounts/01JACCOUNT000000000000001/watchers/01JNOTFOUND000000000000000",
			{
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ threshold: 300 }),
			},
		);

		expect(res.status).toBe(404);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe("NOT_FOUND");
	});
});

describe("DELETE /accounts/:accountId/watchers/:id", () => {
	it("deletes watcher and returns 200", async () => {
		const deps = makeDeps();
		const app = makeApp(deps);

		const res = await app.request(
			"/accounts/01JACCOUNT000000000000001/watchers/01JWATCHER0000000000000001",
			{ method: "DELETE" },
		);

		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: { deleted: boolean } };
		expect(body.data.deleted).toBe(true);
		expect(deps.deleteWatcher).toHaveBeenCalledWith("01JWATCHER0000000000000001");
	});
});

describe("POST /accounts/:accountId/watchers/evaluate", () => {
	it("triggers evaluation and returns results", async () => {
		const deps = makeDeps();
		const app = makeApp(deps);

		const res = await app.request("/accounts/01JACCOUNT000000000000001/watchers/evaluate", {
			method: "POST",
		});

		expect(res.status).toBe(200);
		const body = (await res.json()) as { data: typeof mockEvaluation[] };
		expect(body.data).toHaveLength(1);
		expect(body.data[0]!.triggered).toBe(true);
		expect(deps.evaluateAllActiveWatchers).toHaveBeenCalledOnce();
	});
});
