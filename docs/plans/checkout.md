# Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a demo merchant storefront with "Pay with Avela" button that triggers real Uniswap V3 swaps on X Layer and shows onchain settlement receipts. Every payment is a market order — this is the OKX Dev Day "Build a Market" demo.

**Architecture:** Frontend pages in `apps/web/src/app/checkout/`. Cart state held in URL params (no server state for demo). Payment execution calls the API which routes through the Funding Engine. Receipt page surfaces the Uniswap V3 swap tx, pool used, and volume generated.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS v4, shadcn/ui, Privy React Auth, Hono API

## Global Constraints

- Biome: tabs, double quotes, semicolons, trailing commas
- Next.js App Router with Server Components where possible; client components for interactive parts
- Privy for wallet connection (`@privy-io/react-auth`)
- All API calls go through `apps/web/src/lib/api.ts` fetch wrapper
- Mobile-first responsive (375px–1440px)
- No mocks — payment execution hits real X Layer contracts

---

### Task 1: Demo Product Data

**Files:**
- Create: `apps/web/src/lib/demo-products.ts`
- Test: `apps/web/src/lib/__tests__/demo-products.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `DEMO_PRODUCTS: DemoProduct[]`, `DemoProduct` type, `getProduct(id): DemoProduct | undefined`

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/lib/__tests__/demo-products.test.ts
import { describe, it, expect } from "vitest";
import { DEMO_PRODUCTS, getProduct } from "../demo-products.js";
import type { DemoProduct } from "../demo-products.js";

describe("demo products", () => {
	it("has exactly 3 products", () => {
		expect(DEMO_PRODUCTS).toHaveLength(3);
	});

	it("each product has required fields", () => {
		for (const product of DEMO_PRODUCTS) {
			expect(product.id).toBeTruthy();
			expect(product.name).toBeTruthy();
			expect(product.description).toBeTruthy();
			expect(product.price).toBeGreaterThan(0);
			expect(product.image).toBeTruthy();
		}
	});

	it("products have correct prices", () => {
		const prices = DEMO_PRODUCTS.map((p) => p.price).sort((a, b) => a - b);
		expect(prices).toEqual([10, 25, 50]);
	});

	it("getProduct returns product by id", () => {
		const product = getProduct("1");
		expect(product).toBeDefined();
		expect(product!.name).toBe("API Credits");
	});

	it("getProduct returns undefined for unknown id", () => {
		expect(getProduct("999")).toBeUndefined();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- apps/web/src/lib/__tests__/demo-products.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement demo products**

```ts
// apps/web/src/lib/demo-products.ts
export type DemoProduct = {
	id: string;
	name: string;
	description: string;
	price: number;
	image: string;
};

export const DEMO_PRODUCTS: DemoProduct[] = [
	{
		id: "1",
		name: "API Credits",
		description: "1,000 API calls for your application",
		price: 10,
		image: "/products/api-credits.svg",
	},
	{
		id: "2",
		name: "Cloud Compute",
		description: "1 hour of GPU compute time",
		price: 25,
		image: "/products/cloud-compute.svg",
	},
	{
		id: "3",
		name: "Data Feed",
		description: "30-day real-time market data subscription",
		price: 50,
		image: "/products/data-feed.svg",
	},
];

export function getProduct(id: string): DemoProduct | undefined {
	return DEMO_PRODUCTS.find((p) => p.id === id);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- apps/web/src/lib/__tests__/demo-products.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/demo-products.ts apps/web/src/lib/__tests__/demo-products.test.ts
git commit -m "feat(web): add demo merchant product data"
```

---

### Task 2: Checkout Storefront Page

**Files:**
- Create: `apps/web/src/app/checkout/page.tsx`
- Create: `apps/web/src/app/checkout/layout.tsx`
- Create: `apps/web/src/components/checkout/product-card.tsx`

**Interfaces:**
- Consumes: `DEMO_PRODUCTS` from `lib/demo-products`
- Produces: `/checkout` page rendering product grid, links to `/checkout/pay?products=1,2`

- [ ] **Step 1: Create the checkout layout**

```tsx
// apps/web/src/app/checkout/layout.tsx
import type { ReactNode } from "react";

export const metadata = {
	title: "Demo Store — Avela Checkout",
	description: "Demo merchant storefront for Pay with Avela",
};

export default function CheckoutLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-background">
			<header className="border-b border-border px-4 py-3">
				<div className="mx-auto flex max-w-4xl items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-muted-foreground">Demo Store</span>
						<span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
							Powered by Avela
						</span>
					</div>
				</div>
			</header>
			<main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
		</div>
	);
}
```

- [ ] **Step 2: Create the product card component**

```tsx
// apps/web/src/components/checkout/product-card.tsx
"use client";

