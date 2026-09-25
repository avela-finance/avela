# Spec: API (apps/api)

> Broken from [SPEC.md](../ideas/SPEC.md) §2.4, §4.1–4.5. Foundation layer — all surfaces depend on this.

## Objective

Hono backend that powers every Avela surface (web dashboard, marketing site, WhatsApp bot, MCP skills, demo checkout). Provides account operations, payment intents, settlement orchestration, agent auth, and real-time pricing. Runs on Node.js in production, Bun for dev.

## Scope

**In:**
- Hono HTTP framework with typed routes
- Supabase Postgres via Drizzle ORM (schema, migrations, connection)
- Zod validation at every domain boundary
- Privy server-auth for wallet authentication and agent wallet verification
- ULID generation (ulidx) for all entity IDs
- Health check, readiness, and version endpoints
- CORS, rate limiting basics, error handling middleware
- Environment config with Zod validation
- Route modules: accounts, assets, payments, policies, agents, identity
- X Layer RPC integration (chain 196, `https://rpc.xlayer.tech`)

**Out:**
- Business logic lives in `packages/core` — API is the HTTP boundary, not the domain
- No GraphQL — REST + JSON
- No WebSocket for MVP — polling for payment status
- No admin routes for MVP

## Domain Model

The API exposes domain types defined in `packages/core`. API-specific types:

```ts
// Route context
type AppEnv = {
  Bindings: {
    DATABASE_URL: string
    PRIVY_APP_ID: string
    PRIVY_APP_SECRET: string
    XLAYER_RPC_URL: string // default: https://rpc.xlayer.tech
  }
}

// Standardized API response
type ApiResponse<T> = {
  data: T
  meta?: { requestId: string; timestamp: string }
}

type ApiError = {
  error: { code: string; message: string; details?: unknown }
  meta: { requestId: string; timestamp: string }
}
```

## Interfaces

### Route Modules

| Module | Prefix | Purpose |
|--------|--------|---------|
| health | `/health` | Liveness, readiness, version |
| accounts | `/accounts` | Create, get, list accounts |
| assets | `/assets` | Supported assets, prices, eligibility |
| portfolio | `/accounts/:id/portfolio` | Positions, spending power, deposits |
| payments | `/payments` | Create intent, authorize, execute, status, receipts |
| policies | `/accounts/:id/policies` | Spending policies, approval rules |
| agents | `/agents` | Agent registration, permissions, spending log |
| identity | `/identity` | Username registration, payment link resolution |

### Key Endpoints (MVP)

```
GET  /health
GET  /health/ready

POST /accounts                    — create account (Privy auth)
GET  /accounts/:id                — get account with portfolio summary
GET  /accounts/:id/portfolio      — positions, spending power
POST /accounts/:id/deposit        — initiate deposit of wrapped xStock

GET  /assets                      — list supported assets (wSPYx, wQQQx, wNVDAx)
GET  /assets/:symbol/price        — current price + pool data

POST /payments/intent             — create payment intent
GET  /payments/:id                — payment status + receipt
POST /payments/:id/authorize      — approve pending payment
POST /payments/:id/reject         — reject pending payment

GET  /accounts/:id/policies       — get spending policies
PUT  /accounts/:id/policies       — update spending policies

POST /agents                      — register agent with permissions
GET  /agents/:id/permissions      — get agent permission scope
GET  /agents/:id/spending-log     — agent spending history

POST /identity/register           — register username
GET  /identity/resolve/:username  — resolve to account
```

### Middleware Stack

1. Request ID injection (ULID)
2. CORS
3. Privy auth verification (protected routes)
4. Zod request validation
5. Error handler (catches, formats ApiError)

## Dependencies

- **packages/core** — all domain logic, types, adapters
- **Privy** — `@privy-io/server-auth` for token verification
- **Drizzle** — `drizzle-orm` + `drizzle-kit` + `postgres` driver
- **Zod** — request/response validation schemas
- **ulidx** — ID generation
- **viem** — X Layer RPC calls (price feeds, contract reads)

## Project Structure

```
apps/api/
├── src/
│   ├── index.ts              — Hono app entry, middleware, mount routes
│   ├── env.ts                — Zod env schema + validation
│   ├── middleware/
│   │   ├── auth.ts           — Privy token verification
│   │   ├── error-handler.ts  — Catch-all error formatting
│   │   └── request-id.ts     — ULID request ID injection
│   └── routes/
│       ├── health.ts
│       ├── accounts.ts
│       ├── assets.ts
│       ├── portfolio.ts
│       ├── payments.ts
│       ├── policies.ts
│       ├── agents.ts
│       └── identity.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Success Criteria

1. `bun run dev` starts the API on a local port with hot reload
2. `GET /health` returns 200 with version
3. `GET /health/ready` checks DB connection and returns status
4. All routes validate input with Zod — invalid requests return 400 with structured error
5. Privy auth middleware rejects unauthenticated requests with 401
6. All entity IDs are ULIDs
7. `bun run typecheck` passes with zero errors
8. `bun run check` (Biome) passes
9. At least one integration test per route module

## Open Questions

- Rate limiting strategy: Upstash Redis (noted in AGENTS.md as future) or in-memory for MVP?
- API versioning: `/v1/` prefix from the start or defer?
