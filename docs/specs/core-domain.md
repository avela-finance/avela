# Spec: Core Domain Package (`packages/core`)

> **Scope:** This spec covers `packages/core` only — the shared domain layer. It is NOT the full Phase 1 product spec. API, web/PWA, X Layer adapters, and MCP agent are separate specs that depend on this package.

## Objective

Build `packages/core` — the foundational domain layer that the API, web app, and agent skill all depend on. This package owns the business rules, state machines, and data model for Avela's asset-based payment system. Everything else (Hono API, Next.js web, MCP skill) imports from core.

**Who uses this package:** `apps/api` (Hono), `apps/web` (Next.js), and the MCP agent skill. They call domain services; core never calls them.

**What success looks like:** A developer can import `@avela/core`, create an account, build a portfolio, create a payment intent, run it through funding policy + approval checks, settle it, and generate a receipt — all with type-safe interfaces, validated inputs, and auditable state transitions. Every domain rule from the PRD is enforced in this layer, not in the API or UI.

**Payment links:** Deferred to Phase 2. Core domain does not include payment request/invoice entities.

## Tech Stack

### Core (packages/core)

| Concern | Choice | Package | Why |
|---------|--------|---------|-----|
| Language | TypeScript (strict) | `typescript ^5` | Monorepo standard |
| Runtime | Node.js | — | Production stability; Bun is package manager only |
| Validation | Zod | `zod` | Runtime schema validation at domain boundaries |
| ORM | Drizzle | `drizzle-orm ^0.45`, `drizzle-kit ^0.31` | Type-safe Postgres, migrations, Drizzle Studio |
| Database | Supabase Postgres | `postgres` (driver) | Managed Postgres, production-grade from day one |
| Auth | Privy | `@privy-io/server-auth` (core), `@privy-io/react-auth` (web) | Web3 wallet auth, sessions, embedded wallets |
| IDs | ULID | `ulidx` | Sortable, compact, no coordination needed |
| Testing | Vitest | `vitest ^5` | Already configured at workspace root |
| Linting | Biome | `@biomejs/biome ^2.5` | Already configured at workspace root |

### Full platform stack (used across phases)

| Concern | Choice | Package | Phase |
|---------|--------|---------|-------|
| API framework | Hono | `hono` | Phase 1 (apps/api) |
| Frontend | Next.js | `next ^16` | Phase 1 (apps/web) |
| UI | shadcn/ui + Radix | `radix-ui`, `shadcn` | Phase 1 (apps/web) |
| Styling | Tailwind v4 | `tailwindcss ^4` | Phase 1 |
| Animation | Motion | `motion` | Phase 1 |
| Font | Geist | `geist` | Phase 1 |
| Client state | Zustand | `zustand` | Phase 1 (apps/web) |
| Server state | TanStack Query | `@tanstack/react-query` | Phase 1 (apps/web) |
| Email | Resend | `resend` | Phase 2+ (notifications, receipts) |
| Redis | Upstash | `@upstash/redis` | Phase 2+ (rate limiting, caching, jobs) |
| Background jobs | Upstash QStash | `@upstash/qstash` | Phase 2+ (settlement polling, approval expiry) |

## Commands

```
Install:    bun install
Test:       bun run test (runs vitest from workspace root)
Lint:       bun run check (runs biome from workspace root)
Typecheck:  bun run typecheck (runs tsc from workspace root)
Dev:        bun run dev (when API/web apps exist)
DB migrate: bun run --cwd packages/core db:migrate
DB push:    bun run --cwd packages/core db:push
DB studio:  bun run --cwd packages/core db:studio
```

## Project Structure

