# Avela Phase 1 PRD

## Document status

- Status: Draft for product and technical audit
- Product: Avela
- Phase: X Layer launch wedge
- Related product document: `product/ideas/Avela Product.md` in the SamuelOS vault
- Research: `knowledge/research/Tokenized Stocks Ecosystem & AvelaX.md` in the SamuelOS vault
- Owner: Avela team
- Last updated: 2026-09-16

This PRD defines the first build. It does not replace the broader Avela product vision. It is intentionally narrow enough to build and demonstrate, while proving the larger asset-based payment and commerce thesis.

## Canonical references

- Full Avela product source: `/Users/samueldanso/Workspace/samuelos/product/ideas/Avela Product.md`
- Tokenized-stocks research: `/Users/samueldanso/Workspace/samuelos/knowledge/research/Tokenized Stocks Ecosystem & AvelaX.md`
- Technical resource index: `/resources` [resources/README.md](../../resources/README.md)
- Resource source registry: [resources/source-registry.md](../../resources/source-registry.md)
- Verification plan: [resources/verification-plan.md](../../resources/verification-plan.md)

Use the full product source for the company vision, market, positioning, and roadmap. Use this PRD for Phase 1 requirements. Use the resource index and registry before introducing a new provider, SDK, API, contract, or agent skill.

### Resource map for the technical audit

- X Layer and OKX execution: `resources/okx-dex-sdk`, `resources/okx-dex-api-library`, and `resources/onchainos-skills`.
- xStocks asset and contract references: `resources/source-registry.md` and the linked official xStocks documentation.
- X Layer liquidity and routing: `resources/universal-router` and `resources/uniswap-sdks`, subject to verification for the selected asset and route.
- Token behavior and RWA contract patterns: `resources/backed-token-contract` and `resources/backed-ccip-contract`.
- Existing xStocks liquidity/token-list reference: `resources/cowswap-xstocks-tokenlist`.
- Full external source list, clone provenance, and verification status: `resources/source-registry.md`.

These resources are references, not approvals. A cloned repository or listed SDK does not prove that the selected xStock, stablecoin, wallet, or execution route works on X Layer.

## 1. Product thesis

> **The asset-based payment and commerce rail. One global account to hold, grow, and spend against the stocks, crypto, and cash you already own — without selling.**

Phase 1 proves this thesis with tokenized stocks and stablecoins on X Layer.

## 2. Phase 1 user and job

**Primary user:** A crypto-native business, Web3 startup, or agent-operated account that holds tokenized stocks and stablecoins and needs to make payments.

**Core job:** “Pay this recipient in stablecoin, using my available balance first and an eligible tokenized stock only when the funding policy allows it.”

**Why they return:** Repeated obligations — supplier invoices, contractor payments, merchant settlement. Avela saves manual funding decisions and creates a reliable record of what was paid, from which source, under which policy.

## 3. Phase 1 product boundary

### In scope

Phase 1 ships as a complete product, not a single-feature demo. A judge should open the app and experience a full account with smart payment capabilities.

- **Account** — one account with identity, balances, portfolio positions, recipients, permissions, and transaction history.
- **Portfolio view** — display stablecoin balance, tokenized stock position, current value, and available spending power.
- **Asset eligibility** — identify which assets can fund a payment based on type, liquidity, and policy.
- **Portfolio funding** — stablecoin-first policy; use a tokenized stock only when balance is insufficient and the asset is eligible.
- **Spending policy** — configurable minimum portfolio balance, price floor, execution limits, and daily caps.
- **Payment intents** — create a payment with recipient, amount, currency, and memo.
- **Payment links** — let a recipient pay without creating an Avela account first.
- **Approval rules** — require human approval when a payment exceeds a configured threshold.
- **Agent permissions** — let an agent create and execute payments within defined spending limits, approved recipients, and expiry rules.
- **Settlement** — deliver the recipient's stablecoin on X Layer with onchain confirmation.
- **Receipts and audit** — record every payment with payer, recipient, amount, funding source, policy decision, approval, and transaction references.
- **Web/PWA** — the primary interface a user or judge interacts with.
- **API** — create intents, request quotes, approve payments, and read status programmatically.
- **MCP/agent skill** — expose the same workflow to AI agents with the same policy checks (OKX AI integration).
- **X Layer deployment** — verifiable onchain demo with contract addresses and transaction links.

One supported tokenized stock and one supported stablecoin on X Layer.

### Out of scope for Phase 1

