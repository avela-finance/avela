# Web Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Avela PWA product dashboard — mobile-first, dark-mode-default web app for managing portfolio, spending power, payments, policies, agents, and watchers.

**Architecture:** Next.js 15 App Router with Privy for wallet auth, Tailwind CSS v4 for styling, shadcn/ui for component primitives, and a typed fetch wrapper for API communication. All pages are client components that fetch data from `apps/api`. Mobile-first responsive with bottom tab navigation.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, shadcn/ui, Radix, Geist font, Motion (Framer Motion), @privy-io/react-auth, TypeScript

## Global Constraints

- Biome formatting: tabs, double quotes, semicolons, trailing commas
- TypeScript strict mode, no `as any` or `@ts-ignore`
- Dark mode as default theme
- Mobile-first: design for 375px, scale up to 1440px
- All entity IDs are ULIDs
- Package manager: `bun` (not npm/yarn/pnpm)
- Run `bun run check` and `bun run typecheck` before reporting done
- Privy for all auth — no custom auth flows

---

### Task 1: Next.js App Scaffold

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/vitest.config.ts`

**Interfaces:**
- Consumes: root workspace `tsconfig.json` (extends)
- Produces: working `bun run --cwd apps/web dev` command, Tailwind CSS v4 configured

- [ ] **Step 1: Create package.json**

```json
{
	"name": "@avela/web",
	"version": "0.1.0",
	"private": true,
	"type": "module",
	"scripts": {
		"dev": "next dev --port 3000",
		"build": "next build",
		"start": "next start",
		"typecheck": "tsc --noEmit"
	},
	"dependencies": {
		"@privy-io/react-auth": "^2.11.0",
		"@radix-ui/react-dialog": "^1.1.0",
		"@radix-ui/react-dropdown-menu": "^2.1.0",
		"@radix-ui/react-label": "^2.1.0",
		"@radix-ui/react-select": "^2.1.0",
		"@radix-ui/react-separator": "^1.1.0",
		"@radix-ui/react-slot": "^1.1.0",
		"@radix-ui/react-switch": "^1.1.0",
		"@radix-ui/react-tabs": "^1.1.0",
		"@radix-ui/react-toast": "^1.2.0",
		"class-variance-authority": "^0.7.0",
		"clsx": "^2.1.0",
		"motion": "^12.0.0",
		"next": "^15.3.0",
		"react": "^19.0.0",
		"react-dom": "^19.0.0",
		"tailwind-merge": "^3.0.0"
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

Create `apps/web/postcss.config.mjs`:

```js
const config = {
	plugins: {
		"@tailwindcss/postcss": {},
	},
};

export default config;
```

- [ ] **Step 5: Create globals.css with Tailwind v4**

Create `apps/web/src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
	--font-sans: "Geist", ui-sans-serif, system-ui, sans-serif;
	--font-mono: "Geist Mono", ui-monospace, monospace;
	--radius-sm: 8px;
	--radius-md: 12px;
	--radius-lg: 16px;
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

- [ ] **Step 6: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
	test: {
		environment: "node",
		include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
});
```

- [ ] **Step 7: Install dependencies and verify**

Run: `bun install`
Run: `bun run --cwd apps/web typecheck`
Expected: compiles with zero errors (no source files yet, just config)

- [ ] **Step 8: Commit**

```bash
git add apps/web/
git commit -m "feat(web): scaffold Next.js app with Tailwind v4 and Privy"
```

---

### Task 2: Root Layout with Privy and Geist Fonts

**Files:**
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/components/providers.tsx`
- Create: `apps/web/src/lib/privy-config.ts`

**Interfaces:**
- Consumes: `@privy-io/react-auth` PrivyProvider
- Produces: `<RootLayout>` wrapping all pages, `<Providers>` component, Privy configured for X Layer (chain 196)

- [ ] **Step 1: Create Privy config**

Create `apps/web/src/lib/privy-config.ts`:

```ts
import type { PrivyClientConfig } from "@privy-io/react-auth";

export const privyConfig: PrivyClientConfig = {
	appearance: {
		theme: "dark",
		accentColor: "#10b981",
	},
	embeddedWallets: {
		createOnLogin: "users-without-wallets",
	},
	supportedChains: [
		{
			id: 196,
			name: "X Layer",
			nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
			rpcUrls: {
				default: { http: ["https://rpc.xlayer.tech"] },
			},
			blockExplorers: {
				default: {
					name: "X Layer Explorer",
					url: "https://www.okx.com/web3/explorer/xlayer",
				},
			},
		},
	],
	defaultChain: {
		id: 196,
		name: "X Layer",
		nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
		rpcUrls: {
			default: { http: ["https://rpc.xlayer.tech"] },
		},
		blockExplorers: {
			default: {
				name: "X Layer Explorer",
				url: "https://www.okx.com/web3/explorer/xlayer",
			},
		},
	},
};
```

- [ ] **Step 2: Create Providers component**

Create `apps/web/src/components/providers.tsx`:

```tsx
"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { privyConfig } from "@/lib/privy-config";

export function Providers({ children }: { children: React.ReactNode }) {
	const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
	if (!appId) {
		throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is required");
	}

	return (
		<PrivyProvider appId={appId} config={privyConfig}>
			{children}
		</PrivyProvider>
	);
}
```

- [ ] **Step 3: Create root layout**

Create `apps/web/src/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
	title: "Avela — Programmable Spending Account",
	description:
		"Pay from your tokenized stock portfolio without selling. Programmable policies, agent permissions, and WhatsApp access.",
	manifest: "/manifest.json",
};

export const viewport: Viewport = {
	themeColor: "#0a0a0a",
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
```

- [ ] **Step 4: Add geist font dependency**

Run: `bun add --cwd apps/web geist`

- [ ] **Step 5: Create placeholder page to verify**

Create `apps/web/src/app/page.tsx`:

```tsx
export default function DashboardPage() {
	return (
		<main className="flex min-h-screen items-center justify-center">
			<h1 className="text-2xl font-bold">Avela Dashboard</h1>
		</main>
	);
}
```

- [ ] **Step 6: Verify dev server starts**

Run: `bun run --cwd apps/web dev`
Expected: Next.js starts on port 3000, page renders with dark background and "Avela Dashboard" centered

- [ ] **Step 7: Commit**

```bash
git add apps/web/
git commit -m "feat(web): add root layout with Privy provider and Geist fonts"
```

---

### Task 3: API Client with Auth Token Injection

**Files:**
- Create: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/lib/api.test.ts`

**Interfaces:**
- Consumes: Privy `getAccessToken()` from `usePrivy()` hook
- Produces: `apiClient` object with typed `get`, `post`, `put`, `delete` methods that auto-inject auth headers

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/api.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildUrl, formatApiError } from "./api";

describe("buildUrl", () => {
	it("joins base URL and path", () => {
		const url = buildUrl("/accounts/123", "http://localhost:8787");
		expect(url).toBe("http://localhost:8787/accounts/123");
	});

	it("appends query params", () => {
		const url = buildUrl("/payments", "http://localhost:8787", { limit: "10", status: "settled" });
		expect(url).toBe("http://localhost:8787/payments?limit=10&status=settled");
	});

	it("omits undefined query params", () => {
		const url = buildUrl("/payments", "http://localhost:8787", {
			limit: "10",
			status: undefined,
		});
		expect(url).toBe("http://localhost:8787/payments?limit=10");
	});
});

describe("formatApiError", () => {
	it("extracts error message from API error response", () => {
		const error = formatApiError({
			error: { code: "NOT_FOUND", message: "Account not found" },
			meta: { requestId: "01JXYZ", timestamp: "2026-09-21T00:00:00Z" },
		});
		expect(error).toBe("Account not found");
	});

	it("returns fallback for unknown shape", () => {
		const error = formatApiError({ unexpected: true });
		expect(error).toBe("An unexpected error occurred");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- apps/web/src/lib/api.test.ts`
Expected: FAIL — `buildUrl` and `formatApiError` not defined

- [ ] **Step 3: Implement the API client**

Create `apps/web/src/lib/api.ts`:

```ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export function buildUrl(
	path: string,
	base: string = API_BASE_URL,
	params?: Record<string, string | undefined>,
): string {
	const url = `${base}${path}`;
	if (!params) return url;

	const searchParams = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) {
			searchParams.set(key, value);
		}
	}
	const qs = searchParams.toString();
	return qs ? `${url}?${qs}` : url;
}

export function formatApiError(body: unknown): string {
	if (
		typeof body === "object" &&
		body !== null &&
		"error" in body &&
		typeof (body as Record<string, unknown>).error === "object" &&
		(body as Record<string, unknown>).error !== null
	) {
		const err = (body as { error: { message?: string } }).error;
		if (typeof err.message === "string") return err.message;
	}
	return "An unexpected error occurred";
}

type ApiResponse<T> = {
	data: T;
	meta?: { requestId: string; timestamp: string };
};

type RequestOptions = {
	params?: Record<string, string | undefined>;
	body?: unknown;
	token?: string | null;
};

async function request<T>(
	method: string,
	path: string,
	options: RequestOptions = {},
): Promise<ApiResponse<T>> {
	const url = buildUrl(path, API_BASE_URL, options.params);

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};

	if (options.token) {
		headers["Authorization"] = `Bearer ${options.token}`;
	}

	const res = await fetch(url, {
		method,
		headers,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});

	if (!res.ok) {
		const errorBody = await res.json().catch(() => null);
		throw new Error(formatApiError(errorBody));
	}

	return res.json() as Promise<ApiResponse<T>>;
}

export const api = {
	get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, options),
	post: <T>(path: string, options?: RequestOptions) => request<T>("POST", path, options),
	put: <T>(path: string, options?: RequestOptions) => request<T>("PUT", path, options),
	delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test -- apps/web/src/lib/api.test.ts`
Expected: all 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/lib/api.test.ts
git commit -m "feat(web): add typed API client with auth token injection"
```

---

### Task 4: App Shell with Mobile Navigation

**Files:**
- Create: `apps/web/src/components/layout/app-shell.tsx`
- Create: `apps/web/src/components/layout/mobile-nav.tsx`
- Create: `apps/web/src/components/layout/sidebar.tsx`
- Create: `apps/web/src/components/connect/wallet-button.tsx`
- Create: `apps/web/src/lib/cn.ts`
- Modify: `apps/web/src/app/layout.tsx`

**Interfaces:**
- Consumes: Privy `usePrivy()` for auth state, `useLogin()` for connect
- Produces: `<AppShell>` with authenticated/unauthenticated states, bottom tab nav on mobile, sidebar on desktop

- [ ] **Step 1: Create cn utility**

Create `apps/web/src/lib/cn.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create WalletButton**

Create `apps/web/src/components/connect/wallet-button.tsx`:

```tsx
"use client";

import { usePrivy } from "@privy-io/react-auth";
import { cn } from "@/lib/cn";

export function WalletButton({ className }: { className?: string }) {
	const { ready, authenticated, login, logout, user } = usePrivy();

	if (!ready) {
		return (
			<button
				disabled
				className={cn(
					"rounded-sm bg-neutral-800 px-4 py-2 text-sm text-neutral-400",
					className,
				)}
			>
				Loading…
			</button>
		);
	}

	if (authenticated) {
		const address = user?.wallet?.address;
		const display = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Connected";
		return (
			<button
				onClick={logout}
				className={cn(
					"rounded-sm bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700",
					className,
				)}
			>
				{display}
			</button>
		);
	}

	return (
		<button
			onClick={login}
			className={cn(
				"rounded-sm bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500",
				className,
			)}
		>
			Connect Wallet
		</button>
	);
}
```

- [ ] **Step 3: Create MobileNav**

Create `apps/web/src/components/layout/mobile-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const tabs = [
	{ label: "Dashboard", href: "/", icon: "⌂" },
	{ label: "Portfolio", href: "/portfolio", icon: "◈" },
	{ label: "Payments", href: "/payments", icon: "⇄" },
	{ label: "Settings", href: "/settings", icon: "⚙" },
] as const;

export function MobileNav() {
	const pathname = usePathname();

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-sm md:hidden">
			<div className="flex items-center justify-around py-2">
				{tabs.map((tab) => {
					const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
					return (
						<Link
							key={tab.href}
							href={tab.href}
							className={cn(
								"flex flex-col items-center gap-0.5 px-3 py-1 text-xs",
								isActive ? "text-emerald-400" : "text-neutral-500 hover:text-neutral-300",
							)}
						>
							<span className="text-lg">{tab.icon}</span>
							<span>{tab.label}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
```

- [ ] **Step 4: Create Sidebar for desktop**

Create `apps/web/src/components/layout/sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const navItems = [
	{ label: "Dashboard", href: "/" },
	{ label: "Portfolio", href: "/portfolio" },
	{ label: "Payments", href: "/payments" },
	{ label: "Policies", href: "/policies" },
	{ label: "Agents", href: "/agents" },
	{ label: "Watchers", href: "/watchers" },
	{ label: "Settings", href: "/settings" },
] as const;

export function Sidebar() {
	const pathname = usePathname();

	return (
		<aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-neutral-800 md:bg-neutral-950">
			<div className="p-6">
				<Link href="/" className="text-xl font-bold tracking-tight">
					Avela
				</Link>
			</div>
			<nav className="flex flex-1 flex-col gap-1 px-3">
				{navItems.map((item) => {
					const isActive =
						item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"rounded-sm px-3 py-2 text-sm font-medium",
								isActive
									? "bg-neutral-800 text-neutral-50"
									: "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200",
							)}
						>
							{item.label}
						</Link>
					);
				})}
			</nav>
		</aside>
	);
}
```

- [ ] **Step 5: Create AppShell**

Create `apps/web/src/components/layout/app-shell.tsx`:

```tsx
"use client";

import { usePrivy } from "@privy-io/react-auth";
import { WalletButton } from "@/components/connect/wallet-button";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
	const { ready, authenticated } = usePrivy();

	if (!ready) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-neutral-400">Loading…</div>
			</div>
		);
	}

	if (!authenticated) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
				<div className="text-center">
					<h1 className="text-3xl font-bold tracking-tight">Avela</h1>
					<p className="mt-2 text-neutral-400">
						Programmable spending account for tokenized stocks
					</p>
				</div>
				<WalletButton />
			</div>
		);
	}

	return (
		<div className="flex min-h-screen">
			<Sidebar />
			<div className="flex flex-1 flex-col">
				<header className="flex items-center justify-between border-b border-neutral-800 px-4 py-3 md:px-6">
					<h1 className="text-lg font-bold md:hidden">Avela</h1>
					<WalletButton className="ml-auto" />
				</header>
				<main className="flex-1 overflow-y-auto px-4 pb-20 pt-4 md:px-6 md:pb-6">
					{children}
				</main>
				<MobileNav />
			</div>
		</div>
	);
}
```

- [ ] **Step 6: Update root layout to use AppShell**

Modify `apps/web/src/app/layout.tsx` — wrap `{children}` with `<AppShell>`:

```tsx
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata: Metadata = {
	title: "Avela — Programmable Spending Account",
	description:
		"Pay from your tokenized stock portfolio without selling. Programmable policies, agent permissions, and WhatsApp access.",
	manifest: "/manifest.json",
};