```
packages/core/
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── src/
│   ├── index.ts                    # Public API barrel export
│   ├── schema/                     # Drizzle table definitions (8 tables)
│   │   ├── account.ts
│   │   ├── portfolio.ts
│   │   ├── payment-intent.ts
│   │   ├── payment-event.ts        # Audit trail for state transitions
│   │   ├── funding-policy.ts
│   │   ├── approval.ts
│   │   ├── agent-permission.ts
│   │   ├── receipt.ts
│   │   └── index.ts
│   ├── domain/                     # Pure business logic
│   │   ├── payment-intent.ts       # State machine + transitions
│   │   ├── funding-policy.ts       # Stablecoin-first funding engine
│   │   ├── approval.ts             # Threshold-based approval rules
│   │   ├── agent-permission.ts     # Agent access control
│   │   ├── asset-eligibility.ts    # Which assets can fund a payment
│   │   ├── spending-power.ts       # Available spending power calculation
│   │   └── receipt.ts              # Receipt generation
│   ├── services/                   # Orchestration (coordinates domain + adapters)
│   │   ├── payment.service.ts      # Create intent → fund → settle → receipt
│   │   ├── account.service.ts      # Account CRUD + portfolio queries
│   │   └── quote.service.ts        # Funding plan preview without execution
│   ├── adapters/                   # Port interfaces (contracts, not implementations)
│   │   ├── auth.adapter.ts          # Authentication (Privy)
│   │   ├── wallet.adapter.ts       # Wallet connection, signing
│   │   ├── price.adapter.ts        # Asset pricing
│   │   ├── liquidity.adapter.ts    # Swap/conversion execution
│   │   ├── settlement.adapter.ts   # Onchain transfer
│   │   └── index.ts
│   ├── adapters-impl/              # Concrete adapter implementations
│   │   └── xlayer/                 # X Layer implementations (spec #2)
│   ├── db/                         # Database connection + migrations
│   │   ├── client.ts               # Drizzle client factory
│   │   ├── migrate.ts              # Migration runner
│   │   └── migrations/             # Generated SQL migrations
│   ├── errors.ts                   # Domain error types
│   └── types.ts                    # Shared types, enums, branded IDs
└── tests/
    ├── domain/
    │   ├── payment-intent.test.ts
    │   ├── funding-policy.test.ts
    │   ├── approval.test.ts
    │   ├── agent-permission.test.ts
    │   ├── asset-eligibility.test.ts
    │   └── spending-power.test.ts
    ├── services/
    │   ├── payment.service.test.ts
    │   ├── account.service.test.ts
    │   └── quote.service.test.ts
    └── helpers/
        └── fixtures.ts             # Test data factories
```

## Code Style

One real example showing the target style for domain logic:

```ts
import { z } from "zod";

// Branded IDs prevent mixing account IDs with payment IDs
type AccountId = string & { readonly __brand: "AccountId" };
type PaymentIntentId = string & { readonly __brand: "PaymentIntentId" };

// Zod schema validates at domain boundary, not inside domain functions
const CreatePaymentIntentInput = z.object({
	accountId: z.string().min(1),
	recipientAddress: z.string().min(1),
	amount: z.string().regex(/^\d+(\.\d+)?$/),
	currency: z.literal("USDC"),
	memo: z.string().max(256).optional(),
});

type CreatePaymentIntentInput = z.infer<typeof CreatePaymentIntentInput>;

// State machine — explicit states, typed transitions, no string unions
const PAYMENT_STATES = {
	draft: "draft",
	awaiting_approval: "awaiting_approval",
	funding: "funding",
	settling: "settling",
	completed: "completed",
	failed: "failed",
	cancelled: "cancelled",
} as const;

type PaymentState = (typeof PAYMENT_STATES)[keyof typeof PAYMENT_STATES];

// Transitions are a whitelist — anything not listed is rejected
const VALID_TRANSITIONS: Record<PaymentState, PaymentState[]> = {
	draft: ["awaiting_approval", "funding", "cancelled"],
	awaiting_approval: ["funding", "cancelled"],
	funding: ["settling", "failed"],
	settling: ["completed", "failed"],
	completed: [],
	failed: [],
	cancelled: [],
};

function transitionPayment(current: PaymentState, next: PaymentState): PaymentState {
	if (!VALID_TRANSITIONS[current].includes(next)) {
		throw new PaymentTransitionError(current, next);
	}
	return next;
}
```