import type { DemoProduct } from "@/lib/demo-products";

export function ProductCard({
	product,
	onAdd,
}: {
	product: DemoProduct;
	onAdd: (productId: string) => void;
}) {
	return (
		<div className="flex flex-col rounded-xl border border-border bg-card p-6">
			<div className="mb-4 flex h-24 items-center justify-center rounded-lg bg-muted">
				<span className="text-3xl">
					{product.id === "1" ? "⚡" : product.id === "2" ? "🖥️" : "📊"}
				</span>
			</div>
			<h3 className="text-lg font-semibold">{product.name}</h3>
			<p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
			<div className="mt-4 flex items-center justify-between">
				<span className="text-xl font-bold">${product.price}</span>
				<button
					type="button"
					onClick={() => onAdd(product.id)}
					className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Add to Cart
				</button>
			</div>
		</div>
	);
}
```

- [ ] **Step 3: Create the storefront page**

```tsx
// apps/web/src/app/checkout/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEMO_PRODUCTS } from "@/lib/demo-products";
import { ProductCard } from "@/components/checkout/product-card";

export default function CheckoutPage() {
	const router = useRouter();
	const [cart, setCart] = useState<string[]>([]);

	function addToCart(productId: string) {
		setCart((prev) => [...prev, productId]);
	}

	const total = cart.reduce((sum, id) => {
		const product = DEMO_PRODUCTS.find((p) => p.id === id);
		return sum + (product?.price ?? 0);
	}, 0);

	return (
		<div>
			<h1 className="mb-2 text-2xl font-bold">Demo Store</h1>
			<p className="mb-8 text-muted-foreground">
				Choose a product and pay with your tokenized stock portfolio.
			</p>

			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{DEMO_PRODUCTS.map((product) => (
					<ProductCard key={product.id} product={product} onAdd={addToCart} />
				))}
			</div>

			{cart.length > 0 && (
				<div className="mt-8 flex items-center justify-between rounded-xl border border-border bg-card p-4">
					<div>
						<span className="text-sm text-muted-foreground">
							{cart.length} item{cart.length > 1 ? "s" : ""}
						</span>
						<span className="ml-4 text-lg font-bold">${total}</span>
					</div>
					<button
						type="button"
						onClick={() => router.push(`/checkout/pay?products=${cart.join(",")}`)}
						className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					>
						Proceed to Pay
					</button>
				</div>
			)}
		</div>
	);
}
```

- [ ] **Step 4: Verify the page renders**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run dev:web`
Visit: `http://localhost:3000/checkout`
Expected: 3 product cards, add-to-cart works, cart total updates, "Proceed to Pay" navigates

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/checkout/layout.tsx apps/web/src/app/checkout/page.tsx apps/web/src/components/checkout/product-card.tsx
git commit -m "feat(web): add checkout storefront with product grid"
```

---

### Task 3: Payment Page with "Pay with Avela"

**Files:**
- Create: `apps/web/src/app/checkout/pay/page.tsx`
- Create: `apps/web/src/components/checkout/payment-preview.tsx`

**Interfaces:**
- Consumes: `getProduct()`, URL params `?products=1,2`, API `POST /payments/intent`, Privy wallet
- Produces: `/checkout/pay` page showing payment preview and "Pay with Avela" button, redirects to receipt on success

- [ ] **Step 1: Create payment preview component**

```tsx
// apps/web/src/components/checkout/payment-preview.tsx
"use client";

export type PaymentPreviewData = {
	amount: number;
	fundingAsset: string;
	settlementCurrency: string;
	estimatedGas: string;
	recipientAddress: string;
};

