# Avela SPEC

> **Source:** `product/ideas/Avela Build.md` in SamuelOS vault (v2.0, 2026-09-21).
> Master specification — MVP scope, roadmap, technical choices, verified onchain data. For product vision, see [PRD.md](PRD.md).
>
> **All asset, liquidity, and pool data verified live on X Layer (chain 196) using onchainos CLI on 2026-09-21.**

---

## 1. First Target

### 1.1 OKX Dev Day 2026

**Track: "Build a Market"** — build applications/infrastructure using tokenized stocks or RWAs as onchain building blocks, including asset-based payment or commerce experiences.

**Submit:** Sep 25, 2026
**Finale:** Oct 6–7, Singapore (date conflicting on Luma; venue may be inside Token2049)
**Fallback:** If not shortlisted for In-Person Finale, project auto-moves to Best Remote Build category (confirmed by Yanyi, OKX AI team)

Avela maps directly:

- **Onchain building block:** wrapped tokenized stocks (wSPYx, wNVDAx, etc. on X Layer)
- **New user-asset interaction:** using tokenized-stock positions as spending power across commerce
- **Asset-based commerce experience:** "Pay with Avela" — pay from portfolio without selling
- **"Build a Market" angle:** every payment generates real swap volume on Uniswap V3 xStock pools on X Layer. Avela is a demand-side market driver.

### 1.2 Verified Assets on X Layer

All xStocks on X Layer are **wrapped** (ERC-4626) versions of the rebasing xStock tokens. The wrapper is required for Uniswap/DeFi interaction.

| Asset | Symbol | Address | Holders | Total Liquidity |
|-------|--------|---------|---------|----------------|
| S&P 500 | wSPYx | `0xe7e553cd128f0011777323a0b44a7b96ea1cb540` | 2,854 | $2.06M |
| SpaceX | wSPCXx | `0x8e2eed8b8b5e13ea7bf38e50d7821d2c57309072` | 10,038 | $2.89M |
| Nvidia | wNVDAx | `0xa8ddb5cd96b5222afe198316e9a57caa642850d5` | 6,338 | $1.33M |
| Nasdaq 100 | wQQQx | `0x4c1ae29c159838fc1b224636e28e086eb69101f7` | 3,806 | $910K |
| Alphabet | wGOOGLx | `0xf8c5308f80e459bb53d9ebe689854d9cbb2caa6f` | 2,751 | $638K |
| Apple | wAAPLx | `0x943bf64d566c32a2bcd41ac92fb63c111cc9de8f` | 4,324 | $550K |
| Tesla | wTSLAx | `0xc3fdbe3a68ee5de461d30415a8165cf9aefe1171` | 2,845 | $512K |
| Microsoft | wMSFTx | `0x166fbe68274b6a47e025f4ba17388c539f1fa1d0` | 2,570 | $298K |
| Meta | wMETAx | `0xe840946ffebcd66b7c4e95095effafadfa0d0e56` | 2,571 | $246K |

### 1.3 Verified Stablecoin Pools (Uniswap V3)

| Pool | Liquidity | Stablecoin | Protocol |
|------|-----------|------------|----------|
| **USDG/wSPYx** | $1.89M | USDG | Uniswap V3 |
| **wQQQx/USDC** | $738K | USDC | Uniswap V3 |
| **USDG/wNVDAx** | $623K | USDG | Uniswap V3 |
| **USDC/wGOOGLx** | $616K | USDC | Uniswap V3 |
| **USDG/wSPCXx** | $437K | USDG | Uniswap V3 |
| **USDG/wAAPLx** | $404K | USDG | Uniswap V3 |
| **USDC/wTSLAx** | $404K | USDC | Uniswap V3 |
| **wMSFTx/USDG** | $277K | USDG | Uniswap V3 |
| **USDG/wMETAx** | $222K | USDG | Uniswap V3 |

### 1.4 Stablecoins on X Layer

| Stablecoin | Address | Holders | Liquidity |
|------------|---------|---------|-----------|
| **USDG** (Global Dollar) | `0x4ae46a509f6b1d9056937ba4500cb143933d2dc8` | 114,708 | $23.85M |
| **USDC** | `0xb6ceceab302e2e4948951ee7843fc24e92933061` | 7,515 | $26.23M |
| **USDC_Bridged** | `0x74b7f16337b8972027f6196a17a631ac6de26d22` | 139,319 | $68K |

**Stablecoin conversion paths:**

