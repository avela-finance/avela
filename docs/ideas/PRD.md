# Avela PRD

> **Source:** `product/ideas/Avela Product.md` in SamuelOS vault (v3.0, signed off 2026-09-21).
> This is the canonical product vision. For MVP scope, roadmap, and technical choices, see [SPEC.md](SPEC.md).

---

## 1. Product Definition

### 1.1 One-liner

> **Avela is a programmable spending account for tokenized stocks — pay from your portfolio without selling.**

**Website headline:** Make your tokenised stocks your everyday spend.

> One programmable account to hold tokenized stocks, unlock spending power from your portfolio, and pay across global commerce — your positions stay in the market, the merchant gets paid in their currency.

### 1.2 Product Description

Avela lets you hold tokenized stocks and use them to pay across everyday commerce — without selling your positions. Deposit tokenized equities, see your spending power, and pay at checkout. Your stocks stay in the market. The merchant gets paid in their currency.

Avela handles the complexity underneath: valuation, funding, FX, routing, and settlement. The user holds xGOOGLE — the merchant receives USDC, USD, GHS, or NGN and other local currencies. Nobody cares about the plumbing. The user sees spending power. The merchant sees money received.

Programmable policies, spending rules, and agent permissions make this an account you can configure, not just a card you tap.

### 1.3 How Spending Power Works

You deposit tokenized stocks into Avela. Avela applies a conservative haircut — a percentage held back as a safety cushion against price movement. The remainder becomes your spending power.

Example: deposit $1,000 of xAAPL. Avela applies a 50% haircut. You get $500 of spending power. Your stocks stay in the market. If xAAPL goes up, your spending power adjusts upward. If it drops, the haircut absorbs normal volatility before anything changes for you.

When you pay, the Funding Engine selects the best funding source under your policy: draw from spending power (positions stay) or use your stablecoin balance. You don't choose — the engine routes it. You just see "Pay with Avela" and your receipt. If neither source covers the payment, it fails — you decide whether to deposit more, add stablecoins, or manually sell a position. Avela never silently sells your stocks at checkout.

The haircut percentage varies by asset (blue-chip vs. volatile), and the mechanism underneath (how spending power is technically created — whether through overcollateralized lending, a reserve model, or another approach) is an implementation decision. The product experience stays the same regardless.

### 1.4 Core Thesis

Tokenized stocks already trade on-chain. That alone does not make them more valuable than the same assets in a brokerage app. Tokenized assets become genuinely more valuable when they can participate in useful economic workflows beyond holding and trading — when ownership itself becomes usable spending power.

Avela is built around that insight. It connects ownership of a tokenized asset directly to the ability to pay. The asset class we start with is tokenized equities; the thesis is broader, but the MVP stays narrow on purpose.

**The role of stablecoins:** Stablecoins (USDG, USDC) play two roles: (1) a holdable balance in the account — like cash alongside your stocks, and (2) the settlement backbone — they settle instantly, work globally, and bridge tokenized stocks to real commerce. The merchant can receive stablecoins directly or local currency (USD, GHS, NGN, YEN, other local currencies) via payout partners — the stablecoin routing is invisible to both sides.

This maps directly to what "Build a Market" tracks and RWA-focused programs are asking for — new ways for users and assets to interact onchain, and asset-based payment or commerce experiences by integrating tokenized stocks and RWA.

---

## 2. Problem & Opportunity

### 2.1 Problem

People hold value in tokenized stocks on-chain. When they need to pay for something, they must manually decide what to sell, find a conversion route, execute it, then make a separate payment. The assets sit disconnected from the financial workflows they already need.

The few players addressing this solve only "convert and pay" — instantly sell the asset at checkout. Nobody is solving "pay without selling" — where the user keeps their position and gets spending power from it. That gap is Avela.

### 2.2 Market Opportunity

- Onchain tokenized equities crossed roughly **$1B in aggregate value in Q1 2026**, tracking toward **$2B+** by mid-year.
- xStocks reports **$25B+ cumulative trading volume and 100,000+ holders**.
- "Spend without selling" is an already-proven behavior — every private bank offers it. The on-chain, instant, permissionless, global version does not exist yet.
- Multiple credible rails exist: X Layer with xStocks, Circle Arc, Ondo Global Markets. The product depends on tokenized equities existing as liquid, composable assets, which is now true in several places.