export const viewport: Viewport = {
	themeColor: "#0a0a0a",
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
			<body>
				<Providers>
					<AppShell>{children}</AppShell>
				</Providers>
			</body>
		</html>
	);
}
```

- [ ] **Step 7: Verify in browser**

Run: `bun run --cwd apps/web dev`
Expected: unauthenticated state shows centered "Avela" with Connect Wallet button. After connect, sidebar on desktop + bottom tabs on mobile + header with wallet address.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): add app shell with mobile nav and sidebar"
```

---

### Task 5: Dashboard Page

**Files:**
- Create: `apps/web/src/components/account/spending-power-card.tsx`
- Create: `apps/web/src/components/account/portfolio-summary.tsx`
- Create: `apps/web/src/components/account/activity-feed.tsx`
- Modify: `apps/web/src/app/page.tsx`

**Interfaces:**
- Consumes: `api.get<SpendingPower>("/accounts/:id/portfolio")`, `api.get<PaymentIntent[]>("/payments")`
- Produces: Dashboard page with spending power hero, portfolio breakdown, recent activity

- [ ] **Step 1: Create SpendingPowerCard**

Create `apps/web/src/components/account/spending-power-card.tsx`:

```tsx
"use client";

import { motion } from "motion/react";

type SpendingPowerCardProps = {
	totalSpendingPower: number;
	portfolioValue: number;
	stablecoinBalance: number;
	loading?: boolean;
};

export function SpendingPowerCard({
	totalSpendingPower,
	portfolioValue,
	stablecoinBalance,
	loading,
}: SpendingPowerCardProps) {
	if (loading) {
		return (
			<div className="rounded-md bg-neutral-900 p-6">
				<div className="h-4 w-32 animate-pulse rounded bg-neutral-800" />
				<div className="mt-3 h-10 w-48 animate-pulse rounded bg-neutral-800" />
			</div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			className="rounded-md bg-gradient-to-br from-emerald-950/50 to-neutral-900 p-6"
		>
			<p className="text-sm font-medium text-neutral-400">Spending Power</p>
			<p className="mt-1 font-mono text-4xl font-bold tracking-tight">
				${totalSpendingPower.toLocaleString("en-US", { minimumFractionDigits: 2 })}
			</p>
			<div className="mt-4 flex gap-6 text-sm text-neutral-400">
				<div>
					<p className="text-neutral-500">Portfolio</p>
					<p className="font-mono text-neutral-200">
						${portfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
					</p>
				</div>
				<div>
					<p className="text-neutral-500">Stablecoins</p>
					<p className="font-mono text-neutral-200">
						${stablecoinBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
					</p>
				</div>
			</div>
		</motion.div>
	);
}
```

