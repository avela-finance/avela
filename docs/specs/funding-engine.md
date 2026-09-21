# Spec: Funding Engine

> Broken from [SPEC.md](../ideas/SPEC.md) §2.4, [PRD.md](../ideas/PRD.md) §5.1. The system that turns "Pay with Avela" into a settled payment.

## Objective

The Funding Engine selects the best funding source for a payment under the user's policy, executes the onchain swap via Uniswap V3, and settles stablecoins to the merchant. It is not user-facing — the user taps pay, the engine handles everything from source selection to settlement proof.

## Scope

**In:**
- Payment intent creation (amount, recipient, currency)
- Funding source selection: spending power first → stablecoin balance fallback (configurable by policy)
- Asset selection within spending power: route through deepest pool per asset
- Uniswap V3 swap execution on X Layer (wSPYx→USDG, wQQQx→USDC, wNVDAx→USDG)
- Stablecoin conversion hop when needed (USDG↔USDC via $1.01M pool)
- Slippage protection and transaction simulation
- Payment state machine: `created → policy_check → funding → executing → settling → settled | failed`
- Settlement proof: tx hash, block number, amounts
- Receipt generation with full audit trail

**Out:**
- Fiat/card settlement (Phase 2+)
- Multi-hop routing through 3+ pools
- Partial fills across multiple assets in one payment
- Recurring payment scheduling (separate feature)

## Domain Model

```ts
type PaymentIntent = {
  id: string                    // ULID
  accountId: string
  amount: number                // USD value
  recipientAddress: string      // Merchant/recipient wallet
  recipientUsername: string | null
  settlementCurrency: 'USDG' | 'USDC'
  status: PaymentStatus
  fundingDecision: FundingDecision | null
  settlement: Settlement | null
  createdAt: Date
  updatedAt: Date
}

type PaymentStatus =
  | 'created'
  | 'policy_check'
  | 'awaiting_approval'
  | 'funding'
  | 'executing'
  | 'settling'
  | 'settled'
  | 'failed'
  | 'rejected'

type FundingDecision = {
  source: 'spending_power' | 'stablecoin_balance'
  asset: string | null          // e.g. 'wSPYx' if from spending power
  amountIn: bigint              // Token amount to swap
  amountOutMin: bigint          // Min stablecoin after slippage
  pool: string                  // Pool address for swap
  stablecoin: 'USDG' | 'USDC'  // Direct settlement stablecoin
  conversionHop: boolean        // Needs USDG↔USDC conversion?
  estimatedSlippage: number
  decidedAt: Date
}

type Settlement = {
  txHash: string
  blockNumber: number
  amountSettled: bigint
  stablecoin: 'USDG' | 'USDC'
  gasUsed: bigint
  settledAt: Date
}

type Receipt = {
  paymentId: string
  accountId: string
  amount: number
  sourceAsset: string
  fundingSource: string
  settlementTxHash: string
  settlementStablecoin: string
  recipientAddress: string
  timestamp: Date
}
```

### Per-Asset Routing (Verified)

| Asset | → Stablecoin | Pool Liquidity | Route |
|-------|-------------|----------------|-------|
| wSPYx | USDG | $1.89M | wSPYx → USDG (direct) |
| wQQQx | USDC | $738K | wQQQx → USDC (direct) |
| wNVDAx | USDG | $623K | wNVDAx → USDG (direct) |

If merchant needs the other stablecoin: USDG↔USDC conversion via $1.01M pool.

## Interfaces

### Core Functions (packages/core)

```ts
// Payment intent lifecycle
createPaymentIntent(params: {
  accountId: string
  amount: number
  recipientAddress: string
  recipientUsername?: string
}): Promise<PaymentIntent>

// Funding decision
selectFundingSource(intent: PaymentIntent): Promise<FundingDecision>

// Execution
executePayment(intentId: string): Promise<Settlement>

// Query
getPaymentStatus(intentId: string): Promise<PaymentIntent>
getReceipt(intentId: string): Promise<Receipt>
getPaymentHistory(accountId: string, limit?: number): Promise<PaymentIntent[]>
```

### Swap Adapter

```ts
interface SwapAdapter {
  quote(params: {
    tokenIn: string
    tokenOut: string
    amountIn: bigint
    chainId: number
  }): Promise<{
    amountOut: bigint
    priceImpact: number
    route: string[]
  }>

  execute(params: {
    tokenIn: string
    tokenOut: string
    amountIn: bigint
    amountOutMin: bigint
    recipient: string
    chainId: number
  }): Promise<{
    txHash: string
    blockNumber: number
    amountOut: bigint
    gasUsed: bigint
  }>
}
```

## Dependencies

- **core-account** — spending power calculation, position data, stablecoin balances
- **spending-policy** — policy checks before funding (daily limits, approval thresholds)
- **viem** — transaction construction and signing for Uniswap V3 swaps
- **Uniswap V3 SDK** or direct contract calls — swap execution on X Layer

## Project Structure

```
packages/core/src/
├── domain/
│   ├── payment-intent.ts      — PaymentIntent entity + state machine
│   ├── funding-engine.ts      — Source selection logic
│   ├── settlement.ts          — Settlement + receipt generation
│   └── types.ts               — (extended with payment types)
├── adapters/
│   ├── swap.ts                — SwapAdapter interface
│   └── uniswap-v3.ts          — Uniswap V3 swap implementation on X Layer
```

## Success Criteria

1. Payment intent state machine transitions correctly through all states
2. Funding source selection: prefers spending power over stablecoin balance
3. Asset selection: picks the asset with the deepest pool that covers the amount
4. Slippage protection: transaction reverts if slippage exceeds threshold (1% default)
5. Settlement proof: every settled payment has tx hash and block number
6. Receipt contains: source asset, funding decision, settlement tx, amounts, timestamps
7. Payment fails gracefully when spending power is insufficient — no silent conversion
8. USDG↔USDC conversion hop works when merchant needs different stablecoin
9. Unit tests for state machine transitions, funding source selection
10. Integration test: create intent → fund → execute → verify settlement onchain

## Open Questions

- Uniswap V3 interaction: use SDK (`@uniswap/v3-sdk`) or direct router contract calls via viem?
- Gas sponsorship: who pays gas for the swap tx? User's embedded wallet, or Avela relayer?
- Slippage default: 1% for xStock pools, or higher given liquidity depth?
