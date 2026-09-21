# AGENTS.md

Canonical project guidance for AI agents working in this repo.

## Product

**Avela** — a programmable spending account for tokenized stocks. Pay from your portfolio without selling. Agents and humans both operate the account, with intelligence and messaging built in.

**Source of truth:**
- Product vision: [`docs/ideas/PRD.md`](docs/ideas/PRD.md)
- MVP scope, roadmap, technical choices: [`docs/ideas/SPEC.md`](docs/ideas/SPEC.md)
- Feature specs (broken from SPEC.md): `docs/specs/<feature>.md`
- Implementation plans: `docs/plans/<feature>.md`

Read PRD.md and SPEC.md before making architectural decisions. They contain verified onchain data, contract addresses, and provider decisions.

## Runtime

**Bun** is the package manager and script runner. **Node.js** is the production runtime.

- `bun install` not `npm` / `yarn` / `pnpm`
- `bun run <script>` not `npm run`
- `bunx <pkg>` not `npx`
- Apps run on Node.js in production — do not depend on Bun-specific runtime APIs.

## Backend Stack

- **Hono** — HTTP framework (not Express, not Bun.serve)
- **Drizzle ORM** (`drizzle-orm` + `drizzle-kit`) — Type-safe Postgres access and migrations
- **Zod** — Runtime validation at domain boundaries
- **Supabase Postgres** — Managed database (`postgres` driver)
- **Privy** (`@privy-io/server-auth`, `@privy-io/react-auth`) — Web3 wallet auth, embedded wallets, agent wallets, scoped permissions
- **ulidx** — ULID generation for entity IDs

## Chain & Settlement

- **X Layer** (chain ID 196) — primary chain
- **Uniswap V3** — all xStock stablecoin pools
- **USDG + USDC** — both supported, routed per-asset by pool depth
- **onchainos CLI** — live market data, token queries, wallet operations (`/Users/samueldanso/.local/bin/onchainos`)
- Use `onchainos token search`, `onchainos token liquidity`, `onchainos token price-info` for any X Layer data verification — do not guess or rely on internet searches when onchain tools are available.

## Future Stack (noted, not yet dependencies)

- **Resend** — Transactional email (payment receipts, notifications)
- **Upstash Redis** — Rate limiting, caching
- **Upstash QStash** — Background jobs (settlement polling, approval expiry)
- **Zustand** — Client-side state (apps/web)
- **TanStack Query** — Server state management (apps/web)
- **WhatsApp Business API** — Messaging access (MVP)
- **MCP** — Agent skill exposure

## Workspace

Bun workspace with `apps/*` and `packages/*`.

```
apps/site     — Marketing site (Next.js, avela.xyz)
apps/web      — Product dashboard (Next.js, PWA, mobile-first)
apps/api      — Backend API (Hono)
packages/core — Shared domain, adapters, and orchestration
```

## Scripts

| Command | What it does |
|---------|-------------|
| `bun run dev` | Start all apps in parallel |
| `bun run dev:site` | Marketing site only |
| `bun run dev:web` | Product dashboard only |
| `bun run build` | Build all apps |
| `bun run test` | Run tests (Vitest) |
| `bun run check` | Biome lint + format check |
| `bun run typecheck` | TypeScript type check |

## Linting & Formatting

Uses **Biome** (not ESLint/Prettier). Run `bun run check` before committing.

## Frontend

Both `site` and `web` are Next.js apps using:
- Tailwind CSS v4
- shadcn/ui + Radix
- Geist font
- Motion (Framer Motion)

## Testing

Uses **Vitest** for production test suite. Run with `bun run test`.

```ts
import { describe, it, expect } from "vitest";

describe("example", () => {
  it("works", () => {
    expect(1).toBe(1);
  });
});
```

## Key Decisions

These are locked and should not be revisited without explicit discussion:

- **Avela never silently converts or sells a user's stocks at checkout.** If spending power is insufficient, the payment fails — the user decides what to do next.
- **No mocks or workarounds** — use production tools/stack. If unresolved, leave a TODO note.
- **Intelligence layer (agent spending, watchers, messaging) is MVP scope**, not Phase 2/3. This is the differentiator.
- **Both USDG and USDC supported** — routed per-asset by pool depth, not a single-stablecoin constraint.
- **All xStocks on X Layer are wrapped (ERC-4626).** Raw xStocks are rebasing tokens; only wrapped versions trade on Uniswap.
