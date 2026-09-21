# Feature Specs

Broken from [SPEC.md](../ideas/SPEC.md) §2.4. Each spec defines one feature's objective, scope, domain model, interfaces, and success criteria.

## Dependency Graph

```
                    ┌──────────────┐
                    │  core-account │ ← foundation
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
     ┌────────▼──┐  ┌──────▼──────┐  ┌──▼───────────┐
     │ spending-  │  │  funding-   │  │  identity-   │
     │ policy     │  │  engine     │  │  and-links   │
     └────┬───────┘  └──────┬──────┘  └──────────────┘
          │                 │
    ┌─────┼─────┐     ┌────┴────┐
    │           │     │         │
┌───▼────┐ ┌───▼──┐  │    ┌────▼────┐
│ agent- │ │watch-│  │    │checkout │
│ perms  │ │ er   │  │    └─────────┘
└───┬────┘ └──────┘  │
    │                 │
    ▼                 │
┌──────────────┐      │
│  whatsapp-   │◄─────┘
│  access      │  ← depends on agent-perms for approval routing
└──────────────┘

         ┌──────────────┐
         │     api      │ ← HTTP boundary for all domain features
         └──────┬───────┘
                │
    ┌───────────┼───────────┐
    │                       │
┌───▼──────────┐    ┌───────▼──────┐
│ web-dashboard│    │marketing-site│
└──────────────┘    └──────────────┘
```

## Build Order (Critical Path)

| Phase | Features | Why |
|-------|----------|-----|
| **1. Foundation** | `core-account`, `api` | Everything depends on account model + HTTP layer |
| **2. Payment** | `funding-engine`, `spending-policy` | Payment execution depends on both |
| **3. Intelligence** | `agent-permissions`, `watcher` | Differentiator — depends on payment pipeline, no messaging dependency |
| **4. Messaging** | `whatsapp-access` | Messaging access — depends on agent-permissions for approval routing |
| **5. Commerce** | `checkout`, `identity-and-links` | Demo experience, depends on funding engine |
| **6. Surfaces** | `web-dashboard`, `marketing-site` | UI wrapping all features. Marketing site can start in parallel from Phase 1 |

## Specs

| Feature | Spec | Domain |
|---------|------|--------|
| [API](api.md) | Hono backend, route modules, middleware | Foundation |
| [Core Account](core-account.md) | Account, portfolio, positions, spending power, haircuts | Foundation |
| [Funding Engine](funding-engine.md) | Payment intents, funding source selection, Uniswap V3 swaps, settlement | Payment |
| [Spending Policy](spending-policy.md) | Daily limits, approval thresholds, price floors | Payment |
| [Agent Permissions](agent-permissions.md) | Scoped agent spending, MCP skills, permission dashboard | Intelligence |
| [WhatsApp Access](whatsapp-access.md) | Interactive messages, inline approval, notifications | Messaging |
| [Watcher](watcher.md) | Spending power threshold alerts, WATCH→EVALUATE→DECIDE→AUTHORIZE→EXECUTE loop | Intelligence |
| [Checkout](checkout.md) | Demo merchant storefront, "Pay with Avela" button, receipts | Commerce |
| [Identity & Links](identity-and-links.md) | Usernames, payment links (pay.avela.xyz/username) | Commerce |
| [Web Dashboard](web-dashboard.md) | PWA, portfolio view, policies, agent dashboard, receipts | Surface |
| [Marketing Site](marketing-site.md) | avela.xyz product story, how it works | Surface |