**Conventions:**
- Tabs for indentation, double quotes, semicolons, trailing commas (Biome config)
- No `as any`, no `@ts-ignore`, no `@ts-expect-error`
- Domain functions are pure when possible — take data in, return data out
- Side effects (DB writes, adapter calls) happen in services, not domain functions
- Errors are typed domain errors, not generic `Error`
- Zod validates at the boundary; inner domain functions receive already-validated types

## Domain Model

### Entities

**Account**
- `id` (branded AccountId, ULID)
- `externalUserId` (opaque string from auth provider — currently Privy, but core does not depend on Privy)
- `name`, `type` (business | operator | agent)
- `walletAddress` (connected X Layer wallet)
- `createdAt`, `updatedAt`

> **Provider independence:** The core domain uses `externalUserId` — an opaque auth provider ID. Privy is the concrete auth adapter that supplies this ID. Core never imports `@privy-io/server-auth`; the auth adapter interface abstracts it.

**PortfolioPosition**
- `accountId`, `asset` (USDC | xSTOCK), `balance`, `lockedBalance`
- `chainId` (e.g., `195` for X Layer mainnet)
- `tokenAddress` (onchain contract address, null for native assets)
- `decimals` (token decimal precision, e.g., 6 for USDC, 18 for xStocks)
- `assetType` (`stablecoin` | `xstock`)
- `lastPriceUsd`, `lastPriceAt`
- `priceSource` (which adapter/oracle provided the price)
- Spending power = balance - lockedBalance - reserveMinimum

**PaymentIntent**
- `id` (branded PaymentIntentId, ULID)
- `accountId`, `recipientAddress`, `amount`, `currency`
- `memo`, `idempotencyKey`
- `state` (the 7-state machine)
- `fundingPlan` (JSON: which assets, how much from each)
- `approvalId` (nullable)
- `settlementTxHash` (nullable)
- `createdAt`, `updatedAt`, `completedAt`

**FundingPolicy**
- `accountId`
- `reserveMinimum` (minimum USDC balance to protect — always denominated in USDC)
- `approvalThreshold` (USDC amount above which human approval is required)
- `dailyCap` (maximum USDC equivalent spend per calendar day UTC, including pending payments)
- `priceFloor` (minimum acceptable USD price per share for stock conversion — per-asset in future, global in Phase 1)
- `executionLimit` (max single conversion amount in USDC equivalent)

> **Concurrency:** When a payment enters `funding` state, the required amount is added to `lockedBalance` on the relevant portfolio positions. This prevents concurrent payments from overspending. Locks are released on `completed`, `failed`, or `cancelled`.
>
> **Staleness:** If the stock price used in the funding plan is older than 60 seconds at execution time, the payment transitions to `failed` with reason `stale_price`. The approval snapshot includes the price timestamp.
>
> **Liquidity change:** If the actual swap output differs from the quoted amount by more than the slippage tolerance (default 1%), the payment transitions to `failed` with reason `slippage_exceeded`.

**Approval**
- `id`, `paymentIntentId`, `approverAccountId`
- `status` (pending | approved | rejected | expired)
- `expiresAt`, `decidedAt`
- `snapshotAmount`, `snapshotRecipient`, `snapshotFundingPlan` (immutable at creation — prevents reuse for different payment)

**AgentPermission**
- `accountId`, `agentId`
- `allowedAssets`, `maxTransaction`, `dailyLimit`
- `approvedRecipients` (list or wildcard)
- `requireApproval` (boolean override)
- `expiresAt`, `revokedAt`

**Receipt**
- `paymentIntentId`
- `payer`, `recipient`, `amount`, `currency`
- `fundingSource` (stablecoin, stock conversion, mixed)
- `policyDecision` (JSON: what rules were checked, what passed/failed)
- `approvalRecord` (JSON: who approved, when, what they saw)
- `executionRefs` (JSON: tx hashes, provider refs)
- `timestamps` (created, funded, settled, completed)

### State Machine

```
draft ──→ awaiting_approval ──→ funding ──→ settling ──→ completed
  │                │                │          │
  └──→ cancelled   └──→ cancelled   └──→ failed └──→ failed
```