- [ ] **Step 2: Create PortfolioSummary**

Create `apps/web/src/components/account/portfolio-summary.tsx`:

```tsx
"use client";

import { cn } from "@/lib/cn";

type PositionSummary = {
	assetSymbol: string;
	assetName: string;
	positionValue: number;
	spendingPower: number;
	haircut: number;
};

type PortfolioSummaryProps = {
	positions: PositionSummary[];
	loading?: boolean;
};

export function PortfolioSummary({ positions, loading }: PortfolioSummaryProps) {
	if (loading) {
		return (
			<div className="rounded-md bg-neutral-900 p-4">
				<div className="h-4 w-24 animate-pulse rounded bg-neutral-800" />
				<div className="mt-4 space-y-3">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-12 animate-pulse rounded bg-neutral-800" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-md bg-neutral-900 p-4">
			<h3 className="text-sm font-medium text-neutral-400">Portfolio</h3>
			<div className="mt-3 space-y-2">
				{positions.map((pos) => (
					<div
						key={pos.assetSymbol}
						className="flex items-center justify-between rounded-sm bg-neutral-800/50 px-3 py-2.5"
					>
						<div>
							<p className="text-sm font-medium">{pos.assetSymbol}</p>
							<p className="text-xs text-neutral-500">{pos.assetName}</p>
						</div>
						<div className="text-right">
							<p className="font-mono text-sm">
								${pos.positionValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
							</p>
							<p className="font-mono text-xs text-emerald-400">
								SP: ${pos.spendingPower.toLocaleString("en-US", { minimumFractionDigits: 2 })}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
```

- [ ] **Step 3: Create ActivityFeed**

Create `apps/web/src/components/account/activity-feed.tsx`:

```tsx
"use client";

type ActivityItem = {
	id: string;
	type: "payment_settled" | "payment_failed" | "deposit" | "alert";
	description: string;
	amount: number | null;
	timestamp: string;
};

type ActivityFeedProps = {
	items: ActivityItem[];
	loading?: boolean;
};

const typeLabels: Record<ActivityItem["type"], string> = {
	payment_settled: "Paid",
	payment_failed: "Failed",
	deposit: "Deposited",
	alert: "Alert",
};

const typeColors: Record<ActivityItem["type"], string> = {
	payment_settled: "text-emerald-400",
	payment_failed: "text-red-400",
	deposit: "text-blue-400",
	alert: "text-amber-400",
};

export function ActivityFeed({ items, loading }: ActivityFeedProps) {
	if (loading) {
		return (
			<div className="rounded-md bg-neutral-900 p-4">
				<div className="h-4 w-28 animate-pulse rounded bg-neutral-800" />
				<div className="mt-4 space-y-3">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-10 animate-pulse rounded bg-neutral-800" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-md bg-neutral-900 p-4">
			<h3 className="text-sm font-medium text-neutral-400">Recent Activity</h3>
			{items.length === 0 ? (
				<p className="mt-4 text-sm text-neutral-600">No activity yet</p>
			) : (
				<div className="mt-3 space-y-2">
					{items.map((item) => (
						<div key={item.id} className="flex items-center justify-between py-1.5">
							<div>
								<span className={`text-xs font-medium ${typeColors[item.type]}`}>
									{typeLabels[item.type]}
								</span>
								<p className="text-sm text-neutral-300">{item.description}</p>
							</div>
							{item.amount !== null && (
								<p className="font-mono text-sm text-neutral-200">
									${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
								</p>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
```

- [ ] **Step 4: Update dashboard page**