- Full brokerage or exchange experience.
- General stock trading interface.
- Token launchpads, memes, or social trading.
- Open-ended lending or credit products.
- Yield strategies.
- Physical or virtual card issuance as a dependency.
- Fiat settlement or local bank rails.
- Multi-chain routing.
- Multiple asset classes beyond the selected stock and stablecoin.
- Autonomous agents with unrestricted spending authority.

## 4. Shared Avela platform capabilities

The X Layer asset-funding flow is the Phase 1 wedge. It runs on the broader Avela account and commerce foundation rather than becoming a separate product.

### Account

- Business or operator account with profile, balances, permissions, activity, and security controls.
- One account identity across web, API, and agent interfaces.
- Stablecoin balance and supported portfolio positions are visible from the same account.

### Identity and recipient resolution

- A payment recipient can be resolved by an Avela username, handle, payment link, approved wallet address, or another supported identity adapter.
- Recipient resolution must show the resolved destination before execution.
- ENS, messaging identities, phone numbers, or email may be added through adapters; they are not Phase 1 dependencies.

### Messaging and interfaces

- The web/PWA is the first required interface.
- API and MCP/agent access use the same account, policy, and payment state.
- Telegram, WhatsApp, and other messaging channels are product extensions, not separate payment systems.
- Every money-moving action must show a preview containing source, destination, amount, asset, fees, expected settlement, and approval requirement.

### Agent permissions

- Owners can define allowed assets, transaction limits, daily limits, approved recipients, approval requirements, expiry, and revocation.
- Agents may operate an account within those permissions; they do not own the money.
- Avela must reject agent actions that exceed policy, even if the agent requests them through a valid interface.

### Commerce and settlement

- The payment model should support payment requests, invoices, links, and direct payments even if Phase 1 demonstrates only one of them.
- Stablecoin settlement is the first settlement rail.
- Cards, fiat balances, local rails, and additional networks remain replaceable extensions.

### Adapter architecture

- Account, wallet, identity, asset, liquidity, settlement, messaging, agent, commerce, and card providers are integration boundaries.
- A provider may power the first implementation without becoming part of Avela's permanent product definition.

## 5. Core workflow

1. The user creates or selects an account.
2. The user connects or provisions the supported wallet/account route.
3. Avela displays the stablecoin balance, supported stock position, current value, reserve, and available spending power.
4. The user creates a payment intent with recipient, amount, currency, memo, and due time.
5. Avela checks recipient approval, asset eligibility, reserve, price/execution constraints, and payment limits.
6. Avela selects stablecoin balance first.
7. If more funding is required, Avela proposes the permitted tokenized-stock action and shows the expected amount, constraints, and risks.
8. Avela requests approval when the policy requires it.
9. The execution adapter performs the supported conversion or transfer route.
10. Avela settles the recipient payment.
11. Avela records execution, settlement, policy decisions, approvals, and receipt data.
12. The user can inspect the completed payment and share the receipt.

If a real xStock-to-stablecoin execution path on X Layer cannot be verified, Phase 1 must clearly separate:

- real onchain stablecoin settlement;
- verified portfolio and pricing data;
- simulated or paper execution for the stock-funding step.

The demo must never present a simulated stock conversion as a completed real transaction.

## 6. Feature requirements

### Account and portfolio

- The user can see account identity, supported balances, stock positions, and transaction history.
- The system identifies whether an asset is eligible for the selected workflow.
- The UI shows the source, timestamp, and limitations of portfolio valuation data.

### Payment intent

- The user can create a payment with recipient, amount, stablecoin, memo, and optional recurrence metadata.
- The system rejects unsupported assets, currencies, recipients, or amounts before execution.
- The payment has explicit states: `draft`, `awaiting_approval`, `funding`, `settling`, `completed`, `failed`, or `cancelled`.

### Funding policy

- Stablecoin balance is considered before stock conversion.
- The user can configure a minimum protected portfolio balance.
- The user can configure an approval threshold.
- The system records the policy decision and the funding source selected.
- The system fails safely when price, liquidity, eligibility, or route data is stale or unavailable.

### Approval

- Payments above the configured threshold require an explicit approval.
- The approver can see recipient, amount, funding source, expected conversion, constraints, and expiry.
- An approval cannot be reused for a materially different payment.

### Execution and settlement

- Execution is performed through an adapter, not hardcoded into the product domain.
- The system records transaction hashes or provider references where available.
- Settlement is only marked complete after the recipient-side transfer is confirmed.
- Failed or partially completed actions are visible and recoverable through a defined state.

