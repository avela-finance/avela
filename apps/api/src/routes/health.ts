import { Hono } from "hono";
import type { AppVariables } from "../index.js";

export const healthRoutes = new Hono<{ Variables: AppVariables }>();

healthRoutes.get("/", (c) => {
	return c.json({
		status: "ok",
		version: "0.1.0",
		timestamp: new Date().toISOString(),
		requestId: c.get("requestId"),
	});
});

healthRoutes.get("/ready", async (c) => {
	// TODO: add DB ping when DATABASE_URL is configured
	return c.json({
		status: "ok",
		database: "not_configured",
		timestamp: new Date().toISOString(),
		requestId: c.get("requestId"),
	});
});
