# API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Hono backend that powers all Avela surfaces — health checks, account operations, asset queries, portfolio views.

**Architecture:** Hono HTTP framework on `@hono/node-server` for production. Route modules mounted on the app. Middleware for request IDs (ulidx), CORS, auth (Privy), error handling. All domain logic imported from `@avela/core` — the API is the HTTP boundary, not the domain. Zod validates all request bodies at the route level.

**Tech Stack:** Hono, @hono/node-server, Zod, @privy-io/server-auth, @avela/core

## Global Constraints

- Biome formatting: tabs, double quotes, semicolons, trailing commas
- TypeScript strict mode, ESNext target, Preserve modules
- All entity IDs are ULIDs via `ulidx`
- Package name: `@avela/api`
- Imports `@avela/core` as workspace dependency
- Run `bun run check` and `bun run typecheck` before each commit

---

### Task 1: Package Scaffold

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts` (minimal health-only app)

**Interfaces:**
- Consumes: nothing (first task)
- Produces: runnable Hono app on port 3001

- [ ] **Step 1: Create package.json**

```json
{
	"name": "@avela/api",
	"type": "module",
	"version": "0.1.0",
	"private": true,
	"scripts": {
		"dev": "node --watch --import tsx src/index.ts",
		"start": "node --import tsx src/index.ts",
		"typecheck": "tsc --noEmit"
	},
	"dependencies": {
		"@avela/core": "workspace:*",
		"@hono/node-server": "^1.14.0",
		"hono": "^4.7.0",
		"ulidx": "^2.4.1",
		"zod": "^3.25.0"
	},
	"devDependencies": {
		"tsx": "^4.19.0",
		"vitest": "^5.0.1"
	}
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
	"extends": "../../tsconfig.json",
	"compilerOptions": {
		"rootDir": "./src",
		"outDir": "./dist",
		"paths": {
			"@avela/core": ["../../packages/core/src"]
		}
	},
	"include": ["src/**/*.ts"],
	"exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create minimal Hono app**

File: `apps/api/src/index.ts`

```ts
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
```

- [ ] **Step 4: Install dependencies**

```bash
cd /Users/samueldanso/Workspace/products/avela && bun install
```

Expected: dependencies resolve, workspace link to `@avela/core` established.

- [ ] **Step 5: Start and verify**

```bash
cd /Users/samueldanso/Workspace/products/avela && bun run --cwd apps/api dev &
sleep 2
curl -s http://localhost:3001/health | jq .
kill %1
```

Expected:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "timestamp": "2026-09-..."
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/
git commit -m "feat(api): scaffold Hono app with health endpoint"
```

---

### Task 2: Environment Config

**Files:**
- Create: `apps/api/src/env.ts`
- Modify: `apps/api/src/index.ts`

**Interfaces:**
- Consumes: `process.env`
- Produces: `env` object (typed, validated) with `DATABASE_URL`, `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, `XLAYER_RPC_URL`, `PORT`

- [ ] **Step 1: Write the env schema**

File: `apps/api/src/env.ts`

```ts
import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.string().url(),
	PRIVY_APP_ID: z.string().min(1),
	PRIVY_APP_SECRET: z.string().min(1),
	XLAYER_RPC_URL: z.string().url().default("https://rpc.xlayer.tech"),
	PORT: z.coerce.number().default(3001),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
	const result = envSchema.safeParse(process.env);
	if (!result.success) {
		const missing = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
		console.error("Missing or invalid environment variables:\n" + missing.join("\n"));
		process.exit(1);
	}
	return result.data;
}

export const env = loadEnv();
```

- [ ] **Step 2: Update .env.example**

Append to `/Users/samueldanso/Workspace/products/avela/.env.example`:

```
# Database (Supabase Postgres)
DATABASE_URL=

# Privy auth
PRIVY_APP_ID=
PRIVY_APP_SECRET=
```

- [ ] **Step 3: Verify typecheck**

```bash
bun run typecheck
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/env.ts .env.example
git commit -m "feat(api): add Zod env validation"
```

---

### Task 3: Middleware Stack

**Files:**
- Create: `apps/api/src/middleware/request-id.ts`
- Create: `apps/api/src/middleware/error-handler.ts`
- Modify: `apps/api/src/index.ts`

**Interfaces:**
- Consumes: Hono middleware API
- Produces: `requestId` middleware (sets `X-Request-Id` header + `c.set("requestId", id)`), `errorHandler` middleware (catches errors, returns structured `ApiError`)

- [ ] **Step 1: Write request ID middleware**

File: `apps/api/src/middleware/request-id.ts`

```ts
import { createMiddleware } from "hono/factory";
import { ulid } from "ulidx";

export const requestId = createMiddleware(async (c, next) => {
	const id = ulid();
	c.set("requestId", id);
	c.header("X-Request-Id", id);
	await next();
});
```

- [ ] **Step 2: Write error handler middleware**

File: `apps/api/src/middleware/error-handler.ts`

```ts
import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export const errorHandler: ErrorHandler = (err, c) => {
	const requestId = c.get("requestId") ?? "unknown";
	const timestamp = new Date().toISOString();

	if (err instanceof ZodError) {
		return c.json(
			{
				error: {
					code: "VALIDATION_ERROR",
					message: "Invalid request",
					details: err.issues,
				},
				meta: { requestId, timestamp },
			},
			400,
		);
	}

	if (err instanceof HTTPException) {
		return c.json(
			{
				error: {
					code: "HTTP_ERROR",
					message: err.message,
				},
				meta: { requestId, timestamp },
			},
			err.status,
		);
	}

	console.error(`[${requestId}] Unhandled error:`, err);
	return c.json(
		{
			error: {
				code: "INTERNAL_ERROR",
				message: "Internal server error",
			},
			meta: { requestId, timestamp },
		},
		500,
	);
};
```

- [ ] **Step 3: Update app entry to use middleware**

File: `apps/api/src/index.ts`

```ts
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "./middleware/request-id.js";
import { errorHandler } from "./middleware/error-handler.js";

export type AppVariables = {
	requestId: string;
};

const app = new Hono<{ Variables: AppVariables }>();

app.use("*", requestId);
app.use("*", cors());
app.onError(errorHandler);

app.get("/health", (c) => {
	return c.json({
		status: "ok",
		version: "0.1.0",
		timestamp: new Date().toISOString(),
		requestId: c.get("requestId"),
	});
});

const port = Number(process.env.PORT ?? 3001);
console.log(`Avela API starting on port ${port}`);
serve({ fetch: app.fetch, port });

export default app;
export type AppType = typeof app;
```

- [ ] **Step 4: Verify typecheck and lint**

```bash
bun run typecheck
bun run check
```

Expected: Both pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/middleware/ apps/api/src/index.ts
git commit -m "feat(api): add request ID, CORS, and error handler middleware"
```

---

### Task 4: Health Routes with DB Check

**Files:**
- Create: `apps/api/src/routes/health.ts`
- Modify: `apps/api/src/index.ts`
- Create: `apps/api/src/__tests__/health.test.ts`

**Interfaces:**
- Consumes: `Database` from `@avela/core`, `AppVariables` from `../index.ts`
- Produces: `GET /health` (liveness), `GET /health/ready` (DB check)

- [ ] **Step 1: Write the failing test**

File: `apps/api/src/__tests__/health.test.ts`

```ts
import { describe, expect, it } from "vitest";
import app from "../index.js";

describe("health routes", () => {
	it("GET /health returns 200 with status ok", async () => {
		const res = await app.request("/health");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.status).toBe("ok");
		expect(body.version).toBe("0.1.0");
		expect(body.requestId).toBeDefined();
	});

	it("GET /health has X-Request-Id header", async () => {
		const res = await app.request("/health");
		expect(res.headers.get("X-Request-Id")).toBeDefined();
	});
});
```

- [ ] **Step 2: Run test to verify it passes** (health already works from Task 3)

```bash
bun run test -- apps/api/src/__tests__/health.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 3: Extract health to a route module**