Every transition produces an auditable event: `{ intentId, from, to, reason, actor, timestamp }`.

**Partial failure rules (Phase 1):**
- Conversion succeeded but settlement failed → transition to `failed` with reason `settlement_failed_after_conversion`. The converted funds remain in the account (no loss). A future retry mechanism can re-attempt settlement.
- Settlement succeeded but receipt creation failed → transition to `completed` (settlement is the source of truth). Receipt creation retries asynchronously. Never block completion on receipt generation.
- Quote expired before execution → transition to `failed` with reason `quote_expired`. User must create a new intent.
- Chain confirmation pending → remain in `settling` state. A background job (Upstash QStash, Phase 2) polls for confirmation. Phase 1: the service polls once and either confirms or fails.

### Funding Policy Engine

Priority order:
1. Check daily cap — reject if exceeded
2. Check recipient approval (for agent-initiated payments)
3. Calculate available stablecoin balance (balance - locked - reserve)
4. If stablecoin covers full amount → fund from stablecoin
5. If shortfall → check asset eligibility for stock conversion
6. Check price floor, execution limit, and liquidity availability
7. Build funding plan: `{ stablecoinAmount, conversionAmount, conversionAsset }`
8. Check approval threshold — if total exceeds threshold, route to `awaiting_approval`
9. Return funding plan or rejection with reason

### Adapter Interfaces

```ts
interface AuthAdapter {
	verifyToken(token: string): Promise<{ userId: string }>;
	getUser(userId: string): Promise<{ externalUserId: string; walletAddress: string } | null>;
}

interface PriceAdapter {
	getPrice(asset: string): Promise<{
		priceUsd: string;
		timestamp: Date;
		source: string;      // e.g., "okx-dex", "coingecko"
	}>;
}

interface LiquidityAdapter {
	getQuote(params: {
		fromAsset: string;
		toAsset: string;
		amount: string;
		fromChainId: number;
		toChainId: number;
		slippageTolerance: string;   // e.g., "0.01" for 1%
	}): Promise<{
		expectedOut: string;
		route: string;
		provider: string;
		expiresAt: Date;
		priceImpact: string;
	}>;
	executeSwap(quote: Quote): Promise<{ txHash: string; actualOut: string }>;
}

interface SettlementAdapter {
	transfer(params: {
		to: string;
		asset: string;
		amount: string;
		chainId: number;
		tokenAddress: string;
	}): Promise<{ txHash: string; confirmed: boolean }>;
	confirmTransfer(txHash: string, chainId: number): Promise<{
		confirmed: boolean;
		blockNumber: number;
	}>;
}

interface WalletAdapter {
	getAddress(): Promise<string>;
	signTransaction(params: {
		chainId: number;
		to: string;
		value: string;
		data: string;
	}): Promise<string>;
}
```

Adapter implementations use real tools from day one. Where an integration is unresolved (e.g., exact xStock liquidity route on X Layer), the implementation contains a `// TODO:` with what needs verification — not an elaborate mock layer. Tests use lightweight stubs inline, not a separate mock package. The `resources/` directory contains research repos (OKX DEX SDK, Uniswap SDKs, Backed token contracts, etc.) that inform real adapter implementations.

**Auth** uses Privy as the concrete auth adapter. Core defines `AuthAdapter` as an interface; `@privy-io/server-auth` is imported only in the adapter implementation, never in domain code.

## Testing Strategy

**Framework:** Vitest (workspace root config)
**Location:** `packages/core/tests/` mirrors `src/` structure

**Test levels:**

| Level | What | Where | Runner |
|-------|------|-------|--------|
| Unit | Domain functions (pure logic) | `tests/domain/` | Vitest |
| Integration | Services with mock adapters | `tests/services/` | Vitest |
| DB integration | Schema + queries against real Postgres | `tests/db/` (future) | Vitest + testcontainers |

**Coverage targets:**
- Domain functions: 100% branch coverage (state machine, policy engine, approval rules)
- Services: happy path + every error/rejection path
- Adapters: tested through service integration tests with mocks

