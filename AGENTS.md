# AGENTS.md

Canonical project guidance for AI agents working in this repo.

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
- **Privy** (`@privy-io/server-auth`, `@privy-io/react-auth`) — Web3 wallet auth and sessions
- **ulidx** — ULID generation for entity IDs

## Future Stack (noted, not yet dependencies)

- **Resend** — Transactional email (payment receipts, notifications)
- **Upstash Redis** — Rate limiting, caching
- **Upstash QStash** — Background jobs (settlement polling, approval expiry)
- **Zustand** — Client-side state (apps/web)
- **TanStack Query** — Server state management (apps/web)

## Workspace

Bun workspace with `apps/*` and `packages/*`.

```
apps/site     — Marketing site (Next.js, avela.xyz)
apps/web      — Product dashboard (Next.js)
apps/api      — Backend API (planned)
packages/core — Shared domain, adapters, and orchestration
```

## Scripts

| Command | What it does |
|---------|-------------|
| `bun run dev` | Start all apps in parallel |
| `bun run dev:site` | Marketing site only |
| `bun run dev:web` | Product dashboard only |
| `bun run build` | Build all apps |
| `bun run test` | Run tests |
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
