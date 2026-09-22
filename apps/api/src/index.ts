import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { errorHandler } from "./middleware/error-handler.js";
import { requestId } from "./middleware/request-id.js";
import { accountRoutes } from "./routes/accounts.js";
import { assetRoutes } from "./routes/assets.js";
import { healthRoutes } from "./routes/health.js";
import { portfolioRoutes } from "./routes/portfolio.js";

export type AppVariables = {
	requestId: string;
	privyUserId: string;
};

const app = new Hono<{ Variables: AppVariables }>();

app.use("*", requestId);
app.use("*", cors());
app.onError(errorHandler);

app.route("/health", healthRoutes);
app.route("/accounts", accountRoutes);
app.route("/assets", assetRoutes);
app.route("/accounts/:id/portfolio", portfolioRoutes);

const port = Number(process.env.PORT ?? 3001);
console.log(`Avela API starting on port ${port}`);
serve({ fetch: app.fetch, port });

export default app;
export type AppType = typeof app;
