# Marketing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Avela marketing site at useavela.xyz — a fast, static landing page that tells the product story for OKX Dev Day judges, investors, and early users. One page, seven sections, SSG.

**Architecture:** Next.js 15 App Router with static generation. Single page composed of section components. No authentication, no API calls, no client-side state. Tailwind CSS v4 for styling, Geist font, subtle Motion animations on hero.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, Geist font, Motion (Framer Motion), TypeScript

## Global Constraints

- Biome formatting: tabs, double quotes, semicolons, trailing commas
- TypeScript strict mode, no `as any` or `@ts-ignore`
- Dark mode only (no theme toggle)
- Mobile-first: design for 375px, scale up to 1440px
- Static generation: `output: "export"` — no server-side rendering
- Performance target: LCP < 2s, CLS < 0.1, Lighthouse > 90
- Package manager: `bun` (not npm/yarn/pnpm)
- Run `bun run check` and `bun run typecheck` before reporting done

---

### Task 1: Next.js App Scaffold

**Files:**
- Create: `apps/site/package.json`
- Create: `apps/site/next.config.ts`
- Create: `apps/site/tsconfig.json`
- Create: `apps/site/postcss.config.mjs`
- Create: `apps/site/src/app/globals.css`

**Interfaces:**
- Consumes: root workspace `tsconfig.json` (extends)
- Produces: working `bun run --cwd apps/site dev` command, Tailwind CSS v4 configured

- [ ] **Step 1: Create package.json**

```json
{
	"name": "@avela/site",
	"version": "0.1.0",
	"private": true,
	"type": "module",
	"scripts": {
		"dev": "next dev --port 3001",
		"build": "next build",
		"start": "next start",
		"typecheck": "tsc --noEmit"
	},
	"dependencies": {
		"motion": "^12.0.0",
		"next": "^15.3.0",
		"react": "^19.0.0",
		"react-dom": "^19.0.0"
	},
	"devDependencies": {
		"@tailwindcss/postcss": "^4.0.0",
		"@types/react": "^19.0.0",
		"@types/react-dom": "^19.0.0",
		"postcss": "^8.5.0",
		"tailwindcss": "^4.0.0",
		"typescript": "^5.8.0"
	}
}
```

- [ ] **Step 2: Create next.config.ts**

```ts
import type { NextConfig } from "next";

const config: NextConfig = {
	reactStrictMode: true,
	output: "export",
};

export default config;
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
	"extends": "../../tsconfig.json",
	"compilerOptions": {
		"jsx": "preserve",
		"module": "ESNext",
		"moduleResolution": "bundler",
		"allowImportingTsExtensions": false,
		"paths": {
			"@/*": ["./src/*"]
		},
		"plugins": [{ "name": "next" }]
	},
	"include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
	"exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create postcss.config.mjs**

```js
const config = {
	plugins: {
		"@tailwindcss/postcss": {},
	},
};

export default config;
```

- [ ] **Step 5: Create globals.css with Tailwind v4**

Create `apps/site/src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
	--font-sans: "Geist", ui-sans-serif, system-ui, sans-serif;
	--font-mono: "Geist Mono", ui-monospace, monospace;
}

@layer base {
	:root {
		color-scheme: dark;
	}

	body {
		@apply bg-neutral-950 text-neutral-50 antialiased;
		font-family: var(--font-sans);
	}
}
```

- [ ] **Step 6: Install dependencies and verify**

Run: `bun install`
Run: `bun run --cwd apps/site typecheck`
Expected: compiles with zero errors

- [ ] **Step 7: Commit**

```bash
git add apps/site/
git commit -m "feat(site): scaffold Next.js marketing site with Tailwind v4"
```

---

### Task 2: Root Layout with SEO Metadata

**Files:**
- Create: `apps/site/src/app/layout.tsx`
- Create: `apps/site/src/lib/metadata.ts`

**Interfaces:**
- Consumes: Geist font package
- Produces: `<RootLayout>` with full SEO metadata, OG tags, Geist fonts loaded

- [ ] **Step 1: Create metadata config**

Create `apps/site/src/lib/metadata.ts`:

```ts
import type { Metadata } from "next";