**What to test first (priority order):**
1. Payment intent state machine — every valid transition, every invalid transition rejected
2. Funding policy engine — stablecoin-only, mixed funding, rejection cases (cap exceeded, below reserve, price floor)
3. Approval rules — threshold enforcement, snapshot immutability, expiry
4. Agent permissions — within limits, exceeds limits, expired, revoked
5. Spending power calculation — balance, locked, reserve interactions
6. Payment service orchestration — full happy path, adapter failure handling

**Fixtures:** `tests/helpers/fixtures.ts` provides factory functions for test data (accounts, positions, intents).

## Boundaries

### Always do
- Validate inputs with Zod at service boundaries
- Enforce state machine transitions — no skipping states
- Record policy decisions in the funding plan before execution
- Use branded IDs to prevent type confusion
- Use idempotency keys for payment creation
- Fail closed on stale prices, missing liquidity, or adapter errors
- Run `bun run check` and `bun run typecheck` before reporting done

### Ask first
- Database schema changes after initial migration
- Adding new dependencies to `packages/core`
- Changing the state machine (adding/removing states or transitions)
- Changing adapter interfaces (breaking contract for implementations)

### Never do
- Put HTTP/framework concerns in `packages/core`
- Hardcode X Layer addresses or provider details in domain logic
- Allow payment execution without a funding plan
- Mark settlement complete without onchain confirmation
- Expose private keys or signing material through any interface
- Suppress TypeScript errors

## Success Criteria

1. `packages/core` exports typed domain services that can create an account, view portfolio, create a payment intent, run it through the funding policy, handle approval, and produce a receipt
2. Payment intent state machine enforces all 7 states with valid transitions only
3. Funding policy engine implements stablecoin-first logic with reserve, cap, threshold, and price floor checks
4. Approval system prevents reuse of approvals for materially different payments (snapshot comparison)
5. Agent permissions enforce transaction limits, daily limits, recipient restrictions, and expiry
6. All domain logic is tested with Vitest — state machine at 100% branch coverage
7. Adapter interfaces are defined and mock implementations work for testing
8. Drizzle schema covers all entities with proper relations and indexes
9. `bun run check`, `bun run typecheck`, and `bun run test` all pass
10. No framework dependencies (Hono, Next.js, React) in the package

## Resolved Decisions

1. **ULID for IDs** — sortable, compact, no coordination. Use `ulidx` package.
2. **Multi-currency schema** — schema supports a `currency` column (not hardcoded USDC), but Phase 1 only validates USDC. Minimal cost, avoids schema migration later.
3. **Drizzle migrations** — `drizzle-kit push` for dev, `drizzle-kit generate` + `drizzle-kit migrate` for prod.
4. **Event storage** — separate `payment_events` table. Cleaner for audit queries, aligns with PRD's emphasis on receipts and audit trail.
5. **Auth** — Privy for Web3 wallet auth, accessed through `AuthAdapter` interface. Core domain uses `externalUserId` (provider-independent). Privy is imported only in the adapter implementation layer, not in domain code. Drizzle is the ORM — it has nothing to do with auth.
6. **No mocks or workarounds** — strict rule. Use production tools/stack. If unresolved or unverified, leave a `// TODO:` note. Never build mock/stub layers as production code.
7. **Database hosting** — Supabase managed Postgres. `postgres` driver.
8. **Future tools noted** — Resend (email, Phase 2+), Upstash Redis (caching/rate-limits, Phase 2+), Upstash QStash (background jobs, Phase 2+). Not dependencies of packages/core yet.
9. **Payment links deferred** — Payment request/invoice entities are Phase 2. Core domain focuses on the payment intent flow.
10. **Partial failures** — Phase 1 supports only atomic or clearly recoverable flows. Unresolved partial states transition to `failed` with a descriptive reason. Never silently mark a payment `completed`.
11. **Provider independence** — Core domain uses `externalUserId` and adapter interfaces. No direct imports of `@privy-io/server-auth` in domain or service code. Privy lives in the adapter layer.
