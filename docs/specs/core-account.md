# Spec: Core Account

> Broken from [SPEC.md](../ideas/SPEC.md) §2.4, [PRD.md](../ideas/PRD.md) §3.3–3.6. Central domain — most features depend on this.

## Objective

The foundational domain model for Avela: accounts, portfolios, positions, asset eligibility, spending power calculation with haircuts, and deposit/withdrawal flows. This is what makes "hold tokenized stocks and see spending power" real.

## Scope

**In:**
- Account entity (owner, wallet address, created date, status)
- Portfolio aggregate (positions across supported assets)
- Position entity (asset, amount deposited, current value, spending power contribution)
- Asset registry (5 MVP assets: wSPYx, wQQQx, wNVDAx, wGOOGLx, wAAPLx with contract addresses, decimals, pool routing)
- Spending power calculation: per-asset haircut → per-asset spending power → aggregated total
- Haircut configuration per asset (starting at 50% for index, tunable for singles)
- Deposit flow: user deposits wrapped xStock → position created → spending power recalculated
- Withdrawal flow: user withdraws wrapped xStock → position reduced → spending power recalculated
- Real-time price feed integration (Uniswap V3 TWAP via pool data, OKX market data as secondary)
- Balance entity (stablecoin balances: USDG, USDC held in account)

**Out:**
- Wrapping/unwrapping raw xStocks (deferred — users deposit already-wrapped tokens for MVP)
- Margin/leverage
- Multi-chain support
- Yield/earn on idle assets

## Domain Model

```ts
type Account = {
  id: string           // ULID
  walletAddress: string // EVM address, from Privy
  username: string | null
  status: 'active' | 'frozen' | 'closed'
  createdAt: Date
  updatedAt: Date
}

type Asset = {
  symbol: string        // wSPYx, wQQQx, wNVDAx, wGOOGLx, wAAPLx
  name: string          // S&P 500, Nasdaq 100, Nvidia
  address: string       // Contract address on X Layer
  decimals: number
  assetType: 'index' | 'single_stock'
  haircut: number       // 0.50 = 50%
  settlementStablecoin: 'USDG' | 'USDC'
  poolAddress: string   // Uniswap V3 pool
  enabled: boolean
}

type Position = {
  id: string            // ULID
  accountId: string
  assetSymbol: string
  amount: bigint        // Raw token amount (wrapped)
  depositTxHash: string
  createdAt: Date
  updatedAt: Date
}

type StablecoinBalance = {
  id: string
  accountId: string
  stablecoin: 'USDG' | 'USDC'
  amount: bigint
  updatedAt: Date
}

type SpendingPower = {
  accountId: string
  perAsset: Array<{
    assetSymbol: string
    positionValue: number   // USD value of position
    haircut: number         // Applied haircut %
    spendingPower: number   // positionValue * (1 - haircut)
  }>
  stablecoinBalance: number  // USDG + USDC in USD
  totalSpendingPower: number // Sum of all per-asset + stablecoins
  calculatedAt: Date
}
```

### MVP Asset Registry (Verified)

| Symbol | Address | Haircut | Settlement | Pool Liquidity |
|--------|---------|---------|------------|----------------|
| wSPYx | `0xe7e553cd128f0011777323a0b44a7b96ea1cb540` | 50% | USDG | $1.89M |
| wQQQx | `0x4c1ae29c159838fc1b224636e28e086eb69101f7` | 50% | USDC | $738K |
| wNVDAx | `0xa8ddb5cd96b5222afe198316e9a57caa642850d5` | 50% | USDG | $623K |
| wGOOGLx | `0xf8c5308f80e459bb53d9ebe689854d9cbb2caa6f` | 50% | USDC | $616K |
| wAAPLx | `0x943bf64d566c32a2bcd41ac92fb63c111cc9de8f` | 50% | USDG | $404K |

### Stablecoins (Verified)

| Symbol | Address |
|--------|---------|
| USDG | `0x4ae46a509f6b1d9056937ba4500cb143933d2dc8` |
| USDC | `0xb6ceceab302e2e4948951ee7843fc24e92933061` |

## Interfaces

### Core Functions (packages/core)

```ts
// Account operations
createAccount(walletAddress: string): Promise<Account>
getAccount(id: string): Promise<Account>
getAccountByWallet(walletAddress: string): Promise<Account | null>

// Portfolio operations
getPortfolio(accountId: string): Promise<Position[]>
recordDeposit(accountId: string, asset: string, amount: bigint, txHash: string): Promise<Position>
recordWithdrawal(accountId: string, positionId: string, amount: bigint): Promise<Position>

// Spending power
calculateSpendingPower(accountId: string): Promise<SpendingPower>
getAssetPrice(assetSymbol: string): Promise<{ price: number; source: string; timestamp: Date }>

// Asset registry
getSupportedAssets(): Asset[]
getAsset(symbol: string): Asset | undefined
isAssetEligible(symbol: string): boolean
```

### Price Feed Adapter

```ts
interface PriceFeedAdapter {
  getPrice(assetAddress: string, chainId: number): Promise<{
    price: number        // USD price
    source: string       // 'uniswap_twap' | 'okx_market'
    confidence: number   // 0-1
    timestamp: Date
  }>
}
```

## Dependencies

- **viem** — X Layer RPC, contract reads (ERC-20 balanceOf, Uniswap pool slot0)
- **Drizzle ORM** — Postgres schema for accounts, positions, balances
- **Zod** — validation for all domain inputs
- **ulidx** — ID generation
- **onchainos CLI** — price verification during development

## Project Structure

```
packages/core/
├── src/
│   ├── domain/
│   │   ├── account.ts         — Account entity + operations
│   │   ├── asset.ts           — Asset registry + eligibility
│   │   ├── position.ts        — Position entity + operations
│   │   ├── spending-power.ts  — Haircut calculation + aggregation
│   │   └── types.ts           — Shared domain types
│   ├── adapters/
│   │   ├── price-feed.ts      — PriceFeedAdapter interface
│   │   ├── uniswap-twap.ts    — Uniswap V3 TWAP implementation
│   │   └── xlayer-rpc.ts      — X Layer RPC client (viem)
│   └── db/
│       ├── schema.ts          — Drizzle schema definitions
│       ├── migrate.ts         — Migration runner
│       └── client.ts          — Database connection
```

## Success Criteria

1. `getSupportedAssets()` returns the 5 MVP assets with correct addresses (verified against SPEC.md)
2. `calculateSpendingPower()` correctly applies per-asset haircut and aggregates
3. Deposit flow: records position, recalculates spending power
4. Price feed returns real data from X Layer (Uniswap pool or OKX market data) — no mocks
5. Spending power updates when price changes (recalculation on demand)
6. Stablecoin balance tracked alongside portfolio positions
7. All types exported and usable by apps/api
8. Unit tests for haircut calculation, spending power aggregation
9. Integration test: deposit → spending power reflects new position

## Open Questions

- Haircut per single stock (wNVDAx): 50% same as index, or higher (60%?) for volatility?
- Should spending power cache with TTL, or always calculate on demand?
- Deposit verification: do we verify the onchain deposit tx, or trust the event?
