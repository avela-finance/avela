# Avela

**A programmable spending account for tokenized stocks.** Lock tokenized stocks as collateral, spend without selling. Agents and humans both operate the account, with intelligence and messaging built in.

## What is Avela?

Avela turns tokenized stocks into spending power. Deposit tokenized stocks, lock them as collateral, and pay at checkout — your stocks stay in the market, the merchant gets paid in their currency. Programmable policies, agent permissions, and a WhatsApp-native messaging layer make this an account you configure, not just a card you tap.

Chain-agnostic by design — X Layer is the first deployment, Base is next. Any chain with liquid tokenized equities and stablecoin pools is a target. The endgame is bridging tokenized stocks with fiat onramps and local stablecoins, so users in Africa, Southeast Asia, and Latin America move between them without thinking about the plumbing.

**Phase 1** targets OKX Dev Day 2026 (submit Sep 25, finale Oct 6–7 Singapore) with 5 wrapped xStocks on X Layer, agent spending, WhatsApp access, and payment links.

## Workspace

```text
apps/
  site/         Marketing site (useavela.xyz)
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

- [useavela.xyz](https://useavela.xyz)
- [PRD](./docs/ideas/PRD.md) — product vision
- [SPEC](./docs/ideas/SPEC.md) — MVP scope, roadmap, verified onchain data