export const siteMetadata: Metadata = {
	title: "Avela — Make your tokenized stocks your everyday spend",
	description:
		"One programmable account to hold tokenized stocks, unlock spending power, and pay across commerce. Built on X Layer.",
	metadataBase: new URL("https://useavela.xyz"),
	openGraph: {
		title: "Avela — Programmable Spending Account",
		description:
			"Pay from your tokenized stock portfolio without selling. Every payment is a market order on X Layer.",
		url: "https://useavela.xyz",
		siteName: "Avela",
		type: "website",
		images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Avela" }],
	},
	twitter: {
		card: "summary_large_image",
		title: "Avela — Programmable Spending Account",
		description:
			"Pay from your tokenized stock portfolio without selling. Every payment is a market order on X Layer.",
		images: ["/og-image.png"],
	},
	robots: { index: true, follow: true },
};
```

- [ ] **Step 2: Create root layout**

Create `apps/site/src/app/layout.tsx`:

```tsx
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { siteMetadata } from "@/lib/metadata";
import "./globals.css";

export const metadata = siteMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
			<body>{children}</body>
		</html>
	);
}
```

- [ ] **Step 3: Add geist font dependency**

Run: `bun add --cwd apps/site geist`

- [ ] **Step 4: Commit**

```bash
git add apps/site/
git commit -m "feat(site): add root layout with SEO metadata and Geist fonts"
```

---

### Task 3: Hero Section

**Files:**
- Create: `apps/site/src/components/hero.tsx`

**Interfaces:**
- Consumes: none
- Produces: `<Hero>` component with headline, subtitle, market angle, CTA button

- [ ] **Step 1: Create Hero component**

Create `apps/site/src/components/hero.tsx`:

```tsx
"use client";

import { motion } from "motion/react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.useavela.xyz";

export function Hero() {
	return (
		<section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 text-center">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
				className="max-w-3xl"
			>
				<h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
					Make your tokenized stocks
					<br />
					your everyday spend.
				</h1>
				<p className="mx-auto mt-6 max-w-xl text-lg text-neutral-400 sm:text-xl">
					One programmable account to hold tokenized stocks, unlock spending power, and pay
					across commerce.
				</p>
				<p className="mt-3 text-sm font-medium text-emerald-400">
					Every payment is a market order on X Layer.
				</p>
			</motion.div>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.3, duration: 0.5 }}
				className="mt-10"
			>
				<a
					href={APP_URL}
					className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
				>
					Launch App
					<span aria-hidden="true">→</span>
				</a>
			</motion.div>
		</section>
	);
}
```

- [ ] **Step 2: Create placeholder page to verify**

Create `apps/site/src/app/page.tsx`:

```tsx
import { Hero } from "@/components/hero";

export default function LandingPage() {
	return (
		<main>
			<Hero />
		</main>
	);
}
```

- [ ] **Step 3: Verify in browser**

Run: `bun run --cwd apps/site dev`
Expected: dark page with centered headline, subtitle, green "Every payment is a market order" line, and "Launch App" CTA.

- [ ] **Step 4: Commit**

```bash
git add apps/site/src/
git commit -m "feat(site): add hero section with market narrative"
```

---

### Task 4: How It Works Section

**Files:**
- Create: `apps/site/src/components/how-it-works.tsx`

**Interfaces:**
- Consumes: none
- Produces: `<HowItWorks>` component with 3-step visual flow

- [ ] **Step 1: Create HowItWorks component**

Create `apps/site/src/components/how-it-works.tsx`:

```tsx
"use client";

import { motion } from "motion/react";

const steps = [
	{
		number: "01",
		title: "Deposit tokenized stocks",
		description: "Transfer wrapped xStocks (wSPYx, wQQQx, wNVDAx) to your Avela account.",
	},
	{
		number: "02",
		title: "See your spending power",
		description:
			"Avela calculates how much you can spend based on your portfolio value and haircut.",
	},
	{
		number: "03",
		title: "Pay at checkout",
		description:
			"Your stocks stay — Avela swaps just enough to settle the payment. Merchant gets paid in stablecoin.",
	},
] as const;

export function HowItWorks() {
	return (
		<section className="mx-auto max-w-5xl px-4 py-24">
			<h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
				How it works
			</h2>
			<div className="mt-16 grid gap-8 sm:grid-cols-3">
				{steps.map((step, i) => (
					<motion.div
						key={step.number}
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ delay: i * 0.15, duration: 0.5 }}
						className="text-center"
					>
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-900/50 font-mono text-sm font-bold text-emerald-400">
							{step.number}
						</div>
						<h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
						<p className="mt-2 text-sm text-neutral-400">{step.description}</p>
					</motion.div>
				))}
			</div>
		</section>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/site/src/components/how-it-works.tsx