Replace `apps/web/src/app/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { SpendingPowerCard } from "@/components/account/spending-power-card";
import { PortfolioSummary } from "@/components/account/portfolio-summary";
import { ActivityFeed } from "@/components/account/activity-feed";
import { api } from "@/lib/api";

export default function DashboardPage() {
	const { getAccessToken } = usePrivy();
	const [loading, setLoading] = useState(true);
	const [spendingPower, setSpendingPower] = useState({
		totalSpendingPower: 0,
		portfolioValue: 0,
		stablecoinBalance: 0,
	});
	const [positions, setPositions] = useState<
		Array<{
			assetSymbol: string;
			assetName: string;
			positionValue: number;
			spendingPower: number;
			haircut: number;
		}>
	>([]);
	const [activity, setActivity] = useState<
		Array<{
			id: string;
			type: "payment_settled" | "payment_failed" | "deposit" | "alert";
			description: string;
			amount: number | null;
			timestamp: string;
		}>
	>([]);

	useEffect(() => {
		async function fetchDashboard() {
			try {
				const token = await getAccessToken();
				const [portfolioRes, paymentsRes] = await Promise.all([
					api.get<{
						totalSpendingPower: number;
						portfolioValue: number;
						stablecoinBalance: number;
						perAsset: Array<{
							assetSymbol: string;
							assetName: string;
							positionValue: number;
							spendingPower: number;
							haircut: number;
						}>;
					}>("/accounts/me/portfolio", { token }),
					api.get<
						Array<{
							id: string;
							status: string;
							amount: number;
							recipientAddress: string;
							createdAt: string;
						}>
					>("/payments", { token, params: { limit: "5" } }),
				]);

				setSpendingPower({
					totalSpendingPower: portfolioRes.data.totalSpendingPower,
					portfolioValue: portfolioRes.data.portfolioValue,
					stablecoinBalance: portfolioRes.data.stablecoinBalance,
				});
				setPositions(portfolioRes.data.perAsset);
				setActivity(
					paymentsRes.data.map((p) => ({
						id: p.id,
						type: p.status === "settled" ? "payment_settled" : "payment_failed",
						description: `To ${p.recipientAddress.slice(0, 6)}…${p.recipientAddress.slice(-4)}`,
						amount: p.amount,
						timestamp: p.createdAt,
					})),
				);
			} catch {
				// API not running yet — render with defaults
			} finally {
				setLoading(false);
			}
		}
		fetchDashboard();
	}, [getAccessToken]);

	return (
		<div className="space-y-4">
			<SpendingPowerCard
				totalSpendingPower={spendingPower.totalSpendingPower}
				portfolioValue={spendingPower.portfolioValue}
				stablecoinBalance={spendingPower.stablecoinBalance}
				loading={loading}
			/>
			<div className="grid gap-4 md:grid-cols-2">
				<PortfolioSummary positions={positions} loading={loading} />
				<ActivityFeed items={activity} loading={loading} />
			</div>
		</div>
	);
}
```

- [ ] **Step 5: Verify in browser**

Run: `bun run --cwd apps/web dev`
Expected: Dashboard shows loading skeleton, then empty state (API not running). SpendingPowerCard with $0.00, empty portfolio and activity.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): add dashboard page with spending power and activity"
```

---

### Task 6: Portfolio Page

**Files:**
- Create: `apps/web/src/components/portfolio/position-card.tsx`
- Create: `apps/web/src/app/portfolio/page.tsx`

**Interfaces:**
- Consumes: `api.get("/accounts/me/portfolio")` returning `{ perAsset: PositionSummary[] }`
- Produces: `/portfolio` page showing per-asset position cards with value, haircut, spending power

- [ ] **Step 1: Create PositionCard**

Create `apps/web/src/components/portfolio/position-card.tsx`:

```tsx
"use client";

import { motion } from "motion/react";

type PositionCardProps = {
	assetSymbol: string;
	assetName: string;
	amount: string;
	positionValue: number;
	haircut: number;
	spendingPower: number;
};

export function PositionCard({
	assetSymbol,
	assetName,
	amount,
	positionValue,
	haircut,
	spendingPower,
}: PositionCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			className="rounded-md bg-neutral-900 p-4"
		>
			<div className="flex items-start justify-between">
				<div>
					<p className="text-lg font-bold">{assetSymbol}</p>
					<p className="text-sm text-neutral-500">{assetName}</p>
				</div>
				<div className="text-right">
					<p className="font-mono text-lg font-bold">
						${positionValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
					</p>
					<p className="font-mono text-xs text-neutral-500">{amount} shares</p>
				</div>
			</div>
			<div className="mt-4 grid grid-cols-2 gap-4 border-t border-neutral-800 pt-3">
				<div>
					<p className="text-xs text-neutral-500">Haircut</p>
					<p className="font-mono text-sm">{(haircut * 100).toFixed(0)}%</p>
				</div>
				<div>
					<p className="text-xs text-neutral-500">Spending Power</p>
					<p className="font-mono text-sm text-emerald-400">
						${spendingPower.toLocaleString("en-US", { minimumFractionDigits: 2 })}
					</p>
				</div>
			</div>
		</motion.div>
	);
}
```

- [ ] **Step 2: Create Portfolio page**

Create `apps/web/src/app/portfolio/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { PositionCard } from "@/components/portfolio/position-card";
import { api } from "@/lib/api";

type Position = {
	assetSymbol: string;
	assetName: string;
	amount: string;
	positionValue: number;
	haircut: number;
	spendingPower: number;
};

export default function PortfolioPage() {
	const { getAccessToken } = usePrivy();
	const [loading, setLoading] = useState(true);
	const [positions, setPositions] = useState<Position[]>([]);

	useEffect(() => {
		async function fetch() {
			try {
				const token = await getAccessToken();
				const res = await api.get<{ perAsset: Position[] }>("/accounts/me/portfolio", {
					token,
				});
				setPositions(res.data.perAsset);
			} catch {
				// API not running
			} finally {
				setLoading(false);
			}
		}
		fetch();
	}, [getAccessToken]);

	if (loading) {
		return (
			<div className="space-y-4">
				<h2 className="text-xl font-bold">Portfolio</h2>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-40 animate-pulse rounded-md bg-neutral-900" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<h2 className="text-xl font-bold">Portfolio</h2>
			{positions.length === 0 ? (
				<p className="text-neutral-500">No positions yet. Deposit wrapped xStocks to get started.</p>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{positions.map((pos) => (
						<PositionCard key={pos.assetSymbol} {...pos} />
					))}
				</div>
			)}
		</div>
	);
}
```

- [ ] **Step 3: Verify in browser**

Navigate to `/portfolio`. Expected: empty state or loading skeleton.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/portfolio/ apps/web/src/app/portfolio/
git commit -m "feat(web): add portfolio page with position cards"
```

---

### Task 7: Payments Pages

**Files:**
- Create: `apps/web/src/components/payments/payment-list.tsx`
- Create: `apps/web/src/components/payments/payment-status-badge.tsx`
- Create: `apps/web/src/app/payments/page.tsx`
- Create: `apps/web/src/app/payments/[id]/page.tsx`
- Create: `apps/web/src/lib/format.ts`
- Create: `apps/web/src/lib/format.test.ts`

**Interfaces:**
- Consumes: `api.get("/payments")`, `api.get("/payments/:id")`
- Produces: `/payments` list and `/payments/:id` receipt detail pages

- [ ] **Step 1: Write failing test for formatters**

Create `apps/web/src/lib/format.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatCurrency, formatAddress, formatDate } from "./format";

describe("formatCurrency", () => {
	it("formats USD with 2 decimals", () => {
		expect(formatCurrency(1234.5)).toBe("$1,234.50");
	});

	it("formats zero", () => {
		expect(formatCurrency(0)).toBe("$0.00");
	});
});

describe("formatAddress", () => {
	it("truncates to 6...4", () => {
		expect(formatAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234…5678");
	});
});

describe("formatDate", () => {
	it("formats ISO string to readable date", () => {
		const result = formatDate("2026-09-21T14:30:00Z");
		expect(result).toContain("2026");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- apps/web/src/lib/format.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement formatters**

Create `apps/web/src/lib/format.ts`:

```ts
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount);
}