### Receipts and audit

- Every completed or failed payment produces a human-readable receipt.
- The receipt includes payer, recipient, amount, currency, funding source, policy result, approval, timestamps, and execution references.
- Users can retrieve payment history through the app and API.

### API and agent access

- An authenticated client can create a payment intent.
- An authenticated client can request a quote or funding plan without executing it.
- An authenticated client can approve an eligible payment when authorized.
- An authenticated client can read status and receipt data.
- MCP/agent actions use the same policy and approval checks as the web app.
- Agent access is bounded by account-level permissions and spending limits.

## 7. Technical architecture

### Avela-owned components

- Account and identity model.
- Payment intent and transaction state machine.
- Portfolio and asset eligibility model.
- Funding policy and approval engine.
- Adapter interfaces for wallet, asset, liquidity, and settlement providers.
- Receipt and audit model.
- API, web/PWA experience, MCP, and agent skill.

### External components to verify

- X Layer RPC, chain configuration, and deployment tooling.
- OKX Onchain OS or Agentic Wallet account and execution route.
- xStocks asset list, metadata, pricing, proof-of-reserves, market status, and corporate-action data.
- The exact supported xStock contract and token behavior on X Layer.
- Stablecoin contract and transfer route on X Layer.
- Uniswap or another supported X Layer liquidity route.
- Wallet signing, custody, permissions, and recovery model.
- Compliance and regional eligibility requirements.

### Adapter rule

The product domain must not assume that one provider owns the account, asset, liquidity, or settlement layer forever. Each integration must have an interface and a testable provider implementation.

## 8. Demo acceptance criteria

The Phase 1 demo is acceptable when a reviewer can:

1. Open the Avela app.
2. View a supported stablecoin balance and tokenized stock position.
3. Create a payment to an approved recipient.
4. See the funding plan and policy checks.
5. Approve the payment when required.
6. Observe the execution and settlement states.
7. Verify the settlement transaction or clearly identify the simulated step.
8. Open a receipt containing the complete decision and execution history.
9. Repeat the workflow through the API or agent interface.

## 9. Non-functional requirements

- Never execute above policy limits.
- Never expose private keys or signing secrets to the client or model.
- Every state transition is authenticated and auditable.
- Idempotency keys prevent duplicate payment execution.
- Stale prices and unavailable liquidity fail closed.
- Provider failures are visible and do not silently mark payments complete.
- The user can distinguish estimates, pending actions, confirmed actions, and simulated actions.
- The system can replace the first execution provider without changing the payment domain.

## 10. Success metrics

### Product

- A new user can understand available spending power and create a payment without learning blockchain mechanics.
- A payment can be completed or safely rejected from one workflow.
- The same account can repeat the workflow without rebuilding configuration.

### Technical

- X Layer integration is deployed and verifiable.
- At least one supported tokenized-stock and stablecoin route is documented.
- API and agent calls enforce the same policies as the web UI.
- Completed payments have reliable transaction and receipt records.

### Business validation

- At least three target businesses or operators can explain a recurring payment job this workflow improves.
- At least one user repeats the payment workflow.
- At least one partner or integration path is credible for continued execution after the demo.

## 11. Known risks and unresolved decisions

- Exact xStock conversion or exit route on X Layer is not yet confirmed.
- Asset eligibility, transfer restrictions, KYC/AML, and regional availability may limit users.
- Tokenized stock liquidity may not be sufficient for every payment size.
- The account/custody model may determine whether Avela can execute directly or must coordinate an external wallet.
- A card is attractive but should not be required to prove the core workflow.
- Credit against the portfolio is a later product option, not a Phase 1 requirement.
- The first recurring business workflow still needs user validation.
- Pricing, provider fees, compliance ownership, and partner economics remain open.

## 12. Audit checklist for Claude Code

- Verify each proposed X Layer integration against current official documentation and available contracts.
- Confirm whether the selected xStock can be read, valued, transferred, swapped, or exited on X Layer.
- Identify the real stablecoin settlement route.
- Identify the wallet/account and signing model required for the demo.
- Mark every requirement that depends on a partner, unavailable API, whitelist, or regional restriction.
- Separate real transactions, mocked data, and simulated execution.
- Estimate what can be demonstrated by the current hackathon deadline.
- Flag any requirement that is too broad for Phase 1.
- Review the document for unclear or interchangeable product language.