---

## 3. The Product

### 3.1 Product Category

**Programmable spending account for tokenized stocks.**

Of the standard wedges (trading, investing, credit/yield, infrastructure, consumer), Avela is deliberately a **Consumer** product: mobile-first, individual account, spending from a portfolio. The programmability — policies, spending rules, agent permissions — is what makes this an account, not just a card. It is the reason Avela can serve use cases other spending products cannot.

### 3.2 Positioning

**Short:** Pay from your portfolio. Without selling.

**Expanded:** Avela turns tokenized stocks into spending power. Deposit, see what you can spend, and pay at checkout — your stocks stay in the market, the merchant gets paid in their currency.

**Product anchor:** "Avela is where my tokenized stocks become spending power."

**What makes it programmable:** an intelligence layer that watches, evaluates, decides, authorizes, and executes — under rules the user defines. Spending policies (daily limits, price floors, minimum balances), approval rules (human sign-off above thresholds), agent permissions (AI agents that operate the account within defined rules), and automation (watchers that trigger actions when conditions are met). The intelligence layer is core to the product, not an add-on. See §7.2.

### 3.3 Core Account Model

```text
                    AVELA ACCOUNT
                          |
             +------------+------------+
             |            |            |
           HOLD         MANAGE     PAY WITH AVELA
             |            |            |
             v            v            v
          Tokenized    Portfolio    "Pay with Avela"
          Stocks &     Controls,    at checkout
          Stablecoins  Policies,         |
             |         Permissions       v
             |            |        FUNDING ENGINE
             +------------+------> (selects best source
                          |         under policy)
                          v              |
                   SPENDING POWER   +----+----+
                                    |         |
                                    v         v
                              Draw from   Use
                              spending    stablecoin
                              power       balance
                              (positions
                               stay)
                                    |         |
                                    +----+----+
                                         v
                                  MERCHANT RECEIVES PAYMENT
                                  (stablecoins, USD, GHS, NGN, etc.)
```

The account combines:

- Asset balances (tokenized stocks, stablecoins)
- Spending power (calculated from portfolio with haircut applied)
- Spending policies and permissions
- Payment identity
- Transaction history, receipts, and settlement status

### 3.4 Account vs Portfolio

**Account** = the financial product. Spending power, payment functionality, policies, permissions, transaction history.

**Portfolio** = the assets held within the account. Initially tokenized stocks. The portfolio powers the spending experience — it is not the product itself.

### 3.5 Core Account Actions

**Hold** — deposit and hold supported tokenized stocks and stablecoins.

**Manage** — view positions, spending power, asset eligibility, spending controls, policies, and permissions.

**Pay** — "Pay with Avela" at checkout. The Funding Engine selects the best source under your policy: draw from spending power (positions stay) or use stablecoin balance. One action, one button — the routing is internal. If neither source covers the payment, it fails gracefully — the user decides what to do next.

### 3.6 Core Primitives

| Category | Primitives |
|----------|-----------|
| Account | Account, Balance, Portfolio, Spending Power, Permission, Spending Limit |
| Asset | Asset, Position, Eligibility, Valuation, Haircut |
| Payment | Payment Intent, Authorization, Funding Decision, Settlement, Receipt |
| Policy | Spending Policy, Approval Rule, Agent Permission, Funding Preference |
| Commerce | Checkout, Invoice, Payment Link, Merchant Settlement |

### 3.7 What You Can Do

| Capability | Description |
|-----------|-------------|
| See spending power | Know how much you can spend based on what you hold |
| Pay with Avela | One-tap checkout — positions stay in the market by default |
| Spending policies | Daily limits, price floors, minimum balances, stablecoin-first routing |
| Approval rules | Human sign-off when payment exceeds threshold |
| Agent permissions | AI agent operates account within defined spending rules |
| Asset eligibility | Which assets can fund a payment based on type, liquidity, and policy |
| Settlement | Merchant receives payment in their currency — USDC, USD, GHS, NGN, etc. |
| Receipts and audit | Complete trail: source asset, funding decision, settlement |