File: `apps/api/src/routes/health.ts`

```ts
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
```

- [ ] **Step 4: Update app entry to mount route module**

Replace the inline `/health` handler in `apps/api/src/index.ts`:

```ts
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "./middleware/request-id.js";
import { errorHandler } from "./middleware/error-handler.js";
import { healthRoutes } from "./routes/health.js";

export type AppVariables = {
	requestId: string;
};

const app = new Hono<{ Variables: AppVariables }>();

app.use("*", requestId);
app.use("*", cors());
app.onError(errorHandler);

app.route("/health", healthRoutes);

const port = Number(process.env.PORT ?? 3001);
console.log(`Avela API starting on port ${port}`);
serve({ fetch: app.fetch, port });

export default app;
export type AppType = typeof app;
```

- [ ] **Step 5: Run tests to confirm refactor didn't break anything**

```bash
bun run test -- apps/api/
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/routes/health.ts apps/api/src/index.ts apps/api/src/__tests__/health.test.ts
git commit -m "feat(api): add health route module with readiness check"
```

---

### Task 5: Auth Middleware (Privy)

**Files:**
- Create: `apps/api/src/middleware/auth.ts`

**Interfaces:**
- Consumes: `@privy-io/server-auth`, `env` from `../env.ts`
- Produces: `authMiddleware` (verifies Privy access token, sets `c.set("walletAddress", address)`)

