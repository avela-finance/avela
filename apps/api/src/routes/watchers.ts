import type { Watcher, WatcherEvaluation } from "@avela/core";
import { Hono } from "hono";
import { z } from "zod";

const createWatcherSchema = z.object({
	threshold: z.number().nonnegative(),
	cooldownMinutes: z.number().int().positive().optional(),
});

const updateWatcherSchema = z.object({
	threshold: z.number().nonnegative().optional(),
	cooldownMinutes: z.number().int().positive().optional(),
	status: z.enum(["active", "paused", "disabled"]).optional(),
});

type WatcherDeps = {
	createWatcher: (params: {
		accountId: string;
		threshold: number;
		cooldownMinutes: number;
	}) => Promise<Watcher>;
	getWatchersByAccount: (accountId: string) => Promise<Watcher[]>;
	getWatcher: (watcherId: string) => Promise<Watcher | null>;
	updateWatcher: (
		watcherId: string,
		updates: {
			threshold?: number;
			cooldownMinutes?: number;
			status?: "active" | "triggered" | "paused" | "disabled";
		},
	) => Promise<Watcher>;
	deleteWatcher: (watcherId: string) => Promise<void>;
	evaluateAllActiveWatchers: () => Promise<WatcherEvaluation[]>;
};

export function watchersRoutes(deps: WatcherDeps) {
	const app = new Hono();

	// POST / — Create watcher (accountId from parent route param)
	app.post("/", async (c) => {
		const accountId = c.req.param("accountId") as string;

		let body: unknown;
		try {
			body = await c.req.json();
		} catch {
			return c.json({ error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } }, 400);
		}

		const parsed = createWatcherSchema.safeParse(body);

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

		const watcher = await deps.createWatcher({
			accountId,
			threshold: parsed.data.threshold,
			cooldownMinutes: parsed.data.cooldownMinutes ?? 60,
		});

		return c.json({ data: watcher }, 201);
	});

	// GET / — List watchers for account (accountId from parent route param)
	app.get("/", async (c) => {
		const accountId = c.req.param("accountId") as string;
		const watchers = await deps.getWatchersByAccount(accountId);
		return c.json({ data: watchers });
	});

	// PUT /:id — Update watcher
	app.put("/:id", async (c) => {
		const accountId = c.req.param("accountId") as string;
		const id = c.req.param("id");

		const existing = await deps.getWatcher(id);
		if (!existing || existing.accountId !== accountId) {
			return c.json({ error: { code: "NOT_FOUND", message: `Watcher ${id} not found` } }, 404);
		}

		let body: unknown;
		try {
			body = await c.req.json();
		} catch {
			return c.json({ error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } }, 400);
		}

		const parsed = updateWatcherSchema.safeParse(body);

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

		try {
			const updated = await deps.updateWatcher(id, parsed.data);
			return c.json({ data: updated });
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error";
			if (message.includes("not found")) {
				return c.json({ error: { code: "NOT_FOUND", message: `Watcher ${id} not found` } }, 404);
			}
			throw err;
		}
	});

	// DELETE /:id — Delete watcher
	app.delete("/:id", async (c) => {
		const accountId = c.req.param("accountId") as string;
		const id = c.req.param("id");

		const existing = await deps.getWatcher(id);
		if (!existing || existing.accountId !== accountId) {
			return c.json({ error: { code: "NOT_FOUND", message: `Watcher ${id} not found` } }, 404);
		}

		await deps.deleteWatcher(id);
		return c.json({ data: { deleted: true } });
	});

	// MVP: evaluates all active watchers across accounts (admin-only).
	// TODO: Move to /admin/watchers/evaluate when admin auth is implemented.
	// POST /evaluate — Trigger evaluation of all active watchers (admin endpoint)
	app.post("/evaluate", async (c) => {
		const results = await deps.evaluateAllActiveWatchers();
		return c.json({ data: results });
	});

	return app;
}