---

## 4. Users & Use Cases

### 4.1 Target Users

**Avela is consumer-first.** The headline user is an individual holder of tokenized stocks who wants spending power from their portfolio.

**Primary:** Individual holders of tokenized equities who want to use the value of their holdings without liquidating — people who hold xStocks or similar assets and want spending power from them.

**Also served:**

- AI agents operating accounts within defined spending rules
- Merchants accepting "Pay with Avela" at checkout
- Businesses spending or paying invoices from a portfolio treasury

**Geography:** Africa, Asia, and Latin America — markets where cross-border stablecoin commerce is strongest, traditional banking rails are weakest, and demand for dollar-denominated spending power is highest. These regions have the largest gap between "holds digital assets" and "can use them to pay." Crypto-native users globally are the early adopters; the beachhead markets are where the product becomes essential, not optional.

### 4.2 Use Cases

**Pay without selling:**

- User holds xAAPL → deposits into Avela → sees $500 spending power → pays for a subscription → position stays intact → merchant receives USDC (or GHS, NGN, USD and other local currencies via payout)

**Agent-authorized spending:**

- User grants agent permission: "spend up to $50/day on approved services"
- Agent operates within rules → draws spending power → merchant settled → receipt generated

**Cross-border commerce:**

- Freelancer in Accra holds xGOOGL → client in Tokyo requests payment → "Pay with Avela" → Avela draws spending power, settles via USDC, routes to local currency → client receives YEN → freelancer's stocks untouched

**Recurring payments:**

- User sets up monthly subscription → Avela auto-funds from spending power each cycle

---

## 5. Core Experience: Pay with Avela

One action at checkout. One button. The system handles everything behind it.

Every payment shows a preview before execution: amount, funding source, recipient, estimated settlement, and any approval required. The user confirms what will happen — no surprises.

```text
User deposits tokenized stocks
       |
       v
Avela applies haircut → Spending Power created
       |
       v
User sees: "You can spend up to $X"
       |
       v
"Pay with Avela" at checkout
       |
       v
FUNDING ENGINE (under policy)
       |
       +-- Has spending power available? → Draw from it (positions stay)
       +-- Has stablecoin balance? → Use it directly
       +-- Neither sufficient? → Payment fails. User decides next step.
       |
       v
Merchant receives payment (USDC / local currency)
       |
       v
Receipt (source, funding decision, settlement)
```

The user sees spending power and a pay button. The Funding Engine selects the best source per-transaction under their spending policy. Positions stay in the market. If neither spending power nor stablecoin balance covers the payment, it fails gracefully — the user decides whether to deposit more, add stablecoins, or manually sell a position. Avela never silently sells your stocks.

### 5.1 The Funding Engine

The Funding Engine is the system that turns "Pay with Avela" into a settled payment. It is not user-facing — the user just taps pay. The engine:

1. Reads the payment intent (amount, recipient)
2. Checks spending policy (daily limit, price floor, minimum balance, approval threshold)
3. Selects funding source: spending power → stablecoin balance (in that priority order, configurable by policy)
4. If neither covers the amount → payment fails gracefully, user decides next step
5. If approval required, requests human sign-off
6. Executes funding and routes to settlement
7. Merchant receives payment (USDC or local currency)
8. Receipt generated

Funding sources the engine can route through:

- **Spending power** — draw against haircut-adjusted portfolio value. Positions stay. This is the default and the headline.
- **Stablecoin balance** — direct USDC/stablecoin payment. No conversion needed.

Avela never silently converts or sells a user's stocks at checkout. If the user wants to sell a position for stablecoins, that is a manual portfolio action — separate from the payment flow.

Future funding sources (roadmap): card networks, fiat rails, credit facilities. The Funding Engine is designed to add sources without changing the user experience.

---

## 6. Agent, Permission & Policy Model

### 6.1 Agent Access

Agent access is a first-class account primitive. A user defines:

- Which account an agent can access
- Which assets it can use
- Maximum amount per transaction and per day
- Approved recipients / merchants / categories
- Whether approval is always required
- Whether the agent can create payment requests
- Expiry and revocation rules

Example policy:

```text
Agent may spend:
- up to 100 USDC per transaction
- up to 500 USDC per day
- only with approved merchants
- human approval above 50 USDC
- expires in 30 days
```

**Portable policy principle:** Avela defines the policy language. If a wallet provider supports spending controls, Avela compiles to their format. If not, Avela enforces it before calling the provider. The policy travels even if the underlying provider changes.

**Agents operate the account. They are not the account itself.** They never own the money — only scoped authority.

### 6.2 Messaging as Access Layer

Avela's account is accessible where the user already lives — messaging apps, web, and agent interfaces. Messaging is not a support channel bolted onto a dashboard. It is a primary access surface for account operations. Money moves through messages.

The account is the anchor; messaging is one of its surfaces. See §7.5 for the full messaging interface model.

---

## 7. Product Architecture

### 7.1 Product Layers

Four primary layers with intelligence cross-cutting:

**Layer 1 — Asset:** represent and manage what the user owns. Hold, track, value, determine eligibility, calculate spending power.

**Layer 2 — Transaction:** move and settle value. Transfer, liquidity selection, routing, execution, settlement, FX.

**Layer 3 — Payments:** turn intent into payment. Create, authorize, fund, execute, track, settle.

**Layer 4 — Commerce:** the economic activity surrounding payments. Checkout, invoices, subscriptions, recurring payments, merchant settlement.

**Cross-cutting — Intelligence:** the automation and agent layer that operates across all four layers. This is not a chatbot or copilot — it is the system that makes the account programmable.

```text
Commerce
    |
Payment          ← Intelligence cross-cuts all layers:
    |                WATCH → EVALUATE → DECIDE → AUTHORIZE → EXECUTE
Transaction
    |
Asset
```

### 7.2 Intelligence & Automation

Intelligence is what separates Avela from every other spending account. AI/agents **operate the financial account** — they are not the financial account itself. They never own the money; they have scoped authority to act within defined rules.

**The Action Layer:** translates requests — natural-language or structured — into reviewable financial actions. "Pay this invoice," "spend up to 50 USDC/day on approved services," "alert me if spending power drops below $200" — each becomes a structured action with identity, amount, recipient, policy check, approval state, and receipt.

**The operating loop:**

```text
WATCH      — monitor account state, market conditions, incoming requests
   ↓
EVALUATE   — check against policies, permissions, thresholds
   ↓
DECIDE     — select funding source, determine action, flag exceptions
   ↓
AUTHORIZE  — request human approval if required by policy
   ↓
EXECUTE    — complete the action, settle, generate receipt
```

Example: Invoice arrives → Watcher detects it → Policy evaluation (amount, recipient, daily limit) → Funding decision (spending power or stablecoin) → Human approval requested (above threshold) → Payment executed → Receipt generated.

**What this enables:**

- Spending policies that enforce themselves (daily limits, price floors, minimum balances)
- Approval workflows that route to the right person at the right threshold
- Agents that discover services, negotiate, and pay — within bounded permissions
- Automated recurring payments that respect current portfolio state
- Watchers that alert when spending power changes or conditions are met

**This is the programmability.** Gether is a card you tap. A neobank is a dashboard you log into. Avela is an account that watches, evaluates, decides, and executes — under rules you define. The intelligence layer is what makes "Pay with Avela" composable with AI agents, messaging interfaces, and automated workflows.

### 7.3 Core Stack