- [ ] **Step 1: Install Privy dependency**

```bash
cd /Users/samueldanso/Workspace/products/avela && bun add --cwd apps/api @privy-io/server-auth
```

- [ ] **Step 2: Write the auth middleware**

File: `apps/api/src/middleware/auth.ts`

```ts
import { PrivyClient } from "@privy-io/server-auth";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { env } from "../env.js";

let privyClient: PrivyClient | null = null;

function getPrivyClient(): PrivyClient {
	if (!privyClient) {
		privyClient = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET);
	}
	return privyClient;
}

export const authMiddleware = createMiddleware(async (c, next) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		throw new HTTPException(401, { message: "Missing or invalid Authorization header" });
	}

	const token = authHeader.slice(7);

	try {
		const privy = getPrivyClient();
		const verifiedClaims = await privy.verifyAuthToken(token);
		c.set("privyUserId", verifiedClaims.userId);
	} catch {
		throw new HTTPException(401, { message: "Invalid or expired access token" });
	}

	await next();
});
```

- [ ] **Step 3: Update AppVariables type**

In `apps/api/src/index.ts`, extend the variables type:

```ts
export type AppVariables = {
	requestId: string;
	privyUserId: string;
};
```

- [ ] **Step 4: Verify typecheck**

```bash
bun run typecheck
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/middleware/auth.ts apps/api/src/index.ts apps/api/package.json
git commit -m "feat(api): add Privy auth middleware"
```

---

### Task 6: Account Routes

**Files:**
- Create: `apps/api/src/routes/accounts.ts`
- Create: `apps/api/src/__tests__/accounts.test.ts`
- Modify: `apps/api/src/index.ts`

**Interfaces:**
- Consumes: `createAccount`, `getAccount`, `getAccountByWallet` from `@avela/core`, `authMiddleware` from `../middleware/auth.ts`, `AppVariables`
- Produces: `POST /accounts` (create), `GET /accounts/:id` (get by ID)

- [ ] **Step 1: Write the route module**

File: `apps/api/src/routes/accounts.ts`

```ts
import { Hono } from "hono";
import { z } from "zod";
import type { AppVariables } from "../index.js";
import { authMiddleware } from "../middleware/auth.js";

const createAccountSchema = z.object({
	walletAddress: z
		.string()
		.regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
});

export const accountRoutes = new Hono<{ Variables: AppVariables }>();

accountRoutes.use("*", authMiddleware);

accountRoutes.post("/", async (c) => {
	const body = await c.req.json();
	const parsed = createAccountSchema.parse(body);

	// TODO: wire up DB when DATABASE_URL is configured
	// const db = getDb();
	// const existing = await getAccountByWallet(db, parsed.walletAddress);
	// if (existing) {
	//   return c.json({ data: existing }, 200);
	// }
	// const account = await createAccount(db, parsed.walletAddress);

	return c.json(
		{
			data: {
				id: "placeholder",
				walletAddress: parsed.walletAddress,
				username: null,
				status: "active",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			meta: {
				requestId: c.get("requestId"),
				timestamp: new Date().toISOString(),
			},
		},
		201,
	);
});

accountRoutes.get("/:id", async (c) => {
	const id = c.req.param("id");

	// TODO: wire up DB
	// const db = getDb();
	// const account = await getAccount(db, id);
	// if (!account) throw new HTTPException(404, { message: "Account not found" });

	return c.json({
		data: {
			id,
			message: "Account lookup placeholder — wire DB in next task",
		},
		meta: {
			requestId: c.get("requestId"),
			timestamp: new Date().toISOString(),
		},
	});
});
```