export function formatAddress(address: string): string {
	if (address.length < 10) return address;
	return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatDate(iso: string): string {
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(iso));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- apps/web/src/lib/format.test.ts`
Expected: all 4 tests PASS

- [ ] **Step 5: Create PaymentStatusBadge**

Create `apps/web/src/components/payments/payment-status-badge.tsx`:

```tsx
import { cn } from "@/lib/cn";

const statusStyles: Record<string, string> = {
	created: "bg-neutral-800 text-neutral-300",
	policy_check: "bg-neutral-800 text-neutral-300",
	awaiting_approval: "bg-amber-900/50 text-amber-300",
	funding: "bg-blue-900/50 text-blue-300",
	executing: "bg-blue-900/50 text-blue-300",
	settling: "bg-blue-900/50 text-blue-300",
	settled: "bg-emerald-900/50 text-emerald-300",
	failed: "bg-red-900/50 text-red-300",
	rejected: "bg-red-900/50 text-red-300",
};

export function PaymentStatusBadge({ status }: { status: string }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
				statusStyles[status] ?? "bg-neutral-800 text-neutral-300",
			)}
		>
			{status.replace(/_/g, " ")}
		</span>
	);
}
```

- [ ] **Step 6: Create PaymentList**

Create `apps/web/src/components/payments/payment-list.tsx`:

```tsx
"use client";

import Link from "next/link";
import { PaymentStatusBadge } from "./payment-status-badge";
import { formatCurrency, formatAddress, formatDate } from "@/lib/format";

type Payment = {
	id: string;
	amount: number;
	status: string;
	recipientAddress: string;
	createdAt: string;
};

export function PaymentList({ payments }: { payments: Payment[] }) {
	if (payments.length === 0) {
		return <p className="text-neutral-500">No payments yet.</p>;
	}

	return (
		<div className="space-y-2">
			{payments.map((p) => (
				<Link
					key={p.id}
					href={`/payments/${p.id}`}
					className="flex items-center justify-between rounded-sm bg-neutral-900 px-4 py-3 hover:bg-neutral-800/80"
				>
					<div>
						<p className="text-sm font-medium">To {formatAddress(p.recipientAddress)}</p>
						<p className="text-xs text-neutral-500">{formatDate(p.createdAt)}</p>
					</div>
					<div className="flex items-center gap-3">
						<p className="font-mono text-sm">{formatCurrency(p.amount)}</p>
						<PaymentStatusBadge status={p.status} />
					</div>
				</Link>
			))}
		</div>
	);
}
```

- [ ] **Step 7: Create Payments list page**

Create `apps/web/src/app/payments/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { PaymentList } from "@/components/payments/payment-list";
import { api } from "@/lib/api";

type Payment = {
	id: string;
	amount: number;
	status: string;
	recipientAddress: string;
	createdAt: string;
};

export default function PaymentsPage() {
	const { getAccessToken } = usePrivy();
	const [loading, setLoading] = useState(true);
	const [payments, setPayments] = useState<Payment[]>([]);

	useEffect(() => {
		async function fetch() {
			try {
				const token = await getAccessToken();
				const res = await api.get<Payment[]>("/payments", { token });
				setPayments(res.data);
			} catch {
				// API not running
			} finally {
				setLoading(false);
			}
		}
		fetch();
	}, [getAccessToken]);

	return (
		<div className="space-y-4">
			<h2 className="text-xl font-bold">Payments</h2>
			{loading ? (
				<div className="space-y-2">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-16 animate-pulse rounded-sm bg-neutral-900" />
					))}
				</div>
			) : (
				<PaymentList payments={payments} />
			)}
		</div>
	);
}
```

- [ ] **Step 8: Create Payment detail page**

Create `apps/web/src/app/payments/[id]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";
import { formatCurrency, formatAddress, formatDate } from "@/lib/format";
import { api } from "@/lib/api";

type PaymentDetail = {
	id: string;
	amount: number;
	status: string;
	recipientAddress: string;
	recipientUsername: string | null;
	fundingDecision: {
		source: string;
		asset: string | null;
		stablecoin: string;
	} | null;
	settlement: {
		txHash: string;
		blockNumber: number;
		amountSettled: string;
		stablecoin: string;
		settledAt: string;
	} | null;
	createdAt: string;
};

