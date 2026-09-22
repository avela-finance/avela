import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => {
	return c.json({
		status: "ok",
		version: "0.1.0",
		timestamp: new Date().toISOString(),
	});
});

const port = Number(process.env.PORT ?? 3001);
console.log(`Avela API starting on port ${port}`);
serve({ fetch: app.fetch, port });

export default app;
