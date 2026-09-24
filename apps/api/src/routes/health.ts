import { Hono } from "hono";
import type { AppVariables } from "../index.js";

type HealthDeps = {
	checkDb: () => Promise<void>;
};

export function createHealthRoutes(deps: HealthDeps) {
	const app = new Hono<{ Variables: AppVariables }>();

	app.get("/", (c) => {
		return c.json({
			status: "ok",
			version: "0.1.0",
			timestamp: new Date().toISOString(),
			requestId: c.get("requestId"),
		});
	});

	app.get("/ready", async (c) => {
		try {
			await deps.checkDb();
		} catch {
			return c.json(
				{
					status: "degraded",
					database: "unreachable",
					timestamp: new Date().toISOString(),
					requestId: c.get("requestId"),
				},
				503,
			);
		}
		return c.json({
			status: "ok",
			database: "ok",
			timestamp: new Date().toISOString(),
			requestId: c.get("requestId"),
		});
	});

	return app;
}