git commit -m "feat(site): add how-it-works section"
```

---

### Task 5: Features Section

**Files:**
- Create: `apps/site/src/components/features.tsx`

**Interfaces:**
- Consumes: none
- Produces: `<Features>` component highlighting 6 product capabilities

- [ ] **Step 1: Create Features component**

Create `apps/site/src/components/features.tsx`:

```tsx
"use client";

import { motion } from "motion/react";

const features = [
	{
		title: "Spending power from your portfolio",
		description:
			"Your tokenized stocks generate spending power. No selling, no liquidation — just spend.",
	},
	{
		title: "Every payment builds the market",
		description:
			"Each checkout triggers a real Uniswap V3 swap — your payment is a market order on X Layer.",
	},
	{
		title: "AI agent spending",
		description:
			"Authorize agents to spend within scoped permissions. Per-transaction limits, asset restrictions, daily caps.",
	},
	{
		title: "Approve payments via WhatsApp",
		description:
			"Check balances, approve or reject payments, and get receipts — all from WhatsApp.",
	},
	{
		title: "Watchers that act",
		description:
			"Set alerts for when spending power drops below a threshold. Your account monitors itself.",
	},
	{
		title: "Onchain receipts",
		description:
			"Every payment settles onchain. Full settlement proof with transaction hash and block number.",
	},
] as const;