```text
                         AVELA
              PROGRAMMABLE SPENDING ACCOUNT
                           |
                      PORTFOLIO
                    (tokenized stocks + stablecoins)
                           |
                      SPENDING POWER
                    (haircut-adjusted value)
                           |
                    "PAY WITH AVELA"
                           |
                    FUNDING ENGINE
              (selects source under policy)
                           |
               +-----------+-----------+
               v                       v
          Draw from                  Use
          spending                 stablecoin
          power                    balance
          (positions stay)
               |                       |
               +-----------+-----------+
                           v
                    STABLECOIN SETTLEMENT
                           |
                        MERCHANT


AVELA ENGINES                        EXTERNAL ECOSYSTEM
       |                                    |
   +--------+---------+--------+    +-------+-------+-------+
   |        |         |        |    |       |       |       |
 Asset   Spending  Funding   Policy  Issuers  Liquidity  Data
 Engine  Power     Engine    Engine   |       |       |
   |     Engine      |        |    xStocks  DEXs   Oracles
   +--------+---------+--------+    Stables  LPs    Market
                                            Venues  Data
                                               |
                                             RAILS
                                      X Layer + USDC/USDG
```

### 7.4 Vocabulary

| Term | Meaning |
|------|---------|
| Account | The financial product — spending power, policies, payments |
| Portfolio | Assets held within the account |
| Spending Power | Haircut-adjusted value available for spending |
| Haircut | Safety cushion held back from portfolio value |
| Funding Engine | System that selects how a payment is funded under policy |
| Engine | Internal system (asset, spending power, funding, policy) |
| Provider | External service (issuer, liquidity, wallet, oracle) |
| Settlement | Merchant receives payment in their currency |
| Rail | Network through which value moves (X Layer, USDC/USDG) |
| Policy | Rules governing spending behavior |
| Agent | AI entity that operates account within defined permissions |
| Intelligence | Cross-cutting automation layer: WATCH → EVALUATE → DECIDE → AUTHORIZE → EXECUTE |
| Action | Structured, reviewable financial operation — created from requests (natural-language or structured) |
| Watcher | Monitor that observes account state, market conditions, or incoming events and triggers evaluation |

### 7.5 Identity & Messaging

**Identity resolution:** pay by username, payment link, messaging ID, ENS name, or wallet address. The identity resolver returns: destination account, type, supported assets, verification status.

**Messaging as a primary interface:** Messaging is not a support channel bolted onto a dashboard — it is a first-class access surface for the account. Money moves through messages.

- Check spending power, balances, and transaction status via Telegram or WhatsApp
- Approve or reject a spend request from a message
- Receive payment receipts and settlement confirmations in-conversation
- Natural-language account actions: "How much can I spend?" / "Approve that payment"
- Agent actions routed through messaging (agent requests approval, user approves in WhatsApp)
- Cross-channel continuity — start a payment in web, approve in Telegram, see receipt in both

The account is usable without ever leaving the conversation where the transaction began. This is what "messaging-native" means — the account lives where the user already is.

### 7.6 Settlement & Currency

The user holds tokenized stocks. The merchant receives money in their currency. Avela bridges the gap.

```text
USER HOLDS          AVELA HANDLES           MERCHANT RECEIVES
xAAPL, xGOOGL  →   Spending Power      →   USDC
xTSLA, etc.         + Funding Engine         USD, GHS, NGN,
+ USDC              Settlement/FX            YEN, EUR
                    Routing
```

The user sees spending power. The merchant sees money in their currency. Avela handles everything in between.

A merchant in Accra receives GHS. A freelancer in Lagos receives NGN. A supplier in Tokyo receives YEN. An onchain merchant receives USDC directly. The user just sees "Pay with Avela" — the currency routing is invisible.

### 7.7 Security, Compliance & Risk

- **Asset volatility:** equities move, and spending power is connected to portfolio value. Spending power adjusts with price. Users see this transparently.
- **Oracle/price feed risk:** spending power calculation depends on reliable pricing. State the feed source plainly. Production requires robust, RWA-aware oracle.
- **Regulatory:** Avela uses already-compliant tokenized assets. Avela is a spending/payments layer, not a broker-dealer or asset issuer.
- **Smart contract risk:** unaudited at MVP. Audit is first post-funding milestone.
- **Compliance:** KYC/KYB, sanctions screening, transaction monitoring via external services. Avela owns product-level eligibility rules, permissions, and policy enforcement.

---

## 8. Ownership Boundaries

### 8.1 What Avela Owns

**Product:** the spending account — deposit, spending power, "Pay with Avela," settlement, receipt.

