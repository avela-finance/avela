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
     │    api    │  │ identity-   │  │  contracts   │
     │          │  │ and-links   │  │ (Foundry)    │
     └────┬──────┘  └─────────────┘  └──────┬───────┘
          │                                 │
          │         ┌───────────────────────┘
          │         │
    ┌─────┼─────────┼─────┐
    │     │         │     │
┌───▼─────▼──┐ ┌───▼─────▼──┐
│ funding-   │ │  spending- │
│ engine     │ │  policy    │
└──────┬─────┘ └──────┬─────┘
       │              │
       │        ┌─────┼─────┐
       │        │           │
       │   ┌────▼────┐ ┌───▼──┐
       │   │ agent-  │ │watch-│
       │   │ perms   │ │ er   │
       │   └────┬────┘ └──────┘
       │        │
       │        ▼
       │   ┌──────────────┐
       └──►│  whatsapp-   │ ← depends on agent-perms for approval routing
           │  access      │
           └──────────────┘

              ┌────────────┐
              │  checkout   │ ← depends on funding-engine
              └────────────┘

    ┌───────────┬───────────┐
    │                       │
┌───▼──────────┐    ┌───────▼──────┐
│ web-dashboard│    │marketing-site│
└──────────────┘    └──────────────┘
```

## Build Order (Critical Path)

| Phase | Features | Why |
|-------|----------|-----|
| **1. Foundation** | `core-account`, `api` | Everything depends on account model + HTTP layer |
| **2. Contracts** | `contracts` | Vault + Router must exist before funding engine can interact with them |
| **3. Payment** | `funding-engine`, `spending-policy` | Now uses vault+reserve model, not per-payment swaps |
| **4. Intelligence** | `agent-permissions`, `watcher` | Differentiator — depends on payment pipeline, no messaging dependency |
| **5. Messaging** | `whatsapp-access` | Messaging access — depends on agent-permissions for approval routing |
| **6. Commerce** | `checkout`, `identity-and-links` | Demo experience, depends on funding engine |
| **7. Surfaces** | `web-dashboard`, `marketing-site` | UI wrapping all features. Marketing site can start in parallel from Phase 1 |

## Specs

| Feature | Spec | Domain |
|---------|------|--------|
| [Core Account](core-account.md) | Account, portfolio, positions, spending power, haircuts | Foundation |
| [API](api.md) | Hono backend, route modules, middleware | Foundation |
| [Contracts](contracts.md) | AvelaVault (collateral), AvelaPaymentRouter (settlement) — Foundry | Contracts |
| [Funding Engine](funding-engine.md) | Payment intents, collateral verification, vault+reserve settlement | Payment |
| [Spending Policy](spending-policy.md) | Daily limits, approval thresholds, price floors | Payment |
| [Agent Permissions](agent-permissions.md) | Scoped agent spending, MCP skills, permission dashboard | Intelligence |
| [Watcher](watcher.md) | Spending power threshold alerts, WATCH→EVALUATE→DECIDE→AUTHORIZE→EXECUTE loop | Intelligence |
| [WhatsApp Access](whatsapp-access.md) | Interactive messages, inline approval, notifications | Messaging |
| [Checkout](checkout.md) | Demo merchant storefront, "Pay with Avela" button, receipts | Commerce |
| [Identity & Links](identity-and-links.md) | Usernames, payment links (pay.avela.xyz/username) | Commerce |
| [Web Dashboard](web-dashboard.md) | PWA, portfolio view, policies, agent dashboard, receipts | Surface |
| [Marketing Site](marketing-site.md) | avela.xyz product story, how it works | Surface |