export function Features() {
	return (
		<section className="mx-auto max-w-5xl px-4 py-24">
			<h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
				Built for programmable finance
			</h2>
			<div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{features.map((feature, i) => (
					<motion.div
						key={feature.title}
						initial={{ opacity: 0, y: 12 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ delay: i * 0.08, duration: 0.4 }}
						className="rounded-md border border-neutral-800 bg-neutral-900/50 p-5"
					>
						<h3 className="text-sm font-semibold">{feature.title}</h3>
						<p className="mt-2 text-sm text-neutral-400">{feature.description}</p>
					</motion.div>
				))}
			</div>
		</section>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/site/src/components/features.tsx
git commit -m "feat(site): add features section with market-building narrative"
```

---

### Task 6: Supported Assets Section

**Files:**
- Create: `apps/site/src/components/supported-assets.tsx`

**Interfaces:**
- Consumes: none (asset data hardcoded — verified from SPEC.md)
- Produces: `<SupportedAssets>` component with 3 MVP asset cards

- [ ] **Step 1: Create SupportedAssets component**

Create `apps/site/src/components/supported-assets.tsx`:

```tsx
const assets = [
	{
		symbol: "wSPYx",
		name: "Wrapped SPY xStock",
		pool: "USDG",
		liquidity: "$1.89M",
	},
	{
		symbol: "wQQQx",
		name: "Wrapped QQQ xStock",
		pool: "USDC",
		liquidity: "$738K",
	},
	{
		symbol: "wNVDAx",
		name: "Wrapped NVDA xStock",
		pool: "USDG",
		liquidity: "$623K",
	},
] as const;

export function SupportedAssets() {
	return (
		<section className="mx-auto max-w-5xl px-4 py-24">
			<h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
				Supported assets
			</h2>
			<p className="mx-auto mt-4 max-w-lg text-center text-neutral-400">
				Tokenized stocks on X Layer with deep Uniswap V3 liquidity.
			</p>
			<div className="mt-12 grid gap-4 sm:grid-cols-3">
				{assets.map((asset) => (
					<div
						key={asset.symbol}
						className="rounded-md border border-neutral-800 bg-neutral-900/50 p-5 text-center"
					>
						<p className="text-2xl font-bold">{asset.symbol}</p>
						<p className="mt-1 text-sm text-neutral-500">{asset.name}</p>
						<div className="mt-4 text-xs text-neutral-400">
							<span>{asset.pool} pool</span>
							<span className="mx-2 text-neutral-700">·</span>
							<span className="text-emerald-400">{asset.liquidity} TVL</span>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/site/src/components/supported-assets.tsx
git commit -m "feat(site): add supported assets section with verified pool data"
```

---

### Task 7: Built On and CTA Sections

**Files:**
- Create: `apps/site/src/components/built-on.tsx`
- Create: `apps/site/src/components/cta.tsx`

**Interfaces:**
- Consumes: none
- Produces: `<BuiltOn>` partner logos strip, `<CTA>` final call to action

- [ ] **Step 1: Create BuiltOn component**

Create `apps/site/src/components/built-on.tsx`:

```tsx
const partners = [
	{ name: "X Layer", url: "https://www.okx.com/xlayer" },
	{ name: "OKX", url: "https://www.okx.com" },
	{ name: "Uniswap", url: "https://uniswap.org" },
] as const;

export function BuiltOn() {
	return (
		<section className="border-t border-neutral-800 px-4 py-16">
			<p className="text-center text-sm font-medium text-neutral-500">Built on</p>
			<div className="mt-6 flex items-center justify-center gap-10">
				{partners.map((partner) => (
					<a
						key={partner.name}
						href={partner.url}
						target="_blank"
						rel="noopener noreferrer"
						className="text-lg font-bold text-neutral-400 transition-colors hover:text-neutral-200"
					>
						{partner.name}
					</a>
				))}
			</div>
		</section>
	);
}
```

- [ ] **Step 2: Create CTA component**

Create `apps/site/src/components/cta.tsx`:

```tsx
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.useavela.xyz";

export function CTA() {
	return (
		<section className="px-4 py-24 text-center">
			<h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
				Start spending from your portfolio.
			</h2>
			<p className="mx-auto mt-4 max-w-md text-neutral-400">
				Deposit tokenized stocks, unlock spending power, pay without selling.
			</p>
			<div className="mt-8">
				<a
					href={APP_URL}
					className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
				>
					Launch App
					<span aria-hidden="true">→</span>
				</a>
			</div>
		</section>
	);
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/site/src/components/built-on.tsx apps/site/src/components/cta.tsx
git commit -m "feat(site): add built-on partners and CTA sections"
```

---

### Task 8: Footer and Landing Page Composition

**Files:**
- Create: `apps/site/src/components/footer.tsx`
- Modify: `apps/site/src/app/page.tsx`

**Interfaces:**
- Consumes: all section components
- Produces: complete landing page with all 7 sections composed, site footer

- [ ] **Step 1: Create Footer component**

Create `apps/site/src/components/footer.tsx`:

```tsx
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.useavela.xyz";

const links = [
	{ label: "App", href: APP_URL },
	{ label: "Docs", href: "#" },
	{ label: "GitHub", href: "https://github.com/avela-finance" },
	{ label: "X", href: "https://x.com/avela_xyz" },
] as const;

export function Footer() {
	return (
		<footer className="border-t border-neutral-800 px-4 py-8">
			<div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
				<p className="text-sm text-neutral-500">© 2026 Avela</p>
				<div className="flex gap-6">
					{links.map((link) => (
						<a
							key={link.label}
							href={link.href}
							target={link.href.startsWith("http") ? "_blank" : undefined}
							rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
							className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
						>
							{link.label}
						</a>
					))}
				</div>
			</div>
		</footer>
	);
}
```

- [ ] **Step 2: Compose full landing page**

Replace `apps/site/src/app/page.tsx`:

```tsx
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Features } from "@/components/features";
import { SupportedAssets } from "@/components/supported-assets";
import { BuiltOn } from "@/components/built-on";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";

export default function LandingPage() {
	return (
		<main>
			<Hero />
			<HowItWorks />
			<Features />
			<SupportedAssets />
			<BuiltOn />
			<CTA />
			<Footer />
		</main>
	);
}
```

- [ ] **Step 3: Verify in browser**

Run: `bun run --cwd apps/site dev`
Expected: full landing page with all 7 sections rendering. Scroll through: hero → how it works → features → supported assets → built on → CTA → footer. Check mobile (375px) and desktop (1440px).

- [ ] **Step 4: Commit**

```bash
git add apps/site/src/
git commit -m "feat(site): compose landing page with all sections"
```

---

### Task 9: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run typecheck**

Run: `bun run --cwd apps/site typecheck`
Expected: zero errors

- [ ] **Step 2: Run Biome check**

Run: `bun run check`
Expected: no lint or format errors in `apps/site/`

- [ ] **Step 3: Run build (static export)**

Run: `bun run --cwd apps/site build`
Expected: static HTML generated in `apps/site/out/`. Build completes without errors.

- [ ] **Step 4: Visual verification**

Run: `bun run --cwd apps/site dev` and verify:
- Hero: headline, subtitle, market angle in green, Launch App CTA
- How it works: 3 numbered steps with staggered fade-in on scroll
- Features: 6 cards in 3-column grid on desktop, single column on mobile
- Supported assets: 3 asset cards with verified pool data
- Built on: X Layer, OKX, Uniswap text links
- CTA: "Start spending from your portfolio" + Launch App button
- Footer: copyright + navigation links
- Mobile (375px): everything stacks vertically, text readable
- Desktop (1440px): centered max-width layout, proper grids

- [ ] **Step 5: Check Lighthouse score**

Open Chrome DevTools → Lighthouse → Performance audit
Expected: Performance > 90, no CLS issues, LCP < 2s
