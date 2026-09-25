# Avela — Pay from your portfolio. Without selling your tokenized stocks.

> **A programmable spending account for tokenized stocks.** Lock tokenized stocks as collateral, unlock spending power, and pay across global commerce — your positions stay in the market, the merchant gets paid in their currency. Agents and humans both operate the account, with intelligence and messaging built in.

**Track:** OKX Dev Day 2026 — *Build a Market* (tokenized stocks / RWA as onchain building blocks)
**Chain:** X Layer (chain ID `196`) · **Site:** [useavela.xyz](https://useavela.xyz) · **App:** [app.useavela.xyz](https://app.useavela.xyz) · **Explorer:** [X Layer](https://www.okx.com/web3/explorer/xlayer) · **Repo:** [avela-finance/avela](https://github.com/avela-finance/avela)

```text
You hold wSPYx → Avela locks it in AvelaVault → haircut applied → spending power
     → "Pay with Avela" → Funding Engine verifies collateral → AvelaPaymentRouter
     pays merchant from stablecoin reserve → receipt links both events by paymentId
     → your wSPYx never moved. Provable on the explorer.
```

---

## Table of contents

- [Avela — Pay from your portfolio. Without selling your tokenized stocks.](#avela--pay-from-your-portfolio-without-selling-your-tokenized-stocks)
  - [Table of contents](#table-of-contents)
  - [What Avela is](#what-avela-is)
  - [How spending power works](#how-spending-power-works)
  - [What you can do (MVP)](#what-you-can-do-mvp)
  - [Architecture](#architecture)
  - [Contracts on X Layer (deployed)](#contracts-on-x-layer-deployed)
  - [Verified assets \& pools](#verified-assets--pools)
  - [Repo structure](#repo-structure)
  - [Stack](#stack)
  - [Quickstart](#quickstart)
  - [Judge demo in 5 minutes](#judge-demo-in-5-minutes)
  - [Environment](#environment)
  - [API reference](#api-reference)
  - [Agents \& permissions](#agents--permissions)
  - [Messaging (WhatsApp)](#messaging-whatsapp)
  - [MCP — agent skill exposure](#mcp--agent-skill-exposure)
  - [Watchers (intelligence loop)](#watchers-intelligence-loop)
  - [Checkout demo](#checkout-demo)
  - [Scripts](#scripts)
  - [Testing](#testing)
  - [Custody \& security disclosure](#custody--security-disclosure)
  - [Roadmap](#roadmap)
  - [Docs](#docs)
  - [Contributing \& security](#contributing--security)
  - [License](#license)

---

## What Avela is

Tokenized stocks already trade on-chain. That alone doesn't make them more valuable than the same assets in a brokerage app. Avela makes ownership *usable*: lock tokenized equities as collateral and turn them into spending power for everyday commerce.

- **Hold** — deposit wrapped xStocks (`wSPYx`, `wQQQx`, `wNVDAx`, `wGOOGLx`, `wAAPLx`) + stablecoins (`USDG`, `USDC`).
- **Manage** — portfolio, spending power, spending policies, agent permissions, watchers, receipts.
- **Pay** — one button, *"Pay with Avela"*. The Funding Engine selects the source under your policy. The merchant receives stablecoins (or local currency via payout partners in Phase 2).

**Avela never silently sells your stocks at checkout.** If spending power + stablecoin balance don't cover the payment, it fails gracefully — *you* decide what to do next.

**Why this is "Build a Market":** every payment is backed by real xStock collateral locked on X Layer and settles in stablecoins routed by Uniswap V3 pool depth. Avela is a demand-side driver for xStock markets — more spending → more reason to hold tokenized equities → more assets flow onchain.

---

## How spending power works

1. You deposit wrapped xStocks into **AvelaVault** → `PositionLocked` event on-chain.
2. Avela prices each position via **Uniswap V3 TWAP** (pricing only — never in the payment execution path).
3. A conservative **haircut** is applied per asset (starting at 50% — the cushion against volatility). Remainder = spending power.
4. Spending power aggregates across all 5 assets into one number: *"You can spend up to $X"*.

Example: deposit $1,000 of `wAAPLx` → 50% haircut → **$500 spending power**. If `wAAPLx` rises, spending power rises. If it drops, the haircut absorbs normal volatility first.

When you pay, the Funding Engine (see below) verifies collateral is locked in the vault (view call, no state change), checks policy (daily limit, approval threshold, price floors), then settles from the stablecoin reserve via **AvelaPaymentRouter**. Both legs share one **`paymentId`** — traceable across both contracts on the explorer.

---

## What you can do (MVP)

| Capability | Where | Description |
|---|---|---|
| See spending power | Web dashboard, WhatsApp, MCP | Haircut-adjusted value, per-asset + aggregated |
| Pay with Avela | Checkout demo, API | One-tap checkout — positions stay locked |
| Spending policies | Web, API | Daily limits, approval thresholds, price floors, minimum balances |
| Approval workflow | Web, WhatsApp | Human sign-off above threshold, approve/reject from a message |
| Agent permissions | Web, API, MCP | AI agent spends within amount caps, asset restrictions, recipient allowlists |
| Watchers | Web, API, WhatsApp | *"Alert me when spending power drops below $X"* — the intelligence loop, live |
| Receipts + audit | Web, API, WhatsApp | Every payment: collateral asset, `paymentId`, settlement tx hash, explorer link |
| Payment links | Web, API | `pay.useavela.xyz/<username>` — shareable, resolvable |
| Messaging access | WhatsApp | Balance, spending power, history, approvals, receipts — in-conversation |

---

## Architecture

Four product layers, intelligence cross-cutting:

```text
Commerce      checkout, payment links, merchant settlement
Payment       intents → policy check → funding decision → settlement → receipt
Transaction   vault collateral verify, router settlement, TWAP pricing
Asset         positions, eligibility, valuation, haircut, spending power
                    ↕ intelligence cross-cuts all layers ↕
              WATCH → EVALUATE → DECIDE → AUTHORIZE → EXECUTE
```

**Runtime flow for one payment:**

```text
apps/web (Pay button) ──→ apps/api (Hono) ──→ packages/core (domain)
        │                          │
        │                     1. policy check (spending-policy)
        │                     2. spending power (TWAP + haircut)
        │                     3. collateral verify (AvelaVault.getLockedBalance view call)
        │                     4. settle (AvelaPaymentRouter.executePayment via backend signer)
        │                          │
        │                     X Layer (chain 196): vault lock + router settlement,
        │                     linked by shared paymentId
        │
        ├──→ WhatsApp approval (if over threshold) + receipt notification
        ├──→ Watcher evaluation (spending power threshold)
        └──→ MCP tools (agents do the same flow within permission scope)
```

**Adapter model (chain-agnostic by design):** core domain (`packages/core`) never imports chain specifics directly — pricing (Uniswap TWAP), vault, router, messaging, identity, and agent runtime are all replaceable adapters. X Layer is the first deployment; Base is next.

---

## Contracts on X Layer (deployed)

Network: **X Layer mainnet** · RPC `https://rpc.xlayer.tech` · Chain ID `196` · Explorer `https://www.okx.com/web3/explorer/xlayer`

| Contract | Address | Model |
|---|---|---|
| **AvelaVault** | `0x3479183bcbcc3643fdb6a26c7215e602095c2086` | Non-custodial. Multi-asset (5 whitelisted xStocks, one contract). `deposit` / `withdraw` (withdrawal permissionless to depositor only — no admin can move user funds). Emits `PositionLocked` / `PositionReleased`. |
| **AvelaPaymentRouter** | `0x6986CF2784f112bc1610ee743F33246d9C4B869B` | Custodial (stated MVP limitation — single backend EOA signer, Phase 2 → multisig). Multi-stablecoin (`USDG`/`USDC` via token param). `executePayment(token, merchant, amount, paymentId, collateralOwner)` with `paymentId` replay protection. Emits `PaymentExecuted`. |

Source: [`contracts/src/AvelaVault.sol`](contracts/src/AvelaVault.sol), [`contracts/src/AvelaPaymentRouter.sol`](contracts/src/AvelaPaymentRouter.sol). Tests: `forge test`. Deploy: `forge script script/Deploy.s.sol --rpc-url $XLAYER_RPC_URL --broadcast` (see [`contracts/README.md`](contracts/README.md)).

**Judge verification (the money shot):** on the explorer, find a `PositionLocked` event for the demo wallet with *no matching* `PositionReleased` across a payment, plus a `PaymentExecuted` event carrying the *same* `paymentId`. Collateral never moved; merchant got paid. That's the whole thesis, provable in two events.

---

## Verified assets & pools

All data verified live on X Layer with `onchainos` CLI on 2026-09-21 (table below). All xStocks on X Layer are **wrapped ERC-4626** (raw xStocks are rebasing and not AMM-compatible — only wrapped versions trade on Uniswap).

| Asset | Symbol | Address | Settlement | Pool liquidity |
|---|---|---|---|---|
| S&P 500 | `wSPYx` | `0xe7e553cd128f0011777323a0b44a7b96ea1cb540` | USDG | $1.89M |
| Nasdaq 100 | `wQQQx` | `0x4c1ae29c159838fc1b224636e28e086eb69101f7` | USDC | $738K |
| Nvidia | `wNVDAx` | `0xa8ddb5cd96b5222afe198316e9a57caa642850d5` | USDG | $623K |
| Alphabet | `wGOOGLx` | `0xf8c5308f80e459bb53d9ebe689854d9cbb2caa6f` | USDC | $616K |
| Apple | `wAAPLx` | `0x943bf64d566c32a2bcd41ac92fb63c111cc9de8f` | USDG | $404K |

| Stablecoin | Address |
|---|---|
| USDG (Global Dollar) | `0x4ae46a509f6b1d9056937ba4500cb143933d2dc8` |
| USDC | `0xb6ceceab302e2e4948951ee7843fc24e92933061` |

**Oracle (resolved):** Chainlink Data Streams do **not** support X Layer (confirmed by OKX, Sep 22 2026). MVP + production oracle is **Uniswap V3 TWAP** for spending-power pricing, with OKX market data as secondary validation. TWAP is never in the payment execution path (reserve model), so oracle deviations only affect the spending-power estimate — buffered by the haircut — never settlement slippage.

---

## Repo structure

```text
avela/
├── apps/
│   ├── site/          — Marketing site (Next.js, useavela.xyz)
│   ├── web/           — Product dashboard (Next.js, PWA, mobile-first)
│   └── api/           — Backend API (Hono on Node.js)
│       └── src/
│           ├── routes/          — health, accounts, assets, portfolio, payments,
│           │                      policies, agents, identity, watchers, whatsapp
│           ├── integrations/whatsapp/ — client, webhook, messages, notifications, callbacks
│           ├── middleware/      — Privy auth, account resolution, request-id, errors
│           └── adapters.ts      — wires price feed + vault + router adapters
├── contracts/         — Solidity (Foundry): AvelaVault, AvelaPaymentRouter, tests, deploy script
├── packages/
│   ├── core/          — Shared domain, adapters, orchestration (spending power,
│   │                      funding engine, policies, agents, watchers, WhatsApp, identity)
│   └── mcp/           — MCP skill server: avela.getBalance, avela.getPermissions,
│                        avela.createPaymentIntent, avela.getPaymentStatus
└── docs/
    ├── agents.md      — Agent permissions + intelligence layer guide
    ├── messaging.md   — WhatsApp / messaging access guide
    └── mcp.md         — MCP server + tool documentation
```

---

## Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (apps + packages), Solidity `0.8.x` (contracts) |
| Runtime | Node.js (production) · Bun (package manager + scripts) |
| Backend | Hono · Drizzle ORM + Supabase Postgres · Zod · ulidx |
| Auth / wallets | Privy (`@privy-io/server-auth`, `@privy-io/react-auth`) |
| Chain | X Layer 196 · viem · Foundry |
| Pricing | Uniswap V3 TWAP (spending power only — never in the payment path) |
| Messaging | WhatsApp Business API |
| Agents | MCP server (`@modelcontextprotocol/sdk`) |
| Frontend | Next.js · Tailwind CSS v4 · shadcn/ui + Radix · Motion · Geist |
| Quality | Vitest · Biome · `tsc --noEmit` |

---

## Quickstart

**Prereqs:** [Bun](https://bun.sh) (package manager + scripts), [Foundry](https://book.getfoundry.sh) (`forge`, `cast`) for contracts, a Supabase Postgres database, Privy app credentials.

```bash
bun install

cp .env.example .env          # fill in DATABASE_URL, Privy, contract addresses
# App-specific vars: see apps/{api,web,site}/.env.example if present

bun run dev                   # start all apps in parallel
bun run dev:site              # marketing site only
bun run dev:web               # product dashboard only

bun run --cwd apps/api dev    # API only (needs DATABASE_URL + Privy env)

# Contracts
cd contracts && forge build && forge test
forge script script/Deploy.s.sol --rpc-url $XLAYER_RPC_URL --broadcast
```

Open: site `http://localhost:3001` · web `http://localhost:3000` (Next default) · API `http://localhost:3001/health` (`PORT` env overrides — note: site and API share `3001` by default, so run one at a time or set `PORT`).

**Verify X Layer state (never guess — use the tools):**

```bash
onchainos token search --query "wSPYx" --chains "196"
onchainos token liquidity --address 0xe7e553cd128f0011777323a0b44a7b96ea1cb540 --chain "196"
cast code 0x3479183bcbcc3643fdb6a26c7215e602095c2086 --rpc-url https://rpc.xlayer.tech
cast call 0x3479183bcbcc3643fdb6a26c7215e602095c2086 \
  "getLockedBalance(address,address)(uint256)" <wallet> <token> \
  --rpc-url https://rpc.xlayer.tech
```

---

## Judge demo in 5 minutes

1. `bun run seed` — demo account + agent permission + watcher.
2. Web dashboard → approve `wSPYx` → `AvelaVault.deposit` → spending power appears.
3. Checkout demo → **Pay with Avela** → preview → confirm → receipt with `paymentId` + tx hash.
4. Explorer: `PositionLocked` still standing (no `PositionReleased`) + `PaymentExecuted` with the same `paymentId`. Collateral never moved; merchant got paid.
5. Agent: MCP `avela.createPaymentIntent` — $12 auto-settles (under threshold), $40 routes to WhatsApp approval → tap Approve.
6. Watcher: drop spending power under the threshold (or `POST /accounts/:id/watchers/evaluate`) → WhatsApp alert arrives.

---

## Environment

Root `.env.example` is the checklist. Required:

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Supabase Postgres connection string (Drizzle) |
| `PRIVY_APP_ID` / `PRIVY_APP_SECRET` | Wallet auth + embedded/agent wallets |
| `XLAYER_RPC_URL` | `https://rpc.xlayer.tech` |
| `AVELA_VAULT_ADDRESS` | `0x3479183bcbcC3643fDb6a26C7215e602095C2086` |
| `AVELA_ROUTER_ADDRESS` | `0x6986CF2784f112bc1610ee743F33246d9C4B869B` |
| `SIGNER_PRIVATE_KEY` | Backend EOA calling `executePayment` (MVP single-key limitation) |
| `WHATSAPP_API_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_VERIFY_TOKEN` | WhatsApp Business API (optional — webhook disabled when unset) |
| `ALLOWED_ORIGINS` | CORS allowlist (defaults permissive when unset) |

---

## API reference

Hono REST + JSON, Zod-validated, ULID ids, Privy-authenticated (account/payment/agent routes). Public: asset prices, username resolution.

```text
GET  /health · GET /health/ready
POST /accounts · GET /accounts/:id
POST /accounts/:id/deposit (prepare) · POST /accounts/:id/deposit/confirm
GET  /accounts/:id/portfolio
GET  /accounts/:id/policies · PUT /accounts/:id/policies
POST /accounts/:id/watchers · GET /accounts/:id/watchers
PUT  /accounts/:id/watchers/:id · DELETE /accounts/:id/watchers/:id
POST /accounts/:id/watchers/evaluate
GET  /assets · GET /assets/:symbol/price
GET  /payments (history) · POST /payments/intent · GET /payments/:id
GET  /payments/:id/receipt · POST /payments/:id/authorize · POST /payments/:id/reject
POST /agents · GET /agents · GET /agents/:id
GET  /agents/:id/permissions · PUT /agents/:id/permissions
GET  /agents/:id/spending-log · DELETE /agents/:id (revoke)
POST /identity/register · GET /identity/resolve/:username
GET  /identity/available/:username · GET /identity/me (auth)
POST /integrations/whatsapp/link · POST|GET /webhooks/whatsapp
```

Payment state machine: `created → policy_check → awaiting_approval → collateral_verify → settling → settled | failed | rejected`.

---

## Agents & permissions

Agents **operate** the account — they never own it. A user grants scoped authority: max per-transaction, max per-day, allowed assets, allowed recipients, approval threshold, expiry. Every agent action is permission-checked *and* logged with a permission snapshot.

Demo permission: *up to $50/tx, $200/day, `wSPYx` only, approval above $25*. Agent flow: create intent → permission evaluation (`allowed? requiresApproval? violations? dailyRemaining?`) → approval if needed (routed to WhatsApp) → same vault+reserve settlement path as human payments → receipt shows agent identity + permission used.

Full model: [`docs/agents.md`](docs/agents.md).

## Messaging (WhatsApp)

Messaging is a **primary access surface**, not a support channel. Link a number once → check balance / spending power / history via message intents (`"balance"`, `"spending"`, `"payments"`, `"help"`), approve/reject pending payments via interactive buttons, receive settlement receipts and watcher alerts in-conversation. Agent approval requests route through the same path — start a payment on web, approve in WhatsApp, see the receipt in both.

Implementation: `apps/api/src/integrations/whatsapp/` (client, webhook, messages, notifications, callbacks + template builders). Full template table: [`docs/messaging.md`](docs/messaging.md).

## MCP — agent skill exposure

`packages/mcp` is a Model Context Protocol server (stdio transport) exposing the account to AI agents as tools:

| Tool | Input | Output |
|---|---|---|
| `avela.getBalance` | `accountId` | Spending power (per-asset + total) |
| `avela.getPermissions` | `agentId` | Current permission scope |
| `avela.createPaymentIntent` | `agentId, amount, recipient` | Payment intent (permission-checked) |
| `avela.getPaymentStatus` | `paymentId` | Intent + status + receipt |

Requires `DATABASE_URL`. Price feed injection is config-driven (pool map per the verified asset table above). Setup, tool schemas, and Claude Desktop / agent wiring: [`docs/mcp.md`](docs/mcp.md).

## Watchers (intelligence loop)

One MVP watcher — *"alert when spending power drops below $X"* — proving the loop is real: **WATCH** (read spending power) → **EVALUATE** (compare to threshold) → **DECIDE** (fire or cooldown-skip) → **AUTHORIZE** (alerts are auto-authorized) → **EXECUTE** (WhatsApp notification). CRUD + `POST /watchers/evaluate` (cron/manual trigger for the demo), cooldown to avoid re-alerts, `active → triggered → active` lifecycle.

## Checkout demo

Demo merchant: product page → cart → *"Pay with Avela"* → preview (amount, collateral asset, settlement stablecoin, gas) → confirm → Funding Engine settles → receipt with tx hash + explorer link. Mobile-viewport PWA, sub-30s flow, clear insufficient-power error state. Pages live under `apps/web/src/app/checkout/`.

---

## Scripts

| Command | What it does |
|---|---|
| `bun run dev` | Start all apps in parallel |
| `bun run dev:site` | Marketing site only |
| `bun run dev:web` | Product dashboard only |
| `bun run build` | Build all apps |
| `bun run test` | Vitest suite (`vitest run`) |
| `bun run check` | Biome lint + format check |
| `bun run typecheck` | `tsc --noEmit` per package/app |
| `bun run seed` | Seed demo data (`packages/core/src/db/seed.ts`) |
| `forge build / forge test` (in `contracts/`) | Build + test Solidity contracts |

Lint engine is **Biome** (not ESLint/Prettier). Runtime rule: **Bun** manages + runs scripts, **Node.js** runs production — never depend on Bun-specific runtime APIs.

---

## Testing

- **Contracts:** Foundry — `cd contracts && forge test` (vault deposit/withdraw + whitelist, router auth + replay protection + reserve, integration).
- **Backend/domain:** Vitest — `bun run test` (spending power, funding engine state machine, policies, agents/permissions, watchers + evaluator, WhatsApp link/messages, identity, portfolio, adapters).
- **API routes:** at least one integration test per route module (`apps/api/src/routes/__tests__/`, `apps/api/src/__tests__/`).
- **MCP:** `packages/mcp/src/__tests__/tools.test.ts`.

---

## Custody & security disclosure

Honest trust boundaries (stated, not hidden):

- **AvelaVault — non-custodial.** Only the original depositor can withdraw their own balance. No owner/admin/backend key can move user funds. Owner role = whitelist management only.
- **AvelaPaymentRouter — custodial (MVP limitation).** Holds a pre-funded `USDG`+`USDC` reserve (~$10 for demo, manual replenishment). Disbursed by a single backend EOA. Phase 2: multisig / claim-based release + timelock.
- **Unaudited at MVP.** Audit is the first post-funding milestone.
- **Oracle risk:** TWAP-only for pricing, never execution; haircut buffers deviations.
- See [`SECURITY.md`](SECURITY.md) for reporting (private — never file vulnerabilities as public issues).

---

## Roadmap

- **Phase 1 (now — OKX Dev Day):** vault + router on X Layer, 5 assets, web + API + WhatsApp + MCP, agent spending, one watcher, payment links, demo checkout.
- **Phase 2:** Base deployment (Coinbase tokenized stocks), more xStocks (`wTSLAx`, `wSPCXx`, `wMSFTx`, `wMETAx`), self-replenishing reserve, Rain local-currency payouts (GHS/NGN/KES/PHP/BRL/USD), fiat onramps, merchant SDK, subscriptions, multisig operator.
- **Phase 3:** Advanced watchers/triggers, multi-agent orchestration, card spending (Privy + Stripe Issuing), deep fiat/local-stablecoin bridge, portable permissions, agent-to-agent commerce.
- **Phase 4:** Embeddable *"Pay with Avela"* checkout SDK, more asset classes (commodities, credit, real estate tokens), more chains, business/treasury accounts.

---

## Docs

- Agent guide: [`docs/agents.md`](docs/agents.md) · Messaging guide: [`docs/messaging.md`](docs/messaging.md) · MCP guide: [`docs/mcp.md`](docs/mcp.md)
- Contracts: [`contracts/README.md`](contracts/README.md) · Contributing: [`CONTRIBUTING.md`](CONTRIBUTING.md) · Agent working agreement: [`AGENTS.md`](AGENTS.md)

---

## Contributing & security

PRs welcome — see [`CONTRIBUTING.md`](CONTRIBUTING.md) (Bun workspace, Biome, Vitest, Foundry; branch → PR → squash-merge). Security vulnerabilities: **do not open a public issue** — report privately per [`SECURITY.md`](SECURITY.md).

## License

MIT — see [`LICENSE`](LICENSE).