export default function PaymentDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { getAccessToken } = usePrivy();
	const [loading, setLoading] = useState(true);
	const [payment, setPayment] = useState<PaymentDetail | null>(null);

	useEffect(() => {
		async function fetch() {
			try {
				const token = await getAccessToken();
				const res = await api.get<PaymentDetail>(`/payments/${id}`, { token });
				setPayment(res.data);
			} catch {
				// not found or API not running
			} finally {
				setLoading(false);
			}
		}
		fetch();
	}, [id, getAccessToken]);

	if (loading) {
		return (
			<div className="space-y-4">
				<div className="h-6 w-32 animate-pulse rounded bg-neutral-800" />
				<div className="h-64 animate-pulse rounded-md bg-neutral-900" />
			</div>
		);
	}

	if (!payment) {
		return <p className="text-neutral-500">Payment not found.</p>;
	}

	const explorerBase = "https://www.okx.com/web3/explorer/xlayer/tx/";

	return (
		<div className="space-y-4">
			<h2 className="text-xl font-bold">Payment Receipt</h2>
			<div className="rounded-md bg-neutral-900 p-5 space-y-4">
				<div className="flex items-center justify-between">
					<p className="font-mono text-3xl font-bold">{formatCurrency(payment.amount)}</p>
					<PaymentStatusBadge status={payment.status} />
				</div>

				<div className="space-y-3 border-t border-neutral-800 pt-4 text-sm">
					<div className="flex justify-between">
						<span className="text-neutral-500">Recipient</span>
						<span className="font-mono">
							{payment.recipientUsername ?? formatAddress(payment.recipientAddress)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-neutral-500">Date</span>
						<span>{formatDate(payment.createdAt)}</span>
					</div>

					{payment.fundingDecision && (
						<>
							<div className="flex justify-between">
								<span className="text-neutral-500">Funding Source</span>
								<span>{payment.fundingDecision.source.replace(/_/g, " ")}</span>
							</div>
							{payment.fundingDecision.asset && (
								<div className="flex justify-between">
									<span className="text-neutral-500">Source Asset</span>
									<span>{payment.fundingDecision.asset}</span>
								</div>
							)}
							<div className="flex justify-between">
								<span className="text-neutral-500">Settlement Currency</span>
								<span>{payment.fundingDecision.stablecoin}</span>
							</div>
						</>
					)}

					{payment.settlement && (
						<>
							<div className="border-t border-neutral-800 pt-3">
								<p className="mb-2 text-xs font-medium text-neutral-400">
									Onchain Settlement Proof
								</p>
							</div>
							<div className="flex justify-between">
								<span className="text-neutral-500">Tx Hash</span>
								<a
									href={`${explorerBase}${payment.settlement.txHash}`}
									target="_blank"
									rel="noopener noreferrer"
									className="font-mono text-emerald-400 hover:underline"
								>
									{formatAddress(payment.settlement.txHash)}
								</a>
							</div>
							<div className="flex justify-between">
								<span className="text-neutral-500">Block</span>
								<span className="font-mono">{payment.settlement.blockNumber}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-neutral-500">Settled At</span>
								<span>{formatDate(payment.settlement.settledAt)}</span>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
```

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/lib/format.ts apps/web/src/lib/format.test.ts apps/web/src/components/payments/ apps/web/src/app/payments/
git commit -m "feat(web): add payments list and receipt detail pages"
```

---

### Task 8: Policies Page

**Files:**
- Create: `apps/web/src/app/policies/page.tsx`

**Interfaces:**
- Consumes: `api.get("/accounts/me/policies")`, `api.put("/accounts/me/policies")`
- Produces: `/policies` page with spending policy editor form

- [ ] **Step 1: Create Policies page**

Create `apps/web/src/app/policies/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { api } from "@/lib/api";

type SpendingPolicy = {
	dailyLimit: number | null;
	approvalThreshold: number | null;
	fundingPriority: string[];
};

export default function PoliciesPage() {
	const { getAccessToken } = usePrivy();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [policy, setPolicy] = useState<SpendingPolicy>({
		dailyLimit: 500,
		approvalThreshold: 100,
		fundingPriority: ["spending_power", "stablecoin_balance"],
	});

	useEffect(() => {
		async function fetch() {
			try {
				const token = await getAccessToken();
				const res = await api.get<SpendingPolicy>("/accounts/me/policies", { token });
				setPolicy(res.data);
			} catch {
				// API not running — use defaults
			} finally {
				setLoading(false);
			}
		}
		fetch();
	}, [getAccessToken]);

	async function handleSave() {
		setSaving(true);
		try {
			const token = await getAccessToken();
			await api.put("/accounts/me/policies", { token, body: policy });
		} catch {
			// handle error
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<div className="space-y-4">
				<h2 className="text-xl font-bold">Spending Policies</h2>
				<div className="h-64 animate-pulse rounded-md bg-neutral-900" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<h2 className="text-xl font-bold">Spending Policies</h2>
			<div className="rounded-md bg-neutral-900 p-5 space-y-5">
				<div>
					<label className="block text-sm font-medium text-neutral-400">
						Daily Spending Limit (USD)
					</label>
					<input
						type="number"
						value={policy.dailyLimit ?? ""}
						onChange={(e) =>
							setPolicy({ ...policy, dailyLimit: e.target.value ? Number(e.target.value) : null })
						}
						placeholder="No limit"
						className="mt-1 w-full rounded-sm border border-neutral-700 bg-neutral-800 px-3 py-2 font-mono text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-neutral-400">
						Approval Threshold (USD)
					</label>
					<p className="text-xs text-neutral-600">
						Payments above this amount require manual approval
					</p>
					<input
						type="number"
						value={policy.approvalThreshold ?? ""}
						onChange={(e) =>
							setPolicy({
								...policy,
								approvalThreshold: e.target.value ? Number(e.target.value) : null,
							})
						}
						placeholder="No threshold"
						className="mt-1 w-full rounded-sm border border-neutral-700 bg-neutral-800 px-3 py-2 font-mono text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-neutral-400">
						Funding Priority
					</label>
					<p className="text-xs text-neutral-600">
						Order in which funding sources are tried
					</p>
					<div className="mt-2 space-y-2">
						{policy.fundingPriority.map((source, idx) => (
							<div
								key={source}
								className="flex items-center gap-2 rounded-sm bg-neutral-800 px-3 py-2 text-sm"
							>
								<span className="font-mono text-neutral-500">{idx + 1}.</span>
								<span>{source.replace(/_/g, " ")}</span>
							</div>
						))}
					</div>
				</div>

				<button
					onClick={handleSave}
					disabled={saving}
					className="rounded-sm bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
				>
					{saving ? "Saving…" : "Save Policies"}
				</button>
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/policies/
git commit -m "feat(web): add spending policy editor page"
```

---

### Task 9: Agents Page

**Files:**
- Create: `apps/web/src/components/agents/agent-card.tsx`
- Create: `apps/web/src/app/agents/page.tsx`
- Create: `apps/web/src/app/agents/[id]/page.tsx`

**Interfaces:**
- Consumes: `api.get("/agents")`, `api.get("/agents/:id/permissions")`, `api.get("/agents/:id/spending-log")`
- Produces: `/agents` list page and `/agents/:id` detail with spending log

- [ ] **Step 1: Create AgentCard**

Create `apps/web/src/components/agents/agent-card.tsx`:

```tsx
"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";

type AgentCardProps = {
	id: string;
	name: string;
	status: "active" | "suspended" | "expired" | "revoked";
	maxPerTransaction: number;
	maxPerDay: number;
	dailySpent: number;
};

const statusColors: Record<string, string> = {
	active: "text-emerald-400",
	suspended: "text-amber-400",
	expired: "text-neutral-500",
	revoked: "text-red-400",
};

export function AgentCard({
	id,
	name,
	status,
	maxPerTransaction,
	maxPerDay,
	dailySpent,
}: AgentCardProps) {
	return (
		<Link
			href={`/agents/${id}`}
			className="block rounded-md bg-neutral-900 p-4 hover:bg-neutral-800/80"
		>
			<div className="flex items-center justify-between">
				<p className="font-medium">{name}</p>
				<span className={cn("text-xs font-medium", statusColors[status])}>{status}</span>
			</div>
			<div className="mt-3 grid grid-cols-3 gap-2 text-sm">
				<div>
					<p className="text-xs text-neutral-500">Per Tx</p>
					<p className="font-mono">{formatCurrency(maxPerTransaction)}</p>
				</div>
				<div>
					<p className="text-xs text-neutral-500">Daily Max</p>
					<p className="font-mono">{formatCurrency(maxPerDay)}</p>
				</div>
				<div>
					<p className="text-xs text-neutral-500">Today</p>
					<p className="font-mono">{formatCurrency(dailySpent)}</p>
				</div>
			</div>
		</Link>
	);
}
```

- [ ] **Step 2: Create Agents list page**

Create `apps/web/src/app/agents/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { AgentCard } from "@/components/agents/agent-card";
import { api } from "@/lib/api";

type Agent = {
	id: string;
	name: string;
	status: "active" | "suspended" | "expired" | "revoked";
	permissions: {
		maxPerTransaction: number;
		maxPerDay: number;
	};
	dailySpent: number;
};

export default function AgentsPage() {
	const { getAccessToken } = usePrivy();
	const [loading, setLoading] = useState(true);
	const [agents, setAgents] = useState<Agent[]>([]);

	useEffect(() => {
		async function fetch() {
			try {
				const token = await getAccessToken();
				const res = await api.get<Agent[]>("/agents", { token });
				setAgents(res.data);
			} catch {
				// API not running
			} finally {
				setLoading(false);
			}
		}
		fetch();
	}, [getAccessToken]);

	return (
		<div className="space-y-4">
			<h2 className="text-xl font-bold">Agent Permissions</h2>
			{loading ? (
				<div className="space-y-3">
					{[1, 2].map((i) => (
						<div key={i} className="h-28 animate-pulse rounded-md bg-neutral-900" />
					))}
				</div>
			) : agents.length === 0 ? (
				<p className="text-neutral-500">No agents registered yet.</p>
			) : (
				<div className="space-y-3">
					{agents.map((agent) => (
						<AgentCard
							key={agent.id}
							id={agent.id}
							name={agent.name}
							status={agent.status}
							maxPerTransaction={agent.permissions.maxPerTransaction}
							maxPerDay={agent.permissions.maxPerDay}
							dailySpent={agent.dailySpent}
						/>
					))}
				</div>
			)}
		</div>
	);
}
```

- [ ] **Step 3: Create Agent detail page**

Create `apps/web/src/app/agents/[id]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { api } from "@/lib/api";

type AgentDetail = {
	id: string;
	name: string;
	status: string;
	walletAddress: string;
	permissions: {
		maxPerTransaction: number;
		maxPerDay: number;
		allowedAssets: string[];
		allowedRecipients: string[];
		requiresApproval: boolean;
		approvalThreshold: number;
	};
	expiresAt: string | null;
};

type SpendingLogEntry = {
	id: string;
	amount: number;
	asset: string;
	recipient: string;
	status: string;
	decidedAt: string;
};

export default function AgentDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { getAccessToken } = usePrivy();
	const [loading, setLoading] = useState(true);
	const [agent, setAgent] = useState<AgentDetail | null>(null);
	const [log, setLog] = useState<SpendingLogEntry[]>([]);

	useEffect(() => {
		async function fetch() {
			try {
				const token = await getAccessToken();
				const [agentRes, logRes] = await Promise.all([
					api.get<AgentDetail>(`/agents/${id}/permissions`, { token }),
					api.get<SpendingLogEntry[]>(`/agents/${id}/spending-log`, { token }),
				]);
				setAgent(agentRes.data);
				setLog(logRes.data);
			} catch {
				// not found
			} finally {
				setLoading(false);
			}
		}
		fetch();
	}, [id, getAccessToken]);

	if (loading) {
		return <div className="h-64 animate-pulse rounded-md bg-neutral-900" />;
	}

	if (!agent) {
		return <p className="text-neutral-500">Agent not found.</p>;
	}

	return (
		<div className="space-y-4">
			<h2 className="text-xl font-bold">{agent.name}</h2>

			<div className="rounded-md bg-neutral-900 p-5 space-y-3 text-sm">
				<h3 className="font-medium text-neutral-400">Permission Scope</h3>
				<div className="grid grid-cols-2 gap-3">
					<div>
						<p className="text-xs text-neutral-500">Max Per Transaction</p>
						<p className="font-mono">{formatCurrency(agent.permissions.maxPerTransaction)}</p>
					</div>
					<div>
						<p className="text-xs text-neutral-500">Max Per Day</p>
						<p className="font-mono">{formatCurrency(agent.permissions.maxPerDay)}</p>
					</div>
					<div>
						<p className="text-xs text-neutral-500">Allowed Assets</p>
						<p>{agent.permissions.allowedAssets.length === 0 ? "All" : agent.permissions.allowedAssets.join(", ")}</p>
					</div>
					<div>
						<p className="text-xs text-neutral-500">Requires Approval</p>
						<p>{agent.permissions.requiresApproval ? `Always` : `Above ${formatCurrency(agent.permissions.approvalThreshold)}`}</p>
					</div>
				</div>
			</div>

			<div className="rounded-md bg-neutral-900 p-5 space-y-3">
				<h3 className="text-sm font-medium text-neutral-400">Spending Log</h3>
				{log.length === 0 ? (
					<p className="text-sm text-neutral-600">No spending activity yet.</p>
				) : (
					<div className="space-y-2">
						{log.map((entry) => (
							<div
								key={entry.id}
								className="flex items-center justify-between rounded-sm bg-neutral-800/50 px-3 py-2 text-sm"
							>
								<div>
									<p>{entry.asset} → {entry.recipient.slice(0, 8)}…</p>
									<p className="text-xs text-neutral-500">{formatDate(entry.decidedAt)}</p>
								</div>
								<p className="font-mono">{formatCurrency(entry.amount)}</p>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/agents/ apps/web/src/app/agents/
git commit -m "feat(web): add agent permissions dashboard and spending log"
```

---

### Task 10: Watchers Page

**Files:**
- Create: `apps/web/src/app/watchers/page.tsx`

**Interfaces:**
- Consumes: `api.get("/accounts/me/watchers")`, `api.post("/accounts/me/watchers")`
- Produces: `/watchers` page with watcher list and create form

- [ ] **Step 1: Create Watchers page**

Create `apps/web/src/app/watchers/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";

type Watcher = {
	id: string;
	type: string;
	config: { threshold: number };
	status: "active" | "triggered" | "paused" | "disabled";
	lastTriggeredAt: string | null;
};

const statusColors: Record<string, string> = {
	active: "text-emerald-400",
	triggered: "text-amber-400",
	paused: "text-neutral-500",
	disabled: "text-neutral-600",
};

export default function WatchersPage() {
	const { getAccessToken } = usePrivy();
	const [loading, setLoading] = useState(true);
	const [watchers, setWatchers] = useState<Watcher[]>([]);
	const [threshold, setThreshold] = useState("");
	const [creating, setCreating] = useState(false);

	useEffect(() => {
		fetchWatchers();
	}, []);

	async function fetchWatchers() {
		try {
			const token = await getAccessToken();
			const res = await api.get<Watcher[]>("/accounts/me/watchers", { token });
			setWatchers(res.data);
		} catch {
			// API not running
		} finally {
			setLoading(false);
		}
	}

	async function handleCreate() {
		if (!threshold) return;
		setCreating(true);
		try {
			const token = await getAccessToken();
			await api.post("/accounts/me/watchers", {
				token,
				body: { threshold: Number(threshold) },
			});
			setThreshold("");
			await fetchWatchers();
		} catch {
			// handle error
		} finally {
			setCreating(false);
		}
	}

	return (
		<div className="space-y-4">
			<h2 className="text-xl font-bold">Watchers</h2>

			<div className="rounded-md bg-neutral-900 p-4 space-y-3">
				<h3 className="text-sm font-medium text-neutral-400">
					Create Spending Power Alert
				</h3>
				<div className="flex gap-2">
					<input
						type="number"
						value={threshold}
						onChange={(e) => setThreshold(e.target.value)}
						placeholder="Alert below $..."
						className="flex-1 rounded-sm border border-neutral-700 bg-neutral-800 px-3 py-2 font-mono text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
					/>
					<button
						onClick={handleCreate}
						disabled={creating || !threshold}
						className="rounded-sm bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
					>
						{creating ? "Creating…" : "Create"}
					</button>
				</div>
			</div>

			{loading ? (
				<div className="space-y-2">
					{[1, 2].map((i) => (
						<div key={i} className="h-16 animate-pulse rounded-sm bg-neutral-900" />
					))}
				</div>
			) : watchers.length === 0 ? (
				<p className="text-neutral-500">No watchers configured.</p>
			) : (
				<div className="space-y-2">
					{watchers.map((w) => (
						<div
							key={w.id}
							className="flex items-center justify-between rounded-sm bg-neutral-900 px-4 py-3"
						>
							<div>
								<p className="text-sm font-medium">
									Alert when spending power drops below {formatCurrency(w.config.threshold)}
								</p>
								{w.lastTriggeredAt && (
									<p className="text-xs text-neutral-500">
										Last triggered: {new Date(w.lastTriggeredAt).toLocaleDateString()}
									</p>
								)}
							</div>
							<span className={cn("text-xs font-medium", statusColors[w.status])}>
								{w.status}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/watchers/
git commit -m "feat(web): add watchers page with threshold alert creation"
```

---

### Task 11: Settings Page

**Files:**
- Create: `apps/web/src/app/settings/page.tsx`

**Interfaces:**
- Consumes: `api.post("/identity/register")`, `api.get("/identity/me")`
- Produces: `/settings` page with username registration and WhatsApp linking

- [ ] **Step 1: Create Settings page**

Create `apps/web/src/app/settings/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { api } from "@/lib/api";

export default function SettingsPage() {
	const { getAccessToken, user } = usePrivy();
	const [username, setUsername] = useState("");
	const [currentUsername, setCurrentUsername] = useState<string | null>(null);
	const [savingUsername, setSavingUsername] = useState(false);
	const [usernameError, setUsernameError] = useState<string | null>(null);

	const [phone, setPhone] = useState("");
	const [whatsappLinked, setWhatsappLinked] = useState(false);
	const [linkingWhatsapp, setLinkingWhatsapp] = useState(false);

	useEffect(() => {
		async function fetch() {
			try {
				const token = await getAccessToken();
				const res = await api.get<{ username: string | null }>("/identity/me", { token });
				if (res.data.username) {
					setCurrentUsername(res.data.username);
					setUsername(res.data.username);
				}
			} catch {
				// API not running
			}
		}
		fetch();
	}, [getAccessToken]);

	async function handleSaveUsername() {
		setSavingUsername(true);
		setUsernameError(null);
		try {
			const token = await getAccessToken();
			await api.post("/identity/register", { token, body: { username } });
			setCurrentUsername(username);
		} catch (err) {
			setUsernameError(err instanceof Error ? err.message : "Failed to register username");
		} finally {
			setSavingUsername(false);
		}
	}

	async function handleLinkWhatsApp() {
		setLinkingWhatsapp(true);
		try {
			const token = await getAccessToken();
			await api.post("/integrations/whatsapp/link", {
				token,
				body: { phoneNumber: phone },
			});
			setWhatsappLinked(true);
		} catch {
			// handle error
		} finally {
			setLinkingWhatsapp(false);
		}
	}

	return (
		<div className="space-y-6">
			<h2 className="text-xl font-bold">Settings</h2>

			<div className="rounded-md bg-neutral-900 p-5 space-y-3">
				<h3 className="text-sm font-medium text-neutral-400">Username & Payment Link</h3>
				{currentUsername && (
					<p className="text-sm text-neutral-300">
						Your payment link:{" "}
						<span className="font-mono text-emerald-400">
							pay.useavela.xyz/{currentUsername}
						</span>
					</p>
				)}
				<div className="flex gap-2">
					<input
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value.toLowerCase())}
						placeholder="Choose a username"
						className="flex-1 rounded-sm border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
					/>
					<button
						onClick={handleSaveUsername}
						disabled={savingUsername || !username || username === currentUsername}
						className="rounded-sm bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
					>
						{savingUsername ? "Saving…" : currentUsername ? "Update" : "Register"}
					</button>
				</div>
				{usernameError && <p className="text-xs text-red-400">{usernameError}</p>}
			</div>

			<div className="rounded-md bg-neutral-900 p-5 space-y-3">
				<h3 className="text-sm font-medium text-neutral-400">WhatsApp Access</h3>
				<p className="text-xs text-neutral-500">
					Link your WhatsApp to approve payments and check balances from messaging.
				</p>
				{whatsappLinked ? (
					<p className="text-sm text-emerald-400">WhatsApp linked successfully.</p>
				) : (
					<div className="flex gap-2">
						<input
							type="tel"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder="+1234567890"
							className="flex-1 rounded-sm border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
						/>
						<button
							onClick={handleLinkWhatsApp}
							disabled={linkingWhatsapp || !phone}
							className="rounded-sm bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
						>
							{linkingWhatsapp ? "Linking…" : "Link WhatsApp"}
						</button>
					</div>
				)}
			</div>

			<div className="rounded-md bg-neutral-900 p-5 space-y-2">
				<h3 className="text-sm font-medium text-neutral-400">Connected Wallet</h3>
				<p className="font-mono text-sm text-neutral-300">
					{user?.wallet?.address ?? "Not connected"}
				</p>
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/settings/
git commit -m "feat(web): add settings page with username and WhatsApp linking"
```

---

### Task 12: Payment Link Page and PWA Manifest

**Files:**
- Create: `apps/web/src/app/pay/[username]/page.tsx`
- Create: `apps/web/public/manifest.json`

**Interfaces:**
- Consumes: `api.get("/identity/resolve/:username")`
- Produces: `/pay/:username` public payment link page, PWA installability

- [ ] **Step 1: Create payment link page**

Create `apps/web/src/app/pay/[username]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { api } from "@/lib/api";

type Recipient = {
	accountId: string;
	walletAddress: string;
	displayName: string | null;
};

export default function PaymentLinkPage() {
	const { username } = useParams<{ username: string }>();
	const searchParams = useSearchParams();
	const prefillAmount = searchParams.get("amount");
	const { authenticated, login, getAccessToken } = usePrivy();

	const [recipient, setRecipient] = useState<Recipient | null>(null);
	const [notFound, setNotFound] = useState(false);
	const [amount, setAmount] = useState(prefillAmount ?? "");
	const [paying, setPaying] = useState(false);

	useEffect(() => {
		async function resolve() {
			try {
				const res = await api.get<Recipient>(`/identity/resolve/${username}`);
				setRecipient(res.data);
			} catch {
				setNotFound(true);
			}
		}
		resolve();
	}, [username]);

	async function handlePay() {
		if (!authenticated) {
			login();
			return;
		}
		if (!amount || !recipient) return;

		setPaying(true);
		try {
			const token = await getAccessToken();
			const res = await api.post<{ id: string }>("/payments/intent", {
				token,
				body: {
					amount: Number(amount),
					recipientAddress: recipient.walletAddress,
					recipientUsername: username,
				},
			});
			window.location.href = `/payments/${res.data.id}`;
		} catch {
			// handle error
		} finally {
			setPaying(false);
		}
	}

	if (notFound) {
		return (
			<div className="flex min-h-screen items-center justify-center px-4">
				<div className="text-center">
					<h1 className="text-2xl font-bold">User not found</h1>
					<p className="mt-2 text-neutral-500">No Avela account for @{username}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-6 text-center">
				<div>
					<h1 className="text-2xl font-bold">
						Pay {recipient?.displayName ?? `@${username}`}
					</h1>
					<p className="mt-1 text-sm text-neutral-500">via Avela</p>
				</div>

				<div>
					<input
						type="number"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						placeholder="Amount (USD)"
						className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-4 py-3 text-center font-mono text-2xl text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none"
					/>
				</div>

				<button
					onClick={handlePay}
					disabled={paying || !amount}
					className="w-full rounded-md bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
				>
					{paying ? "Processing…" : authenticated ? "Pay with Avela" : "Connect Wallet to Pay"}
				</button>
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Create PWA manifest**

Create `apps/web/public/manifest.json`:

```json
{
	"name": "Avela — Programmable Spending Account",
	"short_name": "Avela",
	"description": "Pay from your tokenized stock portfolio without selling.",
	"start_url": "/",
	"display": "standalone",
	"background_color": "#0a0a0a",
	"theme_color": "#0a0a0a",
	"icons": [
		{
			"src": "/icon-192.png",
			"sizes": "192x192",
			"type": "image/png"
		},
		{
			"src": "/icon-512.png",
			"sizes": "512x512",
			"type": "image/png"
		}
	]
}
```

- [ ] **Step 3: Verify**

Run: `bun run --cwd apps/web dev`
Navigate to `/pay/testuser` — should render payment link page.
Check Application tab in DevTools — manifest should be detected.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/pay/ apps/web/public/manifest.json
git commit -m "feat(web): add payment link page and PWA manifest"
```

---

### Task 13: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run typecheck**

Run: `bun run --cwd apps/web typecheck`
Expected: zero errors

- [ ] **Step 2: Run Biome check**

Run: `bun run check`
Expected: no lint or format errors in `apps/web/`

- [ ] **Step 3: Run tests**

Run: `bun run test`
Expected: all tests pass (api.test.ts, format.test.ts)

- [ ] **Step 4: Visual verification**

Run: `bun run --cwd apps/web dev` and check all routes:
- `/` — Dashboard with spending power card
- `/portfolio` — Position cards
- `/payments` — Payment list
- `/policies` — Policy editor
- `/agents` — Agent list
- `/watchers` — Watcher list + create
- `/settings` — Username + WhatsApp
- `/pay/testuser` — Payment link
- Mobile viewport (375px) — bottom nav, no sidebar
- Desktop viewport (1440px) — sidebar, no bottom nav
