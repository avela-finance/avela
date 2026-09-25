# Spec: Spending Policy

> Broken from [SPEC.md](../ideas/SPEC.md) §2.4, [PRD.md](../ideas/PRD.md) §6.1, §7.2. The rules that govern how spending works.

## Objective

Spending policies define the rules around how an account can spend: daily limits, per-transaction approval thresholds, price floors (don't spend if asset drops below X), minimum balance retention, and funding source priority. Policies are what make Avela a programmable account, not just a payment pipe.

## Scope

**In:**
- Daily spending limit (max USD per rolling 24h)
- Per-transaction approval threshold (auto-approve below, require human sign-off above)
- Price floor per asset (block spending power from that asset if price drops below threshold)
- Minimum balance retention (keep at least N tokens of an asset)
- Funding source priority order (spending power first → stablecoin, or reversed)
- Policy CRUD: create, read, update per account
- Policy evaluation: given a payment intent, check all policies and return pass/fail with reasons
- Default policy applied on account creation

**Out:**
- Recurring payment scheduling (separate from policy)
- Multi-user approval chains (Phase 2+)
- Time-of-day restrictions
- Geo-based restrictions

## Domain Model

```ts
type SpendingPolicy = {
  id: string
  accountId: string
  dailyLimit: number | null           // Max USD per 24h. null = no limit
  approvalThreshold: number | null    // Require approval above this USD amount
  priceFloors: PriceFloor[]
  minimumBalances: MinimumBalance[]
  fundingPriority: FundingSource[]    // Ordered preference
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

type PriceFloor = {
  assetSymbol: string
  floorPrice: number     // USD — don't draw spending power if price below this
}

type MinimumBalance = {
  assetSymbol: string
  minimumAmount: bigint  // Keep at least this much of the asset
}

type FundingSource = 'spending_power' | 'stablecoin_balance'

type PolicyCheckResult = {
  passed: boolean
  requiresApproval: boolean
  violations: PolicyViolation[]
}

type PolicyViolation = {
  rule: string           // 'daily_limit' | 'price_floor' | 'minimum_balance'
  message: string
  currentValue: number
  threshold: number
}

// Default policy for new accounts
const DEFAULT_POLICY = {
  dailyLimit: 500,              // $500/day
  approvalThreshold: 100,       // Approve above $100
  priceFloors: [],              // No price floors initially
  minimumBalances: [],          // No minimum balances initially
  fundingPriority: ['spending_power', 'stablecoin_balance'],
}
```

## Interfaces

### Core Functions (packages/core)

```ts
// Policy CRUD
getPolicy(accountId: string): Promise<SpendingPolicy>
updatePolicy(accountId: string, updates: Partial<SpendingPolicy>): Promise<SpendingPolicy>

// Policy evaluation
evaluatePolicy(params: {
  accountId: string
  amount: number
  assetSymbol?: string  // If funding from specific asset
}): Promise<PolicyCheckResult>

// Daily spending tracking
getDailySpending(accountId: string): Promise<{ total: number; limit: number | null; remaining: number | null }>
recordSpending(accountId: string, amount: number): Promise<void>
```

## Dependencies

- **core-account** — account existence, portfolio positions, current prices
- **Drizzle ORM** — policies table, daily spending tracking

## Project Structure

```
packages/core/src/
├── domain/
│   ├── spending-policy.ts     — Policy entity, evaluation logic
│   ├── policy-defaults.ts     — Default policy configuration
│   └── types.ts               — (extended with policy types)
```

## Success Criteria

1. New accounts get the default policy automatically
2. `evaluatePolicy()` correctly checks daily limit against rolling 24h spending
3. `evaluatePolicy()` returns `requiresApproval: true` when amount exceeds threshold
4. Price floor check: blocks spending power from an asset when price is below floor
5. Minimum balance check: prevents withdrawal/spending that would drop position below minimum
6. Funding priority respected by the Funding Engine
7. Policy updates take effect immediately for the next payment
8. Unit tests for each policy rule in isolation and combined
9. Edge case: payment that would exceed daily limit returns clear violation message

## Open Questions

- Should daily limit reset at midnight UTC or be a rolling 24h window?
- Default approval threshold: $100 reasonable for hackathon demo?