**Engines:** Asset abstraction, spending power (haircut + valuation), Funding Engine (source selection under policy), policy/intelligence, settlement orchestration.

**Primitives:** Account, Portfolio, Spending Power, Haircut, Payment Intent, Funding Decision, Policy, Agent Permission, Receipt.

### 8.2 What Avela Integrates

Tokenized-stock issuers, stablecoin infrastructure, liquidity venues, price feeds/oracles, wallet infrastructure, blockchain networks, compliance services.

### 8.3 What Avela Does Not Own

A blockchain, tokenized-stock issuance, a DEX, liquidity pools, an oracle, bank rails, card networks. The moat is the **programmable spending account: spending power abstraction + Funding Engine + policy layer**, not any external component.

---

## 9. Build Plan

MVP scope, detailed roadmap, milestones, technical choices, and target events are in [SPEC.md](SPEC.md).

---

## 10. Go-To-Market

### 10.1 Initial Market Entry

**Beachhead:** holders of tokenized equities in Africa, Asia, and Latin America who want dollar-denominated spending power from their portfolio — markets where cross-border stablecoin commerce is strongest and traditional banking rails are weakest. Crypto-native users globally are early adopters; the beachhead markets are where the product becomes essential.

**Wedge:** "Spend from your portfolio. Without selling."

**Near-term channels:**

- X Layer ecosystem (xStocks holders, OKX community)
- OKX Dev Day 2026 as launch event
- Circle Developer Grants (if stablecoin leg built on Circle/Arc)
- Crypto-native communities holding tokenized equities
- Founder/developer communities across Africa, Asia, and Latin America

### 10.2 Distribution

- OKX Dev Day demo → first users from xStocks community
- Product-led: every "Pay with Avela" checkout creates merchant awareness
- Developer/builder communities
- AI-agent builders (Phase 3)
- Accelerators (YC, etc.) once working demo exists

### 10.3 Adoption Strategy

**Growth flywheel:**

```text
More assets deposited
       |
More spending power created
       |
More spending / payments
       |
More merchant adoption ("Pay with Avela")
       |
More reasons to hold tokenized stocks
       |
More assets flow into Avela
```

**Long-term platform play (Phase 4):** "Pay with Avela" as embeddable checkout SDK for other RWA platforms, wallets, and neobanks.

---

## 11. Business Model

### 11.1 Revenue Streams

**Primary:**

- **Transaction/payment fee** on completed spend and pay transactions
- **Settlement/FX economics** on currency routing where merchant receives local currency

**Secondary:**

- **Premium account** — advanced automation, policies, agent capabilities, business controls
- **API / infrastructure** — "Pay with Avela" SDK for fintechs, wallets, commerce platforms
- **Merchant/commerce fees** — checkout, payment acceptance, settlement

### 11.2 Unit Economics

Revenue scales with transaction volume. The haircut/spending-power model creates margin opportunity through the spread between portfolio value and spending power extended, plus transaction fees on each payment.

Do not optimize pricing before repeated transactions are proven. First measure whether users return to spend again.

---

## 12. Competitive Landscape

### 12.1 Competitors

| Player | What they do | Avela's angle |
|--------|-------------|---------------|
| **Gether** | Card that spends against stocks without selling | Closest analogue. Proves the model. Avela adds policy engine, agent support, programmability |
| **Alchemy Pay x xStocks** | Instant conversion at checkout | Convert-and-pay only. Avela's headline is spend-without-selling |
| **Ondo / xStocks / Securitize** | Issue and distribute tokenized equities | Supply side. Avela is the demand-side spending layer above them |
| **Liminal / Dinari** | Tokenized-stock infrastructure for fintechs | Infrastructure. Avela is the end-user product |
| **Raycash** | Stablecoin spending account with privacy (Zama/FHE) | Same direction (global spending account), different asset. Raycash = stablecoin-native, privacy differentiator. Avela = tokenized-stock-native, programmability differentiator |
| **Aave / Morpho** | Crypto-collateral borrowing | DeFi lending UX, no checkout/commerce, no equity collateral |

### 12.2 Closest Analogue