| Route | Liquidity | Protocol |
|-------|-----------|----------|
| USDG/USDT | $7.24M | Uniswap V3 |
| USDT/USDC | $1.41M | Uniswap V3 |
| USDG/USDC | $1.01M | Uniswap V3 |

### 1.5 Other Channels

- Circle Developer Grants — milestone-based USDC funding for builders on Arc and Circle Developer Platform
- X Layer AI-RWA Build X Series
- YC and accelerators — standard equity-funding path once working demo exists

---

## 2. MVP (Phase 1)

### 2.1 Objective

Demonstrate a programmable stock spending account — not just "pay with stocks" but an AI-native account where agents spend within permissions, users approve via messaging, and the intelligence layer is visible and real.

### 2.2 MVP Assets

Three assets from day one. All verified with $600K+ stablecoin pools on Uniswap V3.

| Asset | Symbol | Address | Best Pool | Liquidity |
|-------|--------|---------|-----------|-----------|
| S&P 500 | wSPYx | `0xe7e553cd128f0011777323a0b44a7b96ea1cb540` | USDG | $1.89M |
| Nasdaq 100 | wQQQx | `0x4c1ae29c159838fc1b224636e28e086eb69101f7` | USDC | $738K |
| Nvidia | wNVDAx | `0xa8ddb5cd96b5222afe198316e9a57caa642850d5` | USDG | $623K |

### 2.3 MVP Settlement

**Both USDG and USDC** — routed per-asset by liquidity depth.

| Asset | Settlement Stablecoin | Pool Liquidity |
|-------|-----------------------|----------------|
| wSPYx | USDG | $1.89M |
| wNVDAx | USDG | $623K |
| wQQQx | USDC | $738K |

The Funding Engine routes each asset through its deepest stablecoin pool. If the merchant or downstream rail needs the other stablecoin, the USDG/USDC conversion pool ($1.01M) handles the hop.

### 2.4 Scope

**Product surfaces (non-negotiable):**
- **Web app** (apps/web) — PWA, mobile-first responsive. Portfolio dashboard, spending power, payments, agent permissions, receipts.
- **Marketing site** (apps/site) — avela.xyz. Product story, how it works, demo access.
- **API** (apps/api) — Hono backend. Payment intents, account operations, settlement, agent auth. Powers all surfaces.
- **MCP skills** — Agent-accessible tools. Enables AI agents to query balances, create payment intents, check permissions via MCP protocol.
- No native mobile app for MVP — PWA covers mobile. Native app is Phase 2+.

**Core account:**
- Chain: **X Layer** (chain ID 196)
- 3 assets: wSPYx, wQQQx, wNVDAx
- Deposit wrapped xStocks, haircut applied, spending power per-asset and aggregated
- Funding Engine: spending-power-first routing through deepest pool per asset
- Payment fails gracefully if spending power insufficient — no silent asset conversion
- Spending policy: daily limits, approval thresholds, price floors
- Payment preview before execution
- Receipts with onchain proof

**Intelligence layer:**
- Agent spending: AI agent pays for a service from user's portfolio within scoped permissions (amount cap, asset restriction, recipient allowlist)
- One watcher: spending power threshold alert — demonstrates the WATCH → EVALUATE → DECIDE → AUTHORIZE → EXECUTE loop
- Agent permission dashboard: user defines what agent can and cannot do

**Messaging access:**
- Telegram bot: check balance, view spending power, approve/reject pending payments
- Payment notifications delivered in-conversation

**Identity:**
- Payment links (pay.avela.xyz/username)
- Username resolution for recipients

**Checkout:**
- "Pay with Avela" button at demo merchant
- Demo merchant storefront: product page → checkout → pay → receipt

### 2.5 User Flows

**Flow 1: Portfolio deposit and spending power**

1. User connects wallet holding wSPYx, wQQQx, wNVDAx on X Layer
2. User deposits into Avela account
3. Haircut applied per-asset, spending power calculated and aggregated
4. User sees: "Portfolio: $3,200 across 3 assets. Spending power: $1,600."

**Flow 2: Pay with Avela at checkout**

1. User clicks "Pay with Avela" at demo merchant
2. Payment preview: amount, which asset funds it, estimated settlement
3. Policy checks pass (daily limit, approval threshold, spending power)
4. Funding Engine selects best source — draws from wSPYx (deepest pool)
5. Uniswap V3 swap: wSPYx → USDG
6. Merchant receives stablecoins
7. Receipt: source asset, funding decision, settlement tx hash

