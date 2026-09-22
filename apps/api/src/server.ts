import { serve } from "@hono/node-server";
import app from "./index.js";

const port = Number(process.env.PORT ?? 3001);
console.log(`Avela API starting on port ${port}`);
serve({ fetch: app.fetch, port });