**Gether** — card that spends against tokenized stocks, crypto, and cash without selling. Uses haircut-based spending power (same model). Proves the model works and has market demand.

**How Avela differs from Gether:**

- **Programmable:** Avela ships with a policy engine — spending rules, approval thresholds, agent permissions. Gether is a card you tap. Avela is an account you configure.
- **Agent-ready:** AI agents can operate the account within defined permissions. No card product supports this.
- **Funding Engine:** Multiple funding sources routed per-transaction under policy, not just draw-from-collateral.
- **Onchain-native:** Built on tokenized stocks (xStocks/RWAs) on X Layer. Every payment generates real swap volume on OKX DEX — Avela is a demand-side market driver.

### 12.3 Differentiation

Avela's moat: **programmable spending account** — policies, agent permissions, multi-source funding engine, and onchain settlement. A card product can't add programmability without rebuilding into an account. An account product can always add a card.

---

## 13. What Avela Is Not

- A tokenized-stock issuer or RWA marketplace — Avela uses existing issuers (xStocks, Ondo, etc.)
- A DEX or trading platform — Avela uses existing liquidity pools
- A lending protocol — the mechanism underneath spending power is plumbing, not the product identity
- A portfolio dashboard or brokerage — the portfolio powers spending, it is not the product
- A card-first product — the card is a future surface, the account is the product
- An AI-agent product — agents operate the account under permissions, they are not the product
- A product defined by one chain, issuer, or provider — adapters are replaceable

---

## 14. Risks & Constraints

| Risk | Impact | Mitigation |
|------|--------|------------|
| Asset volatility | Spending power fluctuates with portfolio value | Transparent display, conservative spending power calculation, price floors |
| Oracle/price risk | Bad pricing = wrong spending power | State feed source plainly, invest in robust oracle |
| Regulatory | Tokenized stocks are regulated securities | Avela is spending/payments layer, not broker-dealer. Uses already-compliant tokens |
| Smart contract risk | Unaudited at MVP | Audit as first post-funding milestone |
| Liquidity depth | Thin pools affect spending power valuation and settlement FX | Start with most liquid asset, monitor pool depth |
| Haircut calibration | Conservative haircut reduces spending power; aggressive haircut increases liquidation risk | Start conservative (50%), adjust per-asset as risk model matures |
| Provider dependency | A provider outage or policy change affects user experience even with adapter model | Adapter architecture isolates impact; no single provider is permanent; monitor provider health |

---

## 15. References

### Chains & Settlement Rails