**Flow 3: Agent pays for a service**

1. User grants agent permission: "spend up to $50/day from my portfolio, only at approved merchants"
2. Agent discovers a service it needs (API call, data feed, compute)
3. Agent creates payment intent within its permission scope
4. If amount exceeds auto-approve threshold → user gets Telegram notification to approve
5. Agent payment executes via Funding Engine (same path as user payment)
6. Receipt shows: agent identity, permission used, funding source, tx hash

**Flow 4: Approve via Telegram**

1. Pending payment notification arrives in Telegram
2. User sees: "Agent wants to spend $12 from your wSPYx. Approve?"
3. User taps Approve (or Reject)
4. Payment executes (or is cancelled)
5. Confirmation receipt in Telegram

**Flow 5: Spending power alert (watcher)**

1. User sets watcher: "Alert me when spending power drops below $500"
2. Market moves, wSPYx price drops, spending power recalculated
3. Telegram notification: "Your spending power is now $480 (was $620). wSPYx down 8% today."
4. User can adjust policy or deposit more from the notification

**What the judge sees:**

A person holds 3 tokenized stocks. They paid at checkout without selling. An AI agent independently paid for a service from the same portfolio — within permissions the user defined. The user approved a payment via Telegram. A watcher alerted them when their spending power dropped. Every action has an onchain receipt. This isn't just "pay with stocks" — it's a programmable financial account where humans and agents both operate, with intelligence built in.

### 2.6 Success Criteria

A judge (or investor, or user) can:

1. See a multi-asset portfolio with aggregated spending power
2. Pay at checkout — stock positions stay intact, merchant gets stablecoins
3. See an AI agent make a real payment within defined permissions
4. Approve a payment via Telegram without opening the app
5. See a watcher fire when spending power drops below threshold
6. See receipts with onchain proof connecting portfolio to every payment
7. See the permission dashboard — what the agent can and cannot do
8. Share a payment link (pay.avela.xyz/username)
9. Understand: "this is not a neobank — this is a programmable account where agents and humans both spend from tokenized stock portfolios"

---

## 3. Roadmap

### 3.1 Phases

**Phase 1 — Programmable stock spending account (MVP)**
*OKX Dev Day: submit Sep 25, finale Oct 6–7 Singapore*

Not a minimal demo — a first-class product that shows why Avela is a different category.

Core account:
- Multi-asset portfolio: wSPYx, wNVDAx, wQQQx (3 assets, all verified with $600K+ pools)
- Deposit wrapped xStocks, haircut applied, spending power calculated per-asset and aggregated
- Funding Engine: spending-power-first routing, per-asset deepest pool (USDG or USDC)
- Spending policy: daily limits, approval thresholds, price floors
- Payment preview before execution
- Receipts with onchain proof (source asset, funding decision, settlement tx hash)

Intelligence (the differentiator):
- Agent spending: one AI agent that can pay for a service from the user's portfolio within scoped permissions (amount limit, asset restriction, recipient allowlist)
- One watcher: "alert when spending power drops below threshold" — demonstrates the WATCH → EVALUATE → DECIDE → AUTHORIZE → EXECUTE loop is real
- Agent permission dashboard: user sets what the agent can and cannot do

Messaging access:
- Telegram bot: check balance, view spending power, approve/reject pending payments
- Payment notifications in-conversation

Identity:
- Payment links (pay.avela.xyz/username) — makes the demo tangible and shareable
- Username resolution for recipients

Checkout:
- "Pay with Avela" button at demo merchant checkout
- Demo merchant storefront (simple product page → checkout → pay → receipt)

**Phase 2 — Multi-currency, local rails, and merchant tools**

Additional wrapped xStocks (wAAPLx, wTSLAx, wSPCXx, wGOOGLx, wMSFTx, wMETAx). Local currency payouts via Rain (80+ countries, 50+ currencies). Merchant checkout SDK/API. Recurring payments and subscriptions. WhatsApp access. Advanced identity (ENS, cross-platform resolution).

**Phase 3 — Full intelligence and card spending**

Advanced watchers and triggers (portfolio rebalance alerts, auto-payments on conditions). Multi-agent orchestration. Card spending (Privy + Stripe Issuing). Fiat/cash rails and local payouts (Rain). Portable permissions across providers. Agent-to-agent commerce.

**Phase 4 — Platform and expansion**

