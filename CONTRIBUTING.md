# Contributing to Avela

Thanks for building with us. Avela is a programmable spending account for tokenized stocks — every contribution should make *"pay from your portfolio without selling"* more real.

Please read [`README.md`](./README.md) before large changes. Locked decisions: vault+reserve settlement model, 5 MVP assets, TWAP oracle, no silent sells.

## Ground rules

- **Bun** is the package manager and script runner (`bun install`, `bun run <script>`, `bunx <pkg>` — never `npm`/`yarn`/`pnpm`/`npx`). **Node.js** is the production runtime — do not depend on Bun-specific runtime APIs.
- **Hono** for the API (not Express). **Drizzle ORM** for Postgres. **Zod** at every domain boundary. **ulidx** for entity IDs.
- **Biome** for lint + format (not ESLint/Prettier). Run `bun run check` before pushing.
- **Vitest** for TS tests (`bun run test`). **Foundry** (`forge test`) for contracts.
- **No mocks or workarounds** — use the production stack. If something is unresolved, leave a `TODO` note instead of faking it.
- **Never silently sell user stocks.** Any payment path that converts collateral without explicit user action is out of scope — reject it in review.
- Verify onchain claims with `onchainos` CLI / `cast` against X Layer — never guess addresses, liquidity, or pool state.

## Setup

```bash
bun install
cp .env.example .env        # DATABASE_URL, PRIVY_APP_ID/SECRET, XLAYER_RPC_URL,
                            # AVELA_VAULT_ADDRESS, AVELA_ROUTER_ADDRESS, SIGNER_PRIVATE_KEY,
                            # WhatsApp vars (optional), ALLOWED_ORIGINS (optional)
bun run dev                 # all apps in parallel
bun run dev:site            # marketing site only
bun run dev:web             # product dashboard only
```

Contracts:

```bash
cd contracts
forge build
forge test
forge script script/Deploy.s.sol --rpc-url $XLAYER_RPC_URL --broadcast
```

## Branching & PRs

- Branch from `main`: `feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>`.
- Keep PRs small and vertical (one feature slice: domain + API + surface, not one horizontal layer across everything).
- Every PR must pass before review:
  - `bun run check` (Biome)
  - `bun run typecheck` (`tsc --noEmit` per workspace)
  - `bun run test` (Vitest) + `forge test` if contracts touched
- PR description: what changed, why, how verified (commands + output), and any onchain proof (tx hashes / explorer links) for payment/contract changes.
- Architecture decisions (new dependency, data model, auth strategy, API shape) need a short rationale in the PR — significant ones become an ADR-style note under `docs/decisions/`.

## Code standards

- TypeScript: no `as any`, no `@ts-ignore` — fix the type.
- Domain logic lives in `packages/core`; `apps/api` is the HTTP boundary (validation + auth + wiring, not business rules).
- Contracts: OpenZeppelin v5 patterns, `SafeERC20`, `ReentrancyGuard`, custom errors (no string reverts), events for every state change, `forge` tests for every new function path.
- Frontend (Next.js + Tailwind v4 + shadcn/Radix): mobile-first PWA, no Bun runtime APIs, Geist font, Motion for animation.

## Docs

- Update the relevant guide in `docs/` (`agents.md`, `messaging.md`, `mcp.md`) when behavior changes.
- New agent tools, message templates, or API routes must be documented in `docs/mcp.md`, `docs/messaging.md`, or the API table in `README.md` in the same PR.
- Demo-facing changes: re-verify the demo video flow still matches reality.

## Questions & security

- Non-security questions: open an issue.
- **Security vulnerabilities: never file a public issue or PR.** Report privately per [`SECURITY.md`](./SECURITY.md).