export function PaymentPreview({ data }: { data: PaymentPreviewData }) {
	return (
		<div className="rounded-xl border border-border bg-card p-6">
			<h3 className="mb-4 text-sm font-medium text-muted-foreground">Payment Preview</h3>
			<div className="space-y-3">
				<div className="flex justify-between">
					<span className="text-muted-foreground">Amount</span>
					<span className="font-semibold">${data.amount.toFixed(2)}</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Funding source</span>
					<span className="font-medium">{data.fundingAsset} (spending power)</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Settlement</span>
					<span className="font-medium">{data.settlementCurrency}</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Estimated gas</span>
					<span className="text-sm text-muted-foreground">{data.estimatedGas}</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Merchant</span>
					<span className="font-mono text-sm">
						{data.recipientAddress.slice(0, 6)}...{data.recipientAddress.slice(-4)}
					</span>
				</div>
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Create the pay page**

```tsx
// apps/web/src/app/checkout/pay/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { DEMO_PRODUCTS, getProduct } from "@/lib/demo-products";
import { PaymentPreview } from "@/components/checkout/payment-preview";
import type { PaymentPreviewData } from "@/components/checkout/payment-preview";

const DEMO_MERCHANT_ADDRESS = "0x000000000000000000000000000000000000dEaD";

export default function PayPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [status, setStatus] = useState<"idle" | "confirming" | "executing" | "error">("idle");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const productIds = searchParams.get("products")?.split(",") ?? [];
	const products = productIds.map(getProduct).filter(Boolean);
	const totalAmount = products.reduce((sum, p) => sum + (p?.price ?? 0), 0);

	const previewData: PaymentPreviewData = useMemo(
		() => ({
			amount: totalAmount,
			fundingAsset: "wSPYx",
			settlementCurrency: "USDG",
			estimatedGas: "~$0.01",
			recipientAddress: DEMO_MERCHANT_ADDRESS,
		}),
		[totalAmount],
	);

	async function handlePay() {
		setStatus("confirming");
		try {
			setStatus("executing");
			const response = await fetch("/api/payments/intent", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amount: totalAmount,
					recipientAddress: DEMO_MERCHANT_ADDRESS,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error?.message ?? "Payment failed");
			}

			const { data } = await response.json();
			router.push(`/checkout/receipt/${data.id}`);
		} catch (err) {
			setStatus("error");
			setErrorMessage(err instanceof Error ? err.message : "Payment failed");
		}
	}

	if (products.length === 0) {
		return (
			<div className="py-12 text-center">
				<p className="text-muted-foreground">No products selected.</p>
				<a href="/checkout" className="mt-4 inline-block text-primary hover:underline">
					Back to store
				</a>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-md">
			<h1 className="mb-6 text-2xl font-bold">Pay with Avela</h1>

			<div className="mb-6 space-y-2">
				{products.map((p) => (
					<div key={p!.id} className="flex justify-between text-sm">
						<span>{p!.name}</span>
						<span className="font-medium">${p!.price}</span>
					</div>
				))}
				<div className="border-t border-border pt-2">
					<div className="flex justify-between font-semibold">
						<span>Total</span>
						<span>${totalAmount}</span>
					</div>
				</div>
			</div>

			<PaymentPreview data={previewData} />

			<div className="mt-6">
				{status === "error" && (
					<div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
						{errorMessage}
					</div>
				)}

				<button
					type="button"
					onClick={handlePay}
					disabled={status === "confirming" || status === "executing"}
					className="w-full rounded-xl bg-primary py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
				>
					{status === "idle" && "Pay with Avela"}
					{status === "confirming" && "Confirming..."}
					{status === "executing" && "Executing payment..."}
					{status === "error" && "Try Again"}
				</button>

				<p className="mt-3 text-center text-xs text-muted-foreground">
					Your stock positions stay in the market. The merchant receives stablecoins.
				</p>
			</div>
		</div>
	);
}
```

- [ ] **Step 3: Verify the page renders**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run dev:web`
Visit: `http://localhost:3000/checkout/pay?products=1,2`
Expected: Shows 2 products, total $35, payment preview, "Pay with Avela" button

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/checkout/pay/page.tsx apps/web/src/components/checkout/payment-preview.tsx
git commit -m "feat(web): add payment page with Pay with Avela button"
```

---

### Task 4: Receipt Page with "Build a Market" Surface

**Files:**
- Create: `apps/web/src/app/checkout/receipt/[paymentId]/page.tsx`
- Create: `apps/web/src/components/checkout/settlement-proof.tsx`

**Interfaces:**
- Consumes: API `GET /payments/:id` returning `PaymentIntent` with `Settlement`, URL param `paymentId`
- Produces: `/checkout/receipt/[paymentId]` page showing receipt with onchain proof and swap details

- [ ] **Step 1: Create settlement proof component**

The "Build a Market" angle: every payment generates real Uniswap V3 swap volume. The receipt surfaces this.

```tsx
// apps/web/src/components/checkout/settlement-proof.tsx
"use client";

const XLAYER_EXPLORER = "https://www.okx.com/web3/explorer/xlayer/tx";

export type SettlementProofData = {
	paymentId: string;
	amount: number;
	sourceAsset: string;
	sourceAmount: string;
	settlementCurrency: string;
	txHash: string;
	blockNumber: number;
	poolUsed: string;
	recipientAddress: string;
	timestamp: string;
};

export function SettlementProof({ data }: { data: SettlementProofData }) {
	const explorerUrl = `${XLAYER_EXPLORER}/${data.txHash}`;

	return (
		<div className="space-y-6">
			<div className="rounded-xl border border-border bg-card p-6">
				<div className="mb-4 flex items-center gap-2">
					<span className="text-2xl">✅</span>
					<h2 className="text-xl font-bold">Payment Settled</h2>
				</div>

				<div className="space-y-3">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Amount</span>
						<span className="font-semibold">${data.amount.toFixed(2)}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Source</span>
						<span className="font-medium">
							{data.sourceAmount} {data.sourceAsset}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Settlement</span>
						<span className="font-medium">{data.settlementCurrency}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Merchant</span>
						<span className="font-mono text-sm">
							{data.recipientAddress.slice(0, 6)}...{data.recipientAddress.slice(-4)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Time</span>
						<span className="text-sm">{new Date(data.timestamp).toLocaleString()}</span>
					</div>
				</div>
			</div>

			{/* Build a Market: Uniswap V3 swap proof */}
			<div className="rounded-xl border border-border bg-card p-6">
				<h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
					Onchain Proof — Market Order
				</h3>
				<p className="mb-4 text-sm text-muted-foreground">
					This payment generated a real Uniswap V3 swap on X Layer. Every &ldquo;Pay with
					Avela&rdquo; builds market volume for tokenized stock pools.
				</p>
				<div className="space-y-3">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Swap</span>
						<span className="font-mono text-sm">
							{data.sourceAsset} → {data.settlementCurrency}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Pool</span>
						<span className="font-mono text-sm">
							{data.poolUsed.slice(0, 6)}...{data.poolUsed.slice(-4)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Block</span>
						<span className="font-mono text-sm">{data.blockNumber}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Transaction</span>
						<a
							href={explorerUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="font-mono text-sm text-primary hover:underline"
						>
							{data.txHash.slice(0, 10)}...{data.txHash.slice(-8)} ↗
						</a>
					</div>
				</div>
			</div>

			<div className="flex gap-3">
				<a
					href={explorerUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="flex-1 rounded-lg border border-border py-2 text-center text-sm font-medium hover:bg-muted"
				>
					View on Explorer
				</a>
				<a
					href="/checkout"
					className="flex-1 rounded-lg bg-primary py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Back to Store
				</a>
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Create the receipt page**

```tsx
// apps/web/src/app/checkout/receipt/[paymentId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SettlementProof } from "@/components/checkout/settlement-proof";
import type { SettlementProofData } from "@/components/checkout/settlement-proof";

export default function ReceiptPage() {
	const params = useParams<{ paymentId: string }>();
	const [data, setData] = useState<SettlementProofData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchReceipt() {
			try {
				const response = await fetch(`/api/payments/${params.paymentId}`);
				if (!response.ok) {
					throw new Error("Payment not found");
				}
				const { data: payment } = await response.json();
				setData({
					paymentId: payment.id,
					amount: payment.amount,
					sourceAsset: payment.fundingDecision?.asset ?? "Unknown",
					sourceAmount: payment.fundingDecision?.amountIn ?? "0",
					settlementCurrency: payment.fundingDecision?.stablecoin ?? "USDG",
					txHash: payment.settlement?.txHash ?? "",
					blockNumber: payment.settlement?.blockNumber ?? 0,
					poolUsed: payment.fundingDecision?.pool ?? "",
					recipientAddress: payment.recipientAddress,
					timestamp: payment.settlement?.settledAt ?? payment.createdAt,
				});
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load receipt");
			} finally {
				setLoading(false);
			}
		}
		fetchReceipt();
	}, [params.paymentId]);

	if (loading) {
		return (
			<div className="mx-auto max-w-md py-12 text-center">
				<p className="text-muted-foreground">Loading receipt...</p>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="mx-auto max-w-md py-12 text-center">
				<p className="text-destructive">{error ?? "Receipt not found"}</p>
				<a href="/checkout" className="mt-4 inline-block text-primary hover:underline">
					Back to store
				</a>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-md">
			<SettlementProof data={data} />
		</div>
	);
}
```

- [ ] **Step 3: Verify the page renders**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run dev:web`
Visit: `http://localhost:3000/checkout/receipt/01JTEST` (will show loading then error — no API yet)
Expected: Loading state renders, error state renders with back link

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/checkout/receipt/ apps/web/src/components/checkout/settlement-proof.tsx
git commit -m "feat(web): add receipt page with Build a Market swap proof"
```

---

### Task 5: Product Placeholder Images

**Files:**
- Create: `apps/web/public/products/api-credits.svg`
- Create: `apps/web/public/products/cloud-compute.svg`
- Create: `apps/web/public/products/data-feed.svg`

**Interfaces:**
- Consumes: nothing
- Produces: SVG placeholder images referenced by `DemoProduct.image`

- [ ] **Step 1: Create simple SVG placeholders**

```svg
<!-- apps/web/public/products/api-credits.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <rect width="120" height="120" rx="16" fill="#1a1a2e"/>
  <path d="M60 30L38 90h10l4-12h16l4 12h10L60 30zm-4 38l8-24 8 24H56z" fill="#e0e0e0"/>
</svg>
```

```svg
<!-- apps/web/public/products/cloud-compute.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <rect width="120" height="120" rx="16" fill="#1a1a2e"/>
  <rect x="30" y="40" width="60" height="40" rx="4" fill="#e0e0e0"/>
  <rect x="36" y="46" width="48" height="28" rx="2" fill="#1a1a2e"/>
  <circle cx="60" cy="60" r="8" fill="#4ade80"/>
</svg>
```

```svg
<!-- apps/web/public/products/data-feed.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <rect width="120" height="120" rx="16" fill="#1a1a2e"/>
  <polyline points="30,80 45,55 60,65 75,40 90,50" stroke="#4ade80" stroke-width="3" fill="none"/>
  <circle cx="30" cy="80" r="3" fill="#e0e0e0"/>
  <circle cx="45" cy="55" r="3" fill="#e0e0e0"/>
  <circle cx="60" cy="65" r="3" fill="#e0e0e0"/>
  <circle cx="75" cy="40" r="3" fill="#e0e0e0"/>
  <circle cx="90" cy="50" r="3" fill="#e0e0e0"/>
</svg>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/public/products/
git commit -m "feat(web): add demo product placeholder images"
```

---

### Task 6: End-to-End Checkout Smoke Test

**Files:**
- Create: `apps/web/src/app/checkout/__tests__/checkout.test.ts`

**Interfaces:**
- Consumes: `DEMO_PRODUCTS`, `getProduct()`
- Produces: Smoke test validating product data, cart total calculation, and URL generation

- [ ] **Step 1: Write the test**

```ts
// apps/web/src/app/checkout/__tests__/checkout.test.ts
import { describe, it, expect } from "vitest";
import { DEMO_PRODUCTS, getProduct } from "@/lib/demo-products";

describe("checkout flow data", () => {
	it("calculates cart total correctly for multiple products", () => {
		const cart = ["1", "2", "3"];
		const total = cart.reduce((sum, id) => {
			const product = getProduct(id);
			return sum + (product?.price ?? 0);
		}, 0);
		expect(total).toBe(85);
	});

	it("handles empty cart", () => {
		const cart: string[] = [];
		const total = cart.reduce((sum, id) => {
			const product = getProduct(id);
			return sum + (product?.price ?? 0);
		}, 0);
		expect(total).toBe(0);
	});

	it("generates correct URL params for cart", () => {
		const cart = ["1", "3"];
		const params = cart.join(",");
		expect(params).toBe("1,3");
	});

	it("parses URL params back to products", () => {
		const params = "1,2";
		const ids = params.split(",");
		const products = ids.map(getProduct).filter(Boolean);
		expect(products).toHaveLength(2);
		expect(products[0]!.name).toBe("API Credits");
		expect(products[1]!.name).toBe("Cloud Compute");
	});
});
```

- [ ] **Step 2: Run test**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- apps/web/src/app/checkout/__tests__/checkout.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/checkout/__tests__/checkout.test.ts
git commit -m "test(web): add checkout flow smoke tests"
```