"Pay with Avela" as embeddable checkout SDK for other RWA platforms, wallets, neobanks. Additional asset classes (tokenized commodities, credit, real estate tokens). Additional chains and rails. Business account features and B2B treasury workflows.

### 3.2 Future Capabilities

Extensions of the account, not prerequisites:

- Yield / Earn on idle assets
- Additional tokenized asset classes beyond equities
- Multi-chain support
- Fiat settlement rails
- Advanced agent-to-agent commerce
- Shared / multi-user accounts

---

## 4. Technical Choices

### 4.1 Implementation Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Runtime** | Node.js (production), Bun (package manager + scripts) | Bun for dev speed, Node.js for production stability |
| **Backend** | Hono | HTTP framework — not Express, not Bun.serve |
| **Database** | Supabase Postgres + Drizzle ORM | Type-safe schema, migrations via `drizzle-kit` |
| **Validation** | Zod | Runtime validation at domain boundaries |
| **Auth / Wallets** | Privy (`@privy-io/server-auth`, `@privy-io/react-auth`) | Embedded wallets, agent wallets, scoped permissions |
| **IDs** | ulidx | ULID generation for all entity IDs |
| **Frontend** | Next.js + Tailwind CSS v4 + shadcn/ui + Radix | PWA, mobile-first |
| **Motion** | Motion (Framer Motion) | Animations and transitions |
| **Font** | Geist | Sans and mono |
| **Testing** | Vitest | `bun run test` |
| **Linting** | Biome | `bun run check` — not ESLint/Prettier |
| **Chain** | X Layer (chain ID 196) | OKX L2 |
| **DEX** | Uniswap V3 | All xStock stablecoin pools |
| **Messaging** | Telegram Bot API | MVP messaging surface |
| **Agent protocol** | MCP | Agent skill exposure |

### 4.2 Workspace Structure

```
avela/
├── apps/
│   ├── site/          — Marketing site (Next.js, avela.xyz)
│   ├── web/           — Product dashboard (Next.js, PWA)
│   └── api/           — Backend API (Hono)
├── packages/
│   └── core/          — Shared domain, adapters, orchestration
├── docs/
│   ├── ideas/         — PRD.md, SPEC.md
│   ├── specs/         — Feature specs (broken from SPEC.md)
│   └── plans/         — Implementation plans per feature
└── resources/         — External SDK docs, onchainos skills, reference material
```

### 4.3 Scripts

| Command | What it does |
|---------|-------------|
| `bun run dev` | Start all apps in parallel |
| `bun run dev:site` | Marketing site only |
| `bun run dev:web` | Product dashboard only |
| `bun run build` | Build all apps |
| `bun run test` | Run Vitest test suite |
| `bun run check` | Biome lint + format check |
| `bun run typecheck` | TypeScript type check (`tsc --noEmit`) |

### 4.4 Adapter Architecture

```text
Avela core
+-- Account model
+-- Portfolio & asset eligibility
+-- Spending power engine
+-- Payment intent & state machine
+-- Funding policy & approval engine
+-- Provider router
+-- Receipt & audit ledger
+-- API, web/PWA, MCP, agent skill

Adapters (replaceable)
+-- Wallet / custody (Privy)
+-- Asset data & pricing (Uniswap TWAP, OKX market data, Chainlink Data Streams when available)
+-- Liquidity / swap (Uniswap V3 on X Layer)
+-- Settlement (USDG/USDC, conversion via pool when needed)
+-- Identity (usernames, payment links, ENS)
+-- Messaging (Telegram, WhatsApp)
+-- Agent runtime (MCP, A2MCP)
+-- Card issuing
+-- Local payment rails
```

### 4.5 Providers