- [X Layer](https://web3.okx.com/xlayer) — primary chain for MVP (OKX L2)
- [Circle / Arc](https://www.circle.com/) — stablecoin issuance, settlement infrastructure, developer grants programme
- USDG (Global Dollar) — dominant stablecoin on X Layer for xStock pools
- USDC — secondary settlement stablecoin (wQQQx, wGOOGLx route through USDC pools)

### Asset Issuers & Providers

- [xStocks](https://xstocks.com/) — tokenized equities on X Layer ($25B+ cumulative volume, 100K+ holders)
- [xStocks ecosystem](https://xstocks.com/ecosystem) — partner and integration landscape
- [Ondo Global Markets](https://ondo.finance/) — tokenized equity issuer
- [Securitize](https://securitize.io/) — tokenized equity issuer
- [Dinari / Liminal](https://dinari.com/) — tokenized-stock infrastructure for fintechs

### Wallet / Account Infrastructure

- [Privy](https://www.privy.io/) — embedded wallets, auth, agent wallets, scoped permissions, card programmes
- [Coinbase](https://docs.cdp.coinbase.com/wallets/using-wallets/spend-permissions) — spend permissions with limits by token, time, amount
- [Circle](https://developers.circle.com/api-reference) — wallets, stablecoin movement, payment APIs, policies

### Liquidity & Conversion

- Uniswap V3 — DEX pools on X Layer (xStock/stablecoin)
- [0x](https://0x.org/) — swap/aggregator infrastructure
- [1inch](https://1inch.io/) — swap/aggregator infrastructure
- [Alchemy Pay](https://alchemypay.org/) — xStocks Alliance, instant convert at checkout

### Payment & Card Infrastructure

- [Rain](https://www.rain.xyz/) — global payouts (80+ countries, 50+ currencies), virtual accounts, on/off-ramps, card issuing
- Stripe Issuing (via Privy) — stablecoin-backed card programmes
- [Pods Finance](https://pods.finance/) — emerging-market neobank ecosystem, partner network

### Agent & AI Infrastructure

- [Sail Protocol / Sailor](https://github.com/sail-money/protocol) — agent mandates, bounded onchain execution, fail-closed permissions, simulation
- [OKX.AI](https://web3.okx.com/onchainos/dev-docs/okxai/what-is-okxai) — agent interaction, identity, ASP models
- OKX Onchain OS — agent and onchain execution capabilities
- x402 — agent-payment protocol (Hedera)
- MCP — model context protocol for agent skill exposure

### Identity

- ENS / ENSv2 — naming, subnames, delegated records, permissioned resolvers

### Messaging Platforms

- WhatsApp, Telegram, iMessage, Wave, SMS, web chat — account access channels

### Data & Oracles

- Uniswap V3 TWAP — MVP pricing from pool data
- OKX market data API — secondary/validation pricing
- Chainlink Data Streams — production oracle (when X Layer VerifierProxy available)

### Compliance

- KYC/KYB, sanctions screening, transaction monitoring — external services, provider TBD

### Product Analogues — Spending / Consumer

- [Gether](https://trygether.com/) — card that spends against stocks, crypto, and cash without selling
- [Alchemy Pay × xStocks Alliance](https://xstocks.com/ecosystem) — instant convert-at-checkout for tokenized stocks
- [Raycash](https://raycash.xyz) — stablecoin spending account with privacy (Zama/FHE)

### Product Analogues — Messaging & AI Accounts

- [Axra](https://www.useaxra.com/) — AI-powered global money account, multi-currency, messaging access
- [Xara](https://www.xara.to/) — WhatsApp AI financial assistant, transfers, invoicing
- [Azza](https://useazza.com/) — WhatsApp AI agent for crypto buy/sell/send
- [Talise](https://www.talise.io/) — stablecoin dollar account, name-based transfers, AI copilot
- [Rail](https://www.userail.money/) — intelligent money account with Visa card

### TradFi Analogues (proves demand)

- Schwab, Morgan Stanley — securities-based lines of credit (multi-hundred-billion-dollar product line, gated behind private banking)
- IBKR — margin accounts

### DeFi Lending (adjacent, not competition)

- [Aave](https://aave.com/) — crypto-collateral borrowing, no equity collateral or checkout UX
- [Morpho](https://morpho.org/) — crypto-collateral lending markets

### Events & Grants

- [OKX Dev Day 2026](https://luma.com/l4aq8vii) — "Build a Market" track, submit Sep 25, finale Oct 6–7 Singapore
- Circle Developer Grants — milestone-based USDC funding for builders on Arc and Circle Developer Platform
- [X Layer AI-RWA Build X Series](https://web3.okx.pro/xlayer/build-x-series)
- YC and accelerators — standard equity-funding path once working demo exists

---

## Version History

- Avela-v1: messaging-native business account (agent permissions, messaging actions, identity, ENS, portable policy, reference implementations)
- Avela-v2: asset-to-payment rail on X Layer (merchant checkout, RWA adapters, buyer/merchant/agent experience)
- Avela-v3: asset-based payment and commerce rail (feature priority table P0–P3, phased roadmap aligned to OKX Dev Day, provider landscape)
- Avela-v4: complete architecture PRD (5-layer model, core engines, provider abstraction, adapter architecture, economic flywheel)
- Avela-v5: programmable global payment account (Pay + Spend from portfolio, product layers, primitives vocabulary, ownership boundaries)
- Avela-v6: spend-without-selling as headline wedge (consumer spending power, two spending modes, competitive landscape)
- **Current (v3.0):** consolidated product vision — haircut-based spending power, single "Pay with Avela" action, Funding Engine, programmable policies, intelligence layer, messaging-native access, multi-currency settlement
