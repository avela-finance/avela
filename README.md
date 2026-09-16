# Avela

**The asset-based payment and commerce rail.** One global account to hold, grow, and spend against your tokenized stocks, crypto and cash — without selling.

## What is Avela?

Avela lets people, businesses, and agents use eligible portfolio value to fund real payments. Instead of manually selling assets, finding conversion routes, and managing approvals — Avela handles it under configurable spending policies.

**Phase 1** brings tokenized stocks and stablecoins together on X Layer, with policy-controlled payments, approvals, settlement, and receipts.

## Workspace

```text
apps/
  site/         Marketing site (avela.xyz)
  web/          Product dashboard (Next.js)
  api/          Backend API (planned)

packages/
  core/         Shared domain, adapters, and orchestration
```

## Getting started

```bash
bun install
bun run dev          # start all apps in parallel
bun run dev:site     # marketing site only
bun run dev:web      # product dashboard only
bun run build        # build all apps
bun run test         # run tests
bun run check        # biome lint + format
bun run typecheck    # typescript type check
```

## Links

- [avela.xyz](https://avela.xyz)
- [Phase 1 PRD](./docs/ideas/PRD.md)
