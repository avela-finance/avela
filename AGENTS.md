# AGENTS.md

Canonical project guidance for AI agents working in this repo.

## Runtime

Default to **Bun** for everything — runtime, package manager, test runner, bundler.

- `bun <file>` not `node` / `ts-node`
- `bun install` not `npm` / `yarn` / `pnpm`
- `bun run <script>` not `npm run`
- `bunx <pkg>` not `npx`
- `bun test` not `jest` / `vitest`
- Bun auto-loads `.env` — no `dotenv`.

## Bun APIs

Prefer built-in Bun APIs over third-party equivalents:

- `Bun.serve()` — HTTP, WebSocket, routes (not `express` / `ws`)
- `bun:sqlite` (not `better-sqlite3`)
- `Bun.redis` (not `ioredis`)
- `Bun.sql` for Postgres (not `pg` / `postgres.js`)
- `Bun.file` over `node:fs` readFile/writeFile
- `Bun.$\`cmd\`` over `execa`

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