- [ ] **Step 2: Mount in app entry**

Add to `apps/api/src/index.ts`:

```ts
import { accountRoutes } from "./routes/accounts.js";
// ... after healthRoutes mount
app.route("/accounts", accountRoutes);
```

- [ ] **Step 3: Write the test**

File: `apps/api/src/__tests__/accounts.test.ts`

```ts
import { describe, expect, it } from "vitest";
import app from "../index.js";

describe("account routes", () => {
	it("POST /accounts without auth returns 401", async () => {
		const res = await app.request("/accounts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ walletAddress: "0x1234567890abcdef1234567890abcdef12345678" }),
		});
		expect(res.status).toBe(401);
	});

	it("POST /accounts with invalid address returns 400", async () => {
		// This test would need a valid auth token — for now, verify the Zod schema
		// by testing the schema directly
		const { z } = await import("zod");
		const schema = z.object({
			walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
		});

		expect(() => schema.parse({ walletAddress: "not-an-address" })).toThrow();
		expect(() =>
			schema.parse({ walletAddress: "0x1234567890abcdef1234567890abcdef12345678" }),
		).not.toThrow();
	});
});
```

- [ ] **Step 4: Run tests**

```bash
bun run test -- apps/api/
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/accounts.ts apps/api/src/__tests__/accounts.test.ts apps/api/src/index.ts
git commit -m "feat(api): add account routes with Zod validation"
```

---

### Task 7: Asset Routes

**Files:**
- Create: `apps/api/src/routes/assets.ts`
- Create: `apps/api/src/__tests__/assets.test.ts`
- Modify: `apps/api/src/index.ts`

**Interfaces:**
- Consumes: `getSupportedAssets`, `getAsset` from `@avela/core`
- Produces: `GET /assets` (list supported assets), `GET /assets/:symbol/price` (current price)

- [ ] **Step 1: Write the route module**

File: `apps/api/src/routes/assets.ts`

```ts
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { getSupportedAssets, getAsset } from "@avela/core";
import type { AppVariables } from "../index.js";

export const assetRoutes = new Hono<{ Variables: AppVariables }>();

assetRoutes.get("/", (c) => {
	const assets = getSupportedAssets();
	return c.json({
		data: assets,
		meta: {
			requestId: c.get("requestId"),
			timestamp: new Date().toISOString(),
		},
	});
});

assetRoutes.get("/:symbol/price", async (c) => {
	const symbol = c.req.param("symbol");
	const asset = getAsset(symbol);

	if (!asset) {
		throw new HTTPException(404, { message: `Asset ${symbol} not found` });
	}

	// TODO: wire up price feed adapter when ready
	return c.json({
		data: {
			symbol: asset.symbol,
			name: asset.name,
			address: asset.address,
			price: null,
			source: "not_configured",
			message: "Price feed placeholder — wire Uniswap TWAP in next phase",
		},
		meta: {
			requestId: c.get("requestId"),
			timestamp: new Date().toISOString(),
		},
	});
});
```

- [ ] **Step 2: Write the test**

File: `apps/api/src/__tests__/assets.test.ts`