| Capability | Provider | Status | Notes |
|-----------|----------|--------|-------|
| Tokenized equities | xStocks (wrapped) | **Verified live** | 9 wrapped xStocks on X Layer. MVP uses wSPYx, wQQQx, wNVDAx |
| Stablecoin settlement | USDG + USDC | **Verified live** | Both supported, routed per-asset by pool depth. USDG/USDC conversion: $1.01M pool |
| Liquidity / swap | Uniswap V3 on X Layer | **Verified live** | USDG/wSPYx $1.89M, wQQQx/USDC $738K, USDG/wNVDAx $623K |
| Wallet / custody / auth | Privy | **Documented** | Embedded wallets, agent wallets, scoped permissions |
| Price feed / oracle (MVP) | Uniswap V3 TWAP + OKX market data API | **Available** | Chainlink Data Streams announced but VerifierProxy not deployed on X Layer yet |
| Price feed / oracle (production) | Chainlink Data Streams | **Announced, not verified** | Equity feeds confirmed; VerifierProxy address on X Layer not public; credentials self-serve |
| Messaging access | Telegram Bot API | **Available** | MVP: balance checks, spending power, approve/reject payments |
| Agent runtime | MCP + Privy agent wallets | **Available** | Scoped agent permissions, payment intent creation within bounds |
| Identity / payment links | Custom (MVP) | **To build** | pay.avela.xyz/username, username resolution |
| Local currency payouts | Rain | **Documented** | 80+ countries, 50+ currencies — Phase 2 |
| Card programmes | Privy + Stripe Issuing | **Documented** | Card spending — Phase 3 |

### 4.6 Oracle Strategy

**MVP:** Uniswap V3 TWAP from pool data. The wSPYx/USDG pool has $1.89M liquidity — sufficient for spending power calculation. OKX market data API (via onchainos CLI) as secondary/validation source.

**Production:** Chainlink Data Streams when the X Layer VerifierProxy is publicly available. OKX announced "24/5 equities streams covering major US stocks including TSLA, NVDA, and AAPL" on X Layer in June 2026. Credentials self-serve (confirmed by David Shui, OKX).

**Fallback (validated by other builders):** duke.sol/Gloam used "a self-sourced oracle plus the xStock liquidity that's already onchain" — bypassed Chainlink entirely.

TODO: Ask in OKX Telegram for Chainlink Data Streams VerifierProxy address on X Layer mainnet (chain 196).

### 4.7 Wrapping Mechanics

xStocks are **rebasing tokens** — balance changes with stock price. For AMM interaction, they must be wrapped in ERC-4626 vault (fixed-supply share token).

- Raw token (e.g. NVDAx at `0xc845b2894dbddd03858fd2d643b4ef725fe0849d`) — rebasing, not AMM-compatible
- Wrapped token (e.g. wNVDAx at `0xa8ddb5cd96b5222afe198316e9a57caa642850d5`) — fixed-supply shares, trades on Uniswap

Avela handles wrapping/unwrapping in the deposit and withdrawal flow. User deposits xStocks; Avela wraps for DeFi interaction and unwraps on withdrawal.

TODO: Verify the wrapping contract interface and whether wrapping is permissionless or requires allowlisting.

### 4.8 Key Contract Addresses (X Layer Mainnet, chain 196)

| Contract | Address | Verified |
|----------|---------|----------|
| wSPYx (MVP asset) | `0xe7e553cd128f0011777323a0b44a7b96ea1cb540` | Yes |
| wQQQx (MVP asset) | `0x4c1ae29c159838fc1b224636e28e086eb69101f7` | Yes |
| wNVDAx (MVP asset) | `0xa8ddb5cd96b5222afe198316e9a57caa642850d5` | Yes |
| USDG (settlement) | `0x4ae46a509f6b1d9056937ba4500cb143933d2dc8` | Yes |
| USDC (settlement) | `0xb6ceceab302e2e4948951ee7843fc24e92933061` | Yes |
| USDG/wSPYx pool | Uniswap V3 | Yes ($1.89M) |
| wQQQx/USDC pool | Uniswap V3 | Yes ($738K) |
| USDG/wNVDAx pool | Uniswap V3 | Yes ($623K) |
| USDG/USDC pool | Uniswap V3 | Yes ($1.01M) |
| Chainlink VerifierProxy | Unknown | Not verified |

---

## 5. Onchain Tools & Commands

### 5.1 onchainos CLI

Installed at `/Users/samueldanso/.local/bin/onchainos` (v4.9.3-beta). Primary tool for live market data verification on X Layer.

**Token search:**
```bash
onchainos token search --query "wSPYx" --chains "196"
```

**Token liquidity (all pools):**
```bash
onchainos token liquidity --address 0xe7e553cd128f0011777323a0b44a7b96ea1cb540 --chain "196"
```

**Token price info:**
```bash
onchainos token price-info --address 0xe7e553cd128f0011777323a0b44a7b96ea1cb540
```

**Token holder count / metadata:**
```bash
onchainos token search --query "USDG" --chains "196"
```

### 5.2 onchainos Skills

Located at `resources/onchainos-skills/`. Available skills:

