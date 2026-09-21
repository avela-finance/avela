# Spec: Checkout

> Broken from [SPEC.md](../ideas/SPEC.md) §2.4 (Checkout), [PRD.md](../ideas/PRD.md) §5. The "Pay with Avela" button at a demo merchant.

## Objective

A demo merchant storefront that showcases "Pay with Avela" at checkout. A product page → cart → checkout → pay → receipt flow. This is what the judge sees as the end-user commerce experience. The merchant is fake but the payment is real — onchain settlement with proof.

**"Build a Market" angle:** Every checkout triggers a real Uniswap V3 swap on X Layer. Each payment is a market order — Avela is a demand-side market driver for xStock pools. The demo should surface this: show the swap transaction, the pool used, the volume generated. This is what OKX Dev Day judges care about — every "Pay with Avela" builds a market.

## Scope

**In:**
- Demo merchant storefront: 2-3 products with prices
- Product page → Add to cart → Checkout
- "Pay with Avela" button at checkout (alternative to traditional pay)
- Payment preview: amount, funding source, estimated settlement
- Payment execution via Funding Engine (real onchain swap)
- Receipt page: source asset, settlement stablecoin, tx hash, block explorer link
- Merchant receives stablecoins at a designated wallet address

**Out:**
- Real merchant onboarding
- Multiple payment methods at checkout (only "Pay with Avela")
- Cart persistence, user accounts on the merchant side
- Inventory management
- Checkout SDK / embeddable widget (Phase 4)

## Domain Model

```ts
// Demo merchant products
type DemoProduct = {
  id: string
  name: string
  description: string
  price: number           // USD
  image: string
}

// Checkout session
type CheckoutSession = {
  id: string
  products: Array<{ productId: string; quantity: number }>
  totalAmount: number     // USD
  merchantAddress: string // Where stablecoins settle
  paymentIntentId: string | null
  status: 'pending' | 'paying' | 'settled' | 'failed'
  createdAt: Date
}

// Demo products for OKX Dev Day
const DEMO_PRODUCTS: DemoProduct[] = [
  { id: '1', name: 'API Credits', description: '1000 API calls', price: 10, image: '/products/api.png' },
  { id: '2', name: 'Cloud Compute', description: '1 hour GPU', price: 25, image: '/products/gpu.png' },
  { id: '3', name: 'Data Feed', description: '30-day market data', price: 50, image: '/products/data.png' },
]
```

## Interfaces

### Pages (apps/web or separate route)

```
/checkout                    — Demo merchant storefront (product grid)
/checkout/cart               — Cart with total
/checkout/pay                — "Pay with Avela" + payment preview
/checkout/receipt/:paymentId — Settlement receipt with onchain proof
```

### Flow

```
1. User browses demo merchant → selects product
2. Cart shows total: "$25.00"
3. Click "Pay with Avela"
4. Connect wallet (if not connected) via Privy
5. Payment preview:
   - Amount: $25.00
   - Funding: wSPYx (spending power)
   - Settlement: USDG → merchant wallet
   - Estimated gas: ~$0.01
6. Confirm payment
7. Funding Engine executes (wSPYx → USDG swap on Uniswap V3)
8. Receipt:
   - Paid: $25.00
   - Source: 0.045 wSPYx
   - Settlement: 25.00 USDG
   - Tx: 0xabcd... [View on Explorer]
   - Merchant: 0x1234...5678
```

## Dependencies

- **funding-engine** — payment intent creation, execution, receipt
- **core-account** — spending power check, portfolio data
- **spending-policy** — policy evaluation before payment
- **apps/web** — hosted within the web app or as separate routes

## Project Structure

```
apps/web/src/app/
├── checkout/
│   ├── page.tsx               — Demo merchant storefront
│   ├── cart/
│   │   └── page.tsx           — Cart view
│   ├── pay/
│   │   └── page.tsx           — Payment preview + confirm
│   └── receipt/
│       └── [paymentId]/
│           └── page.tsx       — Settlement receipt
```

## Success Criteria

1. Demo storefront shows 2-3 products with prices
2. "Pay with Avela" button triggers wallet connection if needed
3. Payment preview shows: amount, source asset, settlement currency, estimated gas
4. Payment executes onchain — real Uniswap V3 swap
5. Receipt shows tx hash with link to X Layer explorer
6. Merchant wallet receives stablecoins
7. Total flow under 30 seconds (excluding user confirmation time)
8. Works on mobile viewport (PWA)
9. Clear error state when spending power is insufficient

## Open Questions

- Demo merchant branding: generic "Demo Store" or themed to OKX Dev Day context?
- Merchant wallet: hardcoded demo address or configurable?
- Should checkout be a separate app/route or integrated into the main web dashboard?