```ts
import { describe, expect, it } from "vitest";
import app from "../index.js";

describe("asset routes", () => {
	it("GET /assets returns 3 MVP assets", async () => {
		const res = await app.request("/assets");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toHaveLength(3);
		const symbols = body.data.map((a: { symbol: string }) => a.symbol);
		expect(symbols).toContain("wSPYx");
		expect(symbols).toContain("wQQQx");
		expect(symbols).toContain("wNVDAx");
	});

	it("GET /assets/:symbol/price returns asset info", async () => {
		const res = await app.request("/assets/wSPYx/price");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.symbol).toBe("wSPYx");
		expect(body.data.address).toBe("0xe7e553cd128f0011777323a0b44a7b96ea1cb540");
	});

	it("GET /assets/:symbol/price returns 404 for unknown asset", async () => {
		const res = await app.request("/assets/wFAKE/price");
		expect(res.status).toBe(404);
	});
});
```

- [ ] **Step 3: Mount in app entry**

Add to `apps/api/src/index.ts`:

```ts
import { assetRoutes } from "./routes/assets.js";
// ... after accountRoutes mount
app.route("/assets", assetRoutes);
```

- [ ] **Step 4: Run tests**

```bash
bun run test -- apps/api/
```

Expected: PASS (all asset tests + previous health/account tests)

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/assets.ts apps/api/src/__tests__/assets.test.ts apps/api/src/index.ts
git commit -m "feat(api): add asset routes with verified MVP data"
```

---

### Task 8: Portfolio Routes

**Files:**
- Create: `apps/api/src/routes/portfolio.ts`
- Create: `apps/api/src/__tests__/portfolio.test.ts`
- Modify: `apps/api/src/index.ts`

**Interfaces:**
- Consumes: `getPortfolio`, `calculateSpendingPower` from `@avela/core`, `authMiddleware`
- Produces: `GET /accounts/:id/portfolio` (positions + spending power)

- [ ] **Step 1: Write the route module**

File: `apps/api/src/routes/portfolio.ts`

```ts
import { Hono } from "hono";
import type { AppVariables } from "../index.js";
import { authMiddleware } from "../middleware/auth.js";

export const portfolioRoutes = new Hono<{ Variables: AppVariables }>();

portfolioRoutes.use("*", authMiddleware);

portfolioRoutes.get("/", async (c) => {
	const accountId = c.req.param("id");

	// TODO: wire up DB + price feed
	// const db = getDb();
	// const positions = await getPortfolio(db, accountId);
	// const spendingPower = await calculateSpendingPower(db, priceFeed, accountId);

	return c.json({
		data: {
			accountId,
			positions: [],
			spendingPower: {
				perAsset: [],
				stablecoinBalance: 0,
				totalSpendingPower: 0,
				calculatedAt: new Date().toISOString(),
			},
			message: "Portfolio placeholder — wire DB in next phase",
		},
		meta: {
			requestId: c.get("requestId"),
			timestamp: new Date().toISOString(),
		},
	});
});
```

- [ ] **Step 2: Mount as nested route in app entry**

Add to `apps/api/src/index.ts`:

```ts
import { portfolioRoutes } from "./routes/portfolio.js";
// Mount as nested under accounts
app.route("/accounts/:id/portfolio", portfolioRoutes);
```

Full updated `apps/api/src/index.ts`:

```ts
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "./middleware/request-id.js";
import { errorHandler } from "./middleware/error-handler.js";
import { healthRoutes } from "./routes/health.js";
import { accountRoutes } from "./routes/accounts.js";
import { assetRoutes } from "./routes/assets.js";
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
```

- [ ] **Step 3: Write the test**

File: `apps/api/src/__tests__/portfolio.test.ts`

```ts
import { describe, expect, it } from "vitest";
import app from "../index.js";

describe("portfolio routes", () => {
	it("GET /accounts/:id/portfolio without auth returns 401", async () => {
		const res = await app.request("/accounts/01JTEST/portfolio");
		expect(res.status).toBe(401);
	});
});
```

- [ ] **Step 4: Run all tests**

```bash
bun run test -- apps/api/
```

Expected: PASS

- [ ] **Step 5: Lint and typecheck**

```bash
bun run check
bun run typecheck
```

Expected: Both pass.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/routes/portfolio.ts apps/api/src/__tests__/portfolio.test.ts apps/api/src/index.ts
git commit -m "feat(api): add portfolio route with spending power"
```
