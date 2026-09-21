# Identity & Payment Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Username registration and payment links (pay.avela.xyz/username). Users pick a unique username, get a shareable link. Anyone with the link can pay them — the link resolves to a wallet address.

**Architecture:** Domain logic (username validation, registration, resolution) in `packages/core`. API routes in `apps/api`. Payment link page in `apps/web`. The identity table has a unique constraint on username with case-insensitive lookup (stored lowercase).

**Tech Stack:** Drizzle ORM, Zod, ulidx, Hono, Next.js 15

## Global Constraints

- Biome: tabs, double quotes, semicolons, trailing commas
- All IDs are ULIDs via `ulidx`
- Zod validation at every domain boundary
- Usernames: 3-32 chars, lowercase alphanumeric + hyphens, start/end alphanumeric
- Reserved words: admin, avela, pay, api, app, www, help, support
- `bun run check` and `bun run test` must pass after every task
- Tests require `TEST_DATABASE_URL` env var pointing to a Postgres database. Run migrations before tests.

---

### Task 1: Identity Domain Types and Validation

**Files:**
- Modify: `packages/core/src/domain/types.ts`
- Create: `packages/core/src/domain/identity.ts`
- Test: `packages/core/src/domain/__tests__/identity.test.ts`

**Interfaces:**
- Consumes: nothing (foundational)
- Produces: `Identity` type, `USERNAME_RULES`, `validateUsername(username: string): { valid: boolean; error?: string }`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/domain/__tests__/identity.test.ts
import { describe, it, expect } from "vitest";
import { validateUsername, USERNAME_RULES } from "../identity.js";

