# Spec: Funding Engine

> Broken from [SPEC.md](../ideas/SPEC.md) §2.3–2.4, [PRD.md](../ideas/PRD.md) §5.1. The system that turns "Pay with Avela" into a settled payment.

## Objective

The Funding Engine verifies that the user's locked collateral in AvelaVault backs the requested payment, then settles from the pre-funded stablecoin reserve via AvelaPaymentRouter. It is not user-facing — the user taps pay, the engine handles everything from collateral verification to settlement proof. No Uniswap swaps occur per payment — positions stay locked and intact.

## Scope

**In:**
- Payment intent creation (amount, recipient, currency)
- Spending power verification: TWAP pricing + haircut, already built in core-account
- Collateral verification: view call to AvelaVault.getLockedBalance() confirms user's position backs the payment
- Policy check delegation to spending-policy (daily limits, approval thresholds)
- Settlement execution: call AvelaPaymentRouter.executePayment() from backend signer
- Payment state machine: `created → policy_check → awaiting_approval → collateral_verify → settling → settled | failed | rejected`
- Receipt generation with paymentId linking AvelaVault (PositionLocked) and AvelaPaymentRouter (PaymentExecuted) events
- Per-asset stablecoin routing: each asset maps to USDG or USDC by pool depth

**Out:**
- Uniswap V3 swap execution (not needed — reserve model)
- Fiat/card settlement (Phase 2+)
- Reserve replenishment logic (manual for MVP)
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
  | 'collateral_verify'
  | 'settling'
  | 'settled'
  | 'failed'
  | 'rejected'

type FundingDecision = {
  source: 'spending_power' | 'stablecoin_balance'
  collateralAsset: string | null      // e.g. 'wSPYx' — the asset backing this payment
  collateralVerified: boolean         // AvelaVault.getLockedBalance() confirmed
  collateralAmount: bigint | null     // User's locked balance at verification time
  settlementToken: 'USDG' | 'USDC'   // Stablecoin used for merchant payout
  paymentId: string                   // bytes32 hex — shared across vault + router events
  spendingPowerAtDecision: number     // Total spending power when decision was made
  decidedAt: Date
}

type Settlement = {
  paymentId: string             // Same bytes32 as FundingDecision
  txHash: string                // AvelaPaymentRouter.executePayment() tx
  blockNumber: number
  amountSettled: bigint         // Stablecoin amount paid to merchant
  settlementToken: 'USDG' | 'USDC'
  gasUsed: bigint
  settledAt: Date
}

type Receipt = {
  paymentId: string             // Links vault collateral check to router settlement
  accountId: string
  amount: number                // USD value
  collateralAsset: string       // Which xStock backed this payment
  settlementToken: string       // USDG or USDC
  settlementTxHash: string      // Router tx hash — verifiable on explorer
  recipientAddress: string
  timestamp: Date
}
```

### Per-Asset Settlement Routing (Verified)

| Asset | → Stablecoin | Pool Liquidity | Collateral Verified Via |
|-------|-------------|----------------|------------------------|
| wSPYx | USDG | $1.89M | AvelaVault.getLockedBalance() |
| wQQQx | USDC | $738K | AvelaVault.getLockedBalance() |
| wNVDAx | USDG | $623K | AvelaVault.getLockedBalance() |
| wGOOGLx | USDC | $616K | AvelaVault.getLockedBalance() |
| wAAPLx | USDG | $404K | AvelaVault.getLockedBalance() |

Pool liquidity is relevant for TWAP pricing accuracy, not for per-payment execution.

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

// Funding decision — verifies spending power and collateral
selectFundingSource(intent: PaymentIntent): Promise<FundingDecision>

// Collateral verification — view call to AvelaVault
verifyCollateral(accountId: string, asset: string): Promise<{
  locked: bigint
  sufficient: boolean
}>

// Settlement execution — calls AvelaPaymentRouter.executePayment()
executeSettlement(intentId: string): Promise<Settlement>

// Query
getPaymentStatus(intentId: string): Promise<PaymentIntent>
getReceipt(intentId: string): Promise<Receipt>
getPaymentHistory(accountId: string, limit?: number): Promise<PaymentIntent[]>
```

### Vault Adapter

```ts
interface VaultAdapter {
  getLockedBalance(depositor: string, token: string): Promise<bigint>
}
```

### Router Adapter

```ts
interface RouterAdapter {
  executePayment(params: {
    token: string           // Settlement stablecoin address (USDG or USDC)
    merchant: string        // Recipient address
    amount: bigint          // Settlement amount
    paymentId: string       // bytes32 hex — links to vault collateral
    collateralOwner: string // User whose locked position backs this
  }): Promise<{
    txHash: string
    blockNumber: number
    gasUsed: bigint
  }>

  isPaymentExecuted(paymentId: string): Promise<boolean>
}
```

## Dependencies

- **core-account** — spending power calculation (TWAP pricing + haircut), position data, stablecoin balances
- **contracts** — AvelaVault (collateral verification), AvelaPaymentRouter (settlement execution)
- **spending-policy** — policy checks before funding (daily limits, approval thresholds)
- **viem** — contract reads (AvelaVault.getLockedBalance) and writes (AvelaPaymentRouter.executePayment)

## Project Structure

```
packages/core/src/
├── domain/
│   ├── payment-intent.ts      — PaymentIntent entity + state machine
│   ├── funding-engine.ts      — Source selection + collateral verification logic
│   ├── settlement.ts          — Settlement execution + receipt generation
│   └── types.ts               — (extended with payment types)
├── adapters/
│   ├── vault-adapter.ts       — VaultAdapter interface + AvelaVault implementation
│   └── router-adapter.ts      — RouterAdapter interface + AvelaPaymentRouter implementation
```

## Success Criteria

1. Payment intent state machine transitions correctly through all states
2. Funding source selection: prefers spending power over stablecoin balance
3. Collateral verification: view call to AvelaVault confirms locked balance
4. Settlement: AvelaPaymentRouter.executePayment() called with correct paymentId
5. Replay protection: paymentId cannot be reused (enforced by router contract)
6. Receipt contains: collateral asset, paymentId, settlement tx hash, amounts, timestamps
7. Payment fails gracefully when spending power is insufficient — no silent conversion
8. Per-asset stablecoin routing: wSPYx/wNVDAx/wAAPLx → USDG, wQQQx/wGOOGLx → USDC
9. Unit tests for state machine transitions, funding source selection, collateral verification
10. Integration test: create intent → verify collateral → settle → receipt with onchain proof

## Resolved Questions

- **Reserve monitoring:** Backend pre-checks AvelaPaymentRouter's reserve balance before attempting settlement. Fail fast with a clear error rather than wasting gas on a revert.
- **Gas sponsorship:** Backend operator wallet pays gas for executePayment transactions. No relay/meta-tx for MVP.
- **paymentId generation:** keccak256 of the ULID (converted to bytes32). Deterministic, collision-resistant, fits the bytes32 slot on-chain.