| Skill | Purpose |
|-------|---------|
| `okx-dex-market` | Token liquidity, market data, signal capabilities for X Layer |
| `okx-agentic-wallet` | Wallet operations, transaction signing |
| `okx-defi` | DeFi protocol interaction |
| `okx-payments-protocol` | Payment protocol operations |

### 5.3 Verification Commands

Use these to verify any claim about X Layer state:

```bash
# Check if a contract exists at an address
cast code 0x<address> --rpc-url https://rpc.xlayer.tech

# Check token balance
cast call 0x<token> "balanceOf(address)(uint256)" 0x<wallet> --rpc-url https://rpc.xlayer.tech

# Check ERC-4626 wrapper
cast call 0x<wrapped-token> "asset()(address)" --rpc-url https://rpc.xlayer.tech
```

### 5.4 X Layer RPC

```
Mainnet: https://rpc.xlayer.tech
Chain ID: 196
Explorer: https://www.okx.com/web3/explorer/xlayer
```

---

## 6. Reference Implementations

Avela can produce focused demos for different grant/hackathon contexts without fragmenting the product:

- **Spending account (OKX Dev Day):** deposit wSPYx → spending power → checkout → settlement
- **Agent spending (Phase 2–3):** agent discovers service → checks permissions → spends → receipt
- **Messaging access (Phase 2):** check balance in WhatsApp → approve in Telegram → receipt
- **Checkout SDK (Phase 4):** "Pay with Avela" embeddable for other RWA platforms

The demo context changes. The Avela account model remains.

---

## 7. Success Signals

The first proof is repeated transactions, not signups.

- Users complete a second payment through the same account
- Payments complete without the user learning blockchain mechanics
- At least one agent completes a real service payment
- Users invite others into the network (merchant receives "Pay with Avela" → creates account)
- Users describe Avela as "where my stocks become spending power"
- Partners ask to integrate the account and Funding Engine directly

---

## 8. Open Questions

### 8.1 Resolved (this version)

- ~~Which xStocks exist on X Layer with live liquidity pools?~~ → 9 wrapped xStocks verified, wSPYx + wQQQx + wNVDAx selected for MVP
- ~~Oracle/price feed provider selection~~ → Uniswap V3 TWAP for MVP, Chainlink Data Streams for production
- ~~Settlement stablecoin~~ → Both USDG and USDC, routed per-asset by pool depth

### 8.2 Remaining

- **Chainlink VerifierProxy address on X Layer** — ask in OKX Telegram; if unavailable, proceed with Uniswap TWAP
- **Wrapping mechanics** — verify ERC-4626 wrapper interface, permissionless vs. allowlisted
- **Haircut calibration** — starting at 50% for wSPYx (index); needs per-asset tuning for single stocks
- **KYC/KYB provider selection** — deferred; not required for hackathon demo
- **Demo merchant setup** — create a demo merchant checkout for OKX Dev Day
- **Pool liquidity sustainability** — current liquidity is partly incentive-driven (OKX $5M RWA program, $100K LP rounds). Risk: if campaigns end, execution breaks on slippage. Mitigation: payment size limits, slippage checks.

---

## 9. Research Log

### 2026-09-21 — Onchain verification sweep

**Method:** onchainos CLI v4.9.3-beta, token search + liquidity queries on X Layer (chain 196).

**Key findings:**
- All xStocks on X Layer are wrapped (ERC-4626). Raw xStocks share liquidity through wrappers.
- USDG (Global Dollar) is the dominant stablecoin in xStock pools, not USDC.
- Uniswap V3 is the primary DEX — all major stablecoin pools are V3.
- xChange (issuer's atomic RFQ) does NOT support X Layer. Execution is DEX-only.
- xStocks official docs do not list X Layer as a supported chain — deployment appears via a separate OKX/Backed arrangement.
- Chainlink Data Streams announced for X Layer but VerifierProxy not publicly deployed at any known address.
- Other Dev Day builders confirmed same oracle difficulty; duke.sol/Gloam used self-sourced oracle.

**Community intel (OKX Dev Day Telegram, Sep 19–21):**
- OKX $5M RWA Incentive Program active — Round 2 LP incentives ($100K, Sep 18–25), RWA Meme Trading Competition ($50K, Sep 23–30)
- Incentivized pools are mostly meme tokens paired with wrapped xStocks
- Chainlink Data Streams credentials are self-serve (confirmed by David Shui, OKX)
- In-Person Finale rejects auto-move to Best Remote Build (confirmed by Yanyi, OKX AI team)