describe("validateUsername", () => {
	it("accepts valid usernames", () => {
		expect(validateUsername("samuel").valid).toBe(true);
		expect(validateUsername("my-name").valid).toBe(true);
		expect(validateUsername("abc").valid).toBe(true);
		expect(validateUsername("user123").valid).toBe(true);
		expect(validateUsername("a-b-c-d").valid).toBe(true);
	});

	it("rejects too short", () => {
		const result = validateUsername("ab");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("at least 3");
	});

	it("rejects too long", () => {
		const result = validateUsername("a".repeat(33));
		expect(result.valid).toBe(false);
		expect(result.error).toContain("at most 32");
	});

	it("rejects starting with hyphen", () => {
		const result = validateUsername("-username");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("start and end");
	});

	it("rejects ending with hyphen", () => {
		const result = validateUsername("username-");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("start and end");
	});

	it("rejects uppercase (converts to lowercase for check)", () => {
		const result = validateUsername("UserName");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("lowercase");
	});

	it("rejects special characters", () => {
		expect(validateUsername("user_name").valid).toBe(false);
		expect(validateUsername("user.name").valid).toBe(false);
		expect(validateUsername("user@name").valid).toBe(false);
		expect(validateUsername("user name").valid).toBe(false);
	});

	it("rejects reserved words", () => {
		const result = validateUsername("admin");
		expect(result.valid).toBe(false);
		expect(result.error).toContain("reserved");
	});

	it("rejects all reserved words", () => {
		for (const word of USERNAME_RULES.reserved) {
			expect(validateUsername(word).valid).toBe(false);
		}
	});

	it("rejects empty string", () => {
		expect(validateUsername("").valid).toBe(false);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- packages/core/src/domain/__tests__/identity.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Add Identity type to types.ts**

Append to `packages/core/src/domain/types.ts`:

```ts
// Identity
export type Identity = {
	id: string;
	accountId: string;
	username: string;
	displayName: string | null;
	createdAt: Date;
	updatedAt: Date;
};
```

- [ ] **Step 4: Implement username validation**

```ts
// packages/core/src/domain/identity.ts
export const USERNAME_RULES = {
	minLength: 3,
	maxLength: 32,
	pattern: /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
	singleCharPattern: /^[a-z0-9]$/,
	reserved: ["admin", "avela", "pay", "api", "app", "www", "help", "support"],
} as const;

export function validateUsername(username: string): { valid: boolean; error?: string } {
	if (!username || username.length < USERNAME_RULES.minLength) {
		return { valid: false, error: `Username must be at least ${USERNAME_RULES.minLength} characters.` };
	}

	if (username.length > USERNAME_RULES.maxLength) {
		return { valid: false, error: `Username must be at most ${USERNAME_RULES.maxLength} characters.` };
	}

	if (username !== username.toLowerCase()) {
		return { valid: false, error: "Username must be lowercase." };
	}

	const validPattern =
		username.length === 1
			? USERNAME_RULES.singleCharPattern.test(username)
			: USERNAME_RULES.pattern.test(username);

	if (!validPattern) {
		return {
			valid: false,
			error: "Username must start and end with a letter or number, and contain only lowercase letters, numbers, and hyphens.",
		};
	}

	if (USERNAME_RULES.reserved.includes(username)) {
		return { valid: false, error: `"${username}" is reserved.` };
	}

	return { valid: true };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- packages/core/src/domain/__tests__/identity.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/domain/types.ts packages/core/src/domain/identity.ts packages/core/src/domain/__tests__/identity.test.ts
git commit -m "feat(core): add username validation and Identity type"
```

---

### Task 2: Identity Database Schema

**Files:**
- Modify: `packages/core/src/db/schema.ts`
- Test: `packages/core/src/db/__tests__/identity-schema.test.ts`

**Interfaces:**
- Consumes: `accounts` table (foreign key)
- Produces: `identities` table (Drizzle table definition with unique constraint on username)

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/db/__tests__/identity-schema.test.ts
import { describe, it, expect } from "vitest";
import { identities } from "../schema.js";

describe("identities schema", () => {
	it("exports identities table", () => {
		expect(identities).toBeDefined();
	});

	it("has required columns", () => {
		const columns = Object.keys(identities);
		expect(columns).toContain("id");
		expect(columns).toContain("accountId");
		expect(columns).toContain("username");
		expect(columns).toContain("displayName");
		expect(columns).toContain("createdAt");
		expect(columns).toContain("updatedAt");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- packages/core/src/db/__tests__/identity-schema.test.ts`
Expected: FAIL — table not defined

- [ ] **Step 3: Add identities table to schema.ts**

Append to `packages/core/src/db/schema.ts`:

```ts
export const identities = pgTable("identities", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull().references(() => accounts.id).unique(),
	username: text("username").notNull().unique(),
	displayName: text("display_name"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- packages/core/src/db/__tests__/identity-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/db/schema.ts packages/core/src/db/__tests__/identity-schema.test.ts
git commit -m "feat(core): add identities database schema"
```

---

### Task 3: Username Registration and Resolution

**Files:**
- Modify: `packages/core/src/domain/identity.ts`
- Test: `packages/core/src/domain/__tests__/identity-ops.test.ts`

**Interfaces:**
- Consumes: `identities` table, `accounts` table, `validateUsername()`, `ulid()` from ulidx
- Produces: `createRegisterUsername(db)`, `createResolveUsername(db)`, `createIsUsernameAvailable(db)`

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/src/domain/__tests__/identity-ops.test.ts
import { describe, it, expect } from "vitest";
import {
	createRegisterUsername,
	createResolveUsername,
	createIsUsernameAvailable,
} from "../identity.js";

describe("identity operation factories", () => {
	it("exports createRegisterUsername", () => {
		expect(createRegisterUsername).toBeTypeOf("function");
	});

	it("exports createResolveUsername", () => {
		expect(createResolveUsername).toBeTypeOf("function");
	});

	it("exports createIsUsernameAvailable", () => {
		expect(createIsUsernameAvailable).toBeTypeOf("function");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- packages/core/src/domain/__tests__/identity-ops.test.ts`
Expected: FAIL — functions not exported

- [ ] **Step 3: Implement registration, resolution, availability**

Append to `packages/core/src/domain/identity.ts`:

```ts
import { ulid } from "ulidx";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { identities, accounts } from "../db/schema.js";
import type { Identity } from "./types.js";

export function createRegisterUsername(db: PostgresJsDatabase) {
	return async function registerUsername(
		accountId: string,
		username: string,
		displayName?: string,
	): Promise<Identity> {
		const validation = validateUsername(username);
		if (!validation.valid) {
			throw new Error(validation.error);
		}

		const now = new Date();
		const [identity] = await db
			.insert(identities)
			.values({
				id: ulid(),
				accountId,
				username,
				displayName: displayName ?? null,
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		return identity!;
	};
}

export function createResolveUsername(db: PostgresJsDatabase) {
	return async function resolveUsername(
		username: string,
	): Promise<{ accountId: string; walletAddress: string } | null> {
		const [identity] = await db
			.select()
			.from(identities)
			.where(eq(identities.username, username.toLowerCase()));

		if (!identity) return null;

		const [account] = await db
			.select({ id: accounts.id, walletAddress: accounts.walletAddress })
			.from(accounts)
			.where(eq(accounts.id, identity.accountId));

		if (!account) return null;

		return { accountId: account.id, walletAddress: account.walletAddress };
	};
}

export function createIsUsernameAvailable(db: PostgresJsDatabase) {
	return async function isUsernameAvailable(username: string): Promise<boolean> {
		const validation = validateUsername(username.toLowerCase());
		if (!validation.valid) return false;

		const [existing] = await db
			.select()
			.from(identities)
			.where(eq(identities.username, username.toLowerCase()));

		return !existing;
	};
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- packages/core/src/domain/__tests__/identity-ops.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/identity.ts packages/core/src/domain/__tests__/identity-ops.test.ts
git commit -m "feat(core): add username registration and resolution"
```

---

### Task 4: Identity API Routes

**Files:**
- Create: `apps/api/src/routes/identity.ts`
- Test: `apps/api/src/routes/__tests__/identity.test.ts`

**Interfaces:**
- Consumes: `createRegisterUsername()`, `createResolveUsername()`, `createIsUsernameAvailable()`, Privy auth middleware
- Produces: Hono route group with `POST /register`, `GET /available/:username`, `GET /resolve/:username`

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/routes/__tests__/identity.test.ts
import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { createIdentityRoutes } from "../identity.js";

describe("identity routes", () => {
	it("exports createIdentityRoutes", () => {
		expect(createIdentityRoutes).toBeTypeOf("function");
	});

	it("creates a Hono app with routes", () => {
		const routes = createIdentityRoutes({
			registerUsername: async () => ({
				id: "01JTEST",
				accountId: "01JACCOUNT",
				username: "testuser",
				displayName: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
			resolveUsername: async () => ({
				accountId: "01JACCOUNT",
				walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
			}),
			isUsernameAvailable: async () => true,
		});
		expect(routes).toBeDefined();
	});
});

describe("GET /available/:username", () => {
	function createApp(available: boolean) {
		const routes = createIdentityRoutes({
			registerUsername: async () => {
				throw new Error("not called");
			},
			resolveUsername: async () => null,
			isUsernameAvailable: async () => available,
		});
		const app = new Hono();
		app.route("/identity", routes);
		return app;
	}

	it("returns available: true for unclaimed username", async () => {
		const app = createApp(true);
		const res = await app.request("/identity/available/newuser");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.available).toBe(true);
	});

	it("returns available: false for taken username", async () => {
		const app = createApp(false);
		const res = await app.request("/identity/available/taken");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.available).toBe(false);
	});
});

describe("GET /resolve/:username", () => {
	it("returns account for existing username", async () => {
		const routes = createIdentityRoutes({
			registerUsername: async () => {
				throw new Error("not called");
			},
			resolveUsername: async () => ({
				accountId: "01JACCOUNT",
				walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
			}),
			isUsernameAvailable: async () => false,
		});
		const app = new Hono();
		app.route("/identity", routes);

		const res = await app.request("/identity/resolve/samuel");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.walletAddress).toBe("0x1234567890abcdef1234567890abcdef12345678");
	});

	it("returns 404 for unknown username", async () => {
		const routes = createIdentityRoutes({
			registerUsername: async () => {
				throw new Error("not called");
			},
			resolveUsername: async () => null,
			isUsernameAvailable: async () => true,
		});
		const app = new Hono();
		app.route("/identity", routes);

		const res = await app.request("/identity/resolve/unknown");
		expect(res.status).toBe(404);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- apps/api/src/routes/__tests__/identity.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement identity routes**

```ts
// apps/api/src/routes/identity.ts
import { Hono } from "hono";
import { z } from "zod";
import type { Identity } from "@avela/core/domain/types";

const registerSchema = z.object({
	accountId: z.string().min(1),
	username: z.string().min(3).max(32),
	displayName: z.string().optional(),
});

export type IdentityDeps = {
	registerUsername: (
		accountId: string,
		username: string,
		displayName?: string,
	) => Promise<Identity>;
	resolveUsername: (
		username: string,
	) => Promise<{ accountId: string; walletAddress: string } | null>;
	isUsernameAvailable: (username: string) => Promise<boolean>;
};

export function createIdentityRoutes(deps: IdentityDeps): Hono {
	const app = new Hono();

	app.post("/register", async (c) => {
		const body = await c.req.json();
		const parsed = registerSchema.safeParse(body);
		if (!parsed.success) {
			return c.json(
				{ error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
				400,
			);
		}

		try {
			const identity = await deps.registerUsername(
				parsed.data.accountId,
				parsed.data.username,
				parsed.data.displayName,
			);
			return c.json({ data: identity }, 201);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Registration failed";
			return c.json({ error: { code: "REGISTRATION_FAILED", message } }, 400);
		}
	});

	app.get("/available/:username", async (c) => {
		const username = c.req.param("username");
		const available = await deps.isUsernameAvailable(username);
		return c.json({ data: { username, available } });
	});

	app.get("/resolve/:username", async (c) => {
		const username = c.req.param("username");
		const result = await deps.resolveUsername(username);
		if (!result) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: `Username "${username}" not found` } },
				404,
			);
		}
		return c.json({ data: result });
	});

	return app;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run test -- apps/api/src/routes/__tests__/identity.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/identity.ts apps/api/src/routes/__tests__/identity.test.ts
git commit -m "feat(api): add identity routes for username registration and resolution"
```

---

### Task 5: Payment Link Page

**Files:**
- Create: `apps/web/src/app/pay/[username]/page.tsx`

**Interfaces:**
- Consumes: API `GET /identity/resolve/:username`, Privy wallet connect
- Produces: `/pay/:username` page showing recipient info, amount input, and "Pay with Avela" button

- [ ] **Step 1: Create the payment link page**

```tsx
// apps/web/src/app/pay/[username]/page.tsx
"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ResolvedIdentity = {
	accountId: string;
	walletAddress: string;
};

export default function PaymentLinkPage() {
	const params = useParams<{ username: string }>();
	const searchParams = useSearchParams();
	const router = useRouter();

	const prefillAmount = searchParams.get("amount");
	const [resolved, setResolved] = useState<ResolvedIdentity | null>(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [amount, setAmount] = useState(prefillAmount ?? "");
	const [status, setStatus] = useState<"idle" | "paying" | "error">("idle");

	useEffect(() => {
		async function resolve() {
			try {
				const response = await fetch(`/api/identity/resolve/${params.username}`);
				if (!response.ok) {
					setNotFound(true);
					return;
				}
				const { data } = await response.json();
				setResolved(data);
			} catch {
				setNotFound(true);
			} finally {
				setLoading(false);
			}
		}
		resolve();
	}, [params.username]);

	async function handlePay() {
		if (!resolved || !amount) return;
		setStatus("paying");
		try {
			const response = await fetch("/api/payments/intent", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amount: Number.parseFloat(amount),
					recipientAddress: resolved.walletAddress,
					recipientUsername: params.username,
				}),
			});
			if (!response.ok) throw new Error("Payment failed");
			const { data } = await response.json();
			router.push(`/checkout/receipt/${data.id}`);
		} catch {
			setStatus("error");
		}
	}

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	if (notFound) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4">
				<h1 className="text-2xl font-bold">User not found</h1>
				<p className="text-muted-foreground">
					No Avela account with username &ldquo;{params.username}&rdquo;
				</p>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold">Pay @{params.username}</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Send payment via Avela — stocks stay, they get stablecoins.
					</p>
				</div>

				<div className="space-y-4">
					<div>
						<label htmlFor="amount" className="mb-1 block text-sm font-medium">
							Amount (USD)
						</label>
						<input
							id="amount"
							type="number"
							min="0.01"
							step="0.01"
							placeholder="0.00"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							className="w-full rounded-lg border border-border bg-background px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>

					{status === "error" && (
						<p className="text-sm text-destructive">Payment failed. Please try again.</p>
					)}

					<button
						type="button"
						onClick={handlePay}
						disabled={!amount || Number.parseFloat(amount) <= 0 || status === "paying"}
						className="w-full rounded-xl bg-primary py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
					>
						{status === "paying" ? "Processing..." : "Pay with Avela"}
					</button>
				</div>

				<p className="text-center text-xs text-muted-foreground">
					Recipient:{" "}
					<span className="font-mono">
						{resolved?.walletAddress.slice(0, 6)}...{resolved?.walletAddress.slice(-4)}
					</span>
				</p>
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Verify the page renders**

Run: `cd /Users/samueldanso/Workspace/products/avela && bun run dev:web`
Visit: `http://localhost:3000/pay/samuel` — should show "User not found" (no API yet)
Visit: `http://localhost:3000/pay/samuel?amount=25` — amount should prefill

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/pay/
git commit -m "feat(web): add payment link page for /pay/:username"
```
