# Avela

**A programmable spending account for tokenized stocks.** Pay from your portfolio without selling. Agents and humans both operate the account, with intelligence and messaging built in.

## What is Avela?

Avela turns tokenized stocks into spending power. Deposit, see what you can spend, and pay at checkout — your stocks stay in the market, the merchant gets paid in their currency. Programmable policies, agent permissions, and a WhatsApp-native messaging layer make this an account you configure, not just a card you tap.

**Phase 1** targets OKX Dev Day 2026 (submit Sep 25, finale Oct 6–7 Singapore) with 3 wrapped xStocks on X Layer, agent spending, WhatsApp access, and payment links.

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
- [PRD](./docs/ideas/PRD.md) — product vision
- [SPEC](./docs/ideas/SPEC.md) — MVP scope, roadmap, verified onchain data
