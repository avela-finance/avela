# Spending Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the policy engine that governs how spending works — daily limits, approval thresholds, price floors, minimum balance retention, and funding source priority. This is what makes Avela a programmable account.

**Architecture:** Each account gets a default spending policy on creation. Before any payment executes, the Funding Engine calls `evaluatePolicy()` which checks all rules (daily limit, approval threshold, price floors, minimum balances) and returns a pass/fail result with violation details. Daily spending is tracked in a rolling 24h window via a spending log table.

**Tech Stack:** Drizzle ORM (Postgres), Zod, ulidx, Vitest

## Global Constraints

- All entity IDs are ULIDs via `ulidx`
- Biome formatting: tabs, double quotes, semicolons, trailing commas
- TypeScript strict mode, ESNext modules
- Test with Vitest: `bun run test`
- Lint with Biome: `bun run check`
- Avela never silently sells stocks — payment fails if policy check fails
- Tests require `TEST_DATABASE_URL` env var pointing to a Postgres database. Run migrations before tests.

---

### Task 1: Policy Types and Default Configuration

**Files:**
- Create: `packages/core/src/domain/spending-policy.ts`
- Create: `packages/core/src/domain/policy-defaults.ts`
- Test: `packages/core/src/domain/__tests__/spending-policy.test.ts`

**Interfaces:**
- Consumes: Nothing (foundational types)
- Produces: `SpendingPolicy`, `PriceFloor`, `MinimumBalance`, `FundingSource`, `PolicyCheckResult`, `PolicyViolation` types, `DEFAULT_POLICY` constant

- [ ] **Step 1: Write the failing test for default policy**

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_POLICY } from "../policy-defaults.js";
import type { SpendingPolicy } from "../spending-policy.js";

describe("DEFAULT_POLICY", () => {
	it("has a daily limit of $500", () => {
		expect(DEFAULT_POLICY.dailyLimit).toBe(500);
	});

	it("has an approval threshold of $100", () => {
		expect(DEFAULT_POLICY.approvalThreshold).toBe(100);
	});

	it("defaults to spending power first, then stablecoin balance", () => {
		expect(DEFAULT_POLICY.fundingPriority).toEqual([
			"spending_power",
			"stablecoin_balance",
		]);
	});

	it("has no price floors by default", () => {
		expect(DEFAULT_POLICY.priceFloors).toEqual([]);
	});

	it("has no minimum balances by default", () => {
		expect(DEFAULT_POLICY.minimumBalances).toEqual([]);
	});

	it("is enabled by default", () => {
		expect(DEFAULT_POLICY.enabled).toBe(true);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test packages/core/src/domain/__tests__/spending-policy.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement types and default policy**

```ts
// packages/core/src/domain/spending-policy.ts

export type FundingSource = "spending_power" | "stablecoin_balance";

export type PriceFloor = {
	assetSymbol: string;
	floorPrice: number;
};

export type MinimumBalance = {
	assetSymbol: string;
	minimumAmount: bigint;
};

export type SpendingPolicy = {
	id: string;
	accountId: string;
	dailyLimit: number | null;
	approvalThreshold: number | null;
	priceFloors: PriceFloor[];
	minimumBalances: MinimumBalance[];
	fundingPriority: FundingSource[];
	enabled: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export type PolicyViolation = {
	rule: string;
	message: string;
	currentValue: number;
	threshold: number;
};

export type PolicyCheckResult = {
	passed: boolean;
	requiresApproval: boolean;
	violations: PolicyViolation[];
};
```

```ts
// packages/core/src/domain/policy-defaults.ts

import type { FundingSource, PriceFloor, MinimumBalance } from "./spending-policy.js";

export const DEFAULT_POLICY = {
	dailyLimit: 500,
	approvalThreshold: 100,
	priceFloors: [] as PriceFloor[],
	minimumBalances: [] as MinimumBalance[],
	fundingPriority: ["spending_power", "stablecoin_balance"] as FundingSource[],
	enabled: true,
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test packages/core/src/domain/__tests__/spending-policy.test.ts`
Expected: PASS — all 6 tests green

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/spending-policy.ts packages/core/src/domain/policy-defaults.ts packages/core/src/domain/__tests__/spending-policy.test.ts
git commit -m "feat(core): add spending policy types and default configuration"
```

---

### Task 2: Policy DB Schema and Daily Spending Log

**Files:**
- Modify: `packages/core/src/db/schema.ts` (add spending_policies, daily_spending_log tables)
- Test: `packages/core/src/db/__tests__/schema.test.ts` (extend)

**Interfaces:**
- Consumes: `accounts` table from core-account schema
- Produces: `spendingPolicies` table, `dailySpendingLog` table (Drizzle table references)

- [ ] **Step 1: Write the failing test for policy schema exports**

```ts
import { describe, expect, it } from "vitest";
import { spendingPolicies, dailySpendingLog } from "../schema.js";

describe("spending policy schema", () => {
	it("exports spendingPolicies table with required columns", () => {
		expect(spendingPolicies).toBeDefined();
		const columns = Object.keys(spendingPolicies);
		expect(columns).toContain("id");
		expect(columns).toContain("accountId");
		expect(columns).toContain("dailyLimit");
		expect(columns).toContain("approvalThreshold");
		expect(columns).toContain("enabled");
	});

	it("exports dailySpendingLog table with required columns", () => {
		expect(dailySpendingLog).toBeDefined();
		const columns = Object.keys(dailySpendingLog);
		expect(columns).toContain("id");
		expect(columns).toContain("accountId");
		expect(columns).toContain("amount");
		expect(columns).toContain("spentAt");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test packages/core/src/db/__tests__/schema.test.ts`
Expected: FAIL — spendingPolicies not exported

- [ ] **Step 3: Extend schema with policy tables**

Add to `packages/core/src/db/schema.ts`:

```ts
export const spendingPolicies = pgTable("spending_policies", {
	id: varchar("id", { length: 26 }).primaryKey(),
	accountId: varchar("account_id", { length: 26 })
		.notNull()
		.references(() => accounts.id)
		.unique(),
	dailyLimit: numeric("daily_limit", { precision: 18, scale: 6 }),
	approvalThreshold: numeric("approval_threshold", { precision: 18, scale: 6 }),
	priceFloors: jsonb("price_floors").notNull().default([]),
	minimumBalances: jsonb("minimum_balances").notNull().default([]),
	fundingPriority: jsonb("funding_priority").notNull().default(["spending_power", "stablecoin_balance"]),
	enabled: boolean("enabled").notNull().default(true),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dailySpendingLog = pgTable("daily_spending_log", {
	id: varchar("id", { length: 26 }).primaryKey(),
	accountId: varchar("account_id", { length: 26 })
		.notNull()
		.references(() => accounts.id),
	amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
	paymentIntentId: varchar("payment_intent_id", { length: 26 }),
	spentAt: timestamp("spent_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test packages/core/src/db/__tests__/schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/db/schema.ts packages/core/src/db/__tests__/schema.test.ts
git commit -m "feat(core): add spending_policies and daily_spending_log db schema"
```

---

### Task 3: Policy CRUD Operations

**Files:**
- Modify: `packages/core/src/domain/spending-policy.ts` (add CRUD)
- Test: `packages/core/src/domain/__tests__/spending-policy.test.ts` (extend)

**Interfaces:**
- Consumes: `spendingPolicies` table from `db/schema.ts`, `ulid()`, DB client, `DEFAULT_POLICY` from `policy-defaults.ts`
- Produces: `getPolicy(db, accountId): Promise<SpendingPolicy>`, `updatePolicy(db, accountId, updates): Promise<SpendingPolicy>`, `createDefaultPolicy(db, accountId): Promise<SpendingPolicy>`

- [ ] **Step 1: Write the failing tests for CRUD**

```ts
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "../../db/schema.js";
import { createDefaultPolicy, getPolicy, updatePolicy } from "../spending-policy.js";

const testClient = postgres(process.env.TEST_DATABASE_URL!);
const db = drizzle(testClient, { schema });

afterAll(async () => {
	await testClient.end();
});

beforeEach(async () => {
	await db.delete(schema.spendingPolicies);
	await db.delete(schema.accounts);
	await db.insert(schema.accounts).values({
		id: "01JACCOUNT0000000000000",
		walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
		status: "active",
	});
});

describe("createDefaultPolicy", () => {
	it("creates a policy with default values", async () => {
		const result = await createDefaultPolicy(db, "01JACCOUNT0000000000000");
		expect(result.dailyLimit).toBe("500.000000");
		expect(result.approvalThreshold).toBe("100.000000");
		expect(result.enabled).toBe(true);
	});
});

describe("getPolicy", () => {
	it("returns null when no policy exists", async () => {
		const result = await getPolicy(db, "01JACCOUNT0000000000000");
		expect(result).toBeNull();
	});

	it("returns the policy after creation", async () => {
		await createDefaultPolicy(db, "01JACCOUNT0000000000000");
		const result = await getPolicy(db, "01JACCOUNT0000000000000");
		expect(result).not.toBeNull();
		expect(result!.dailyLimit).toBe("500.000000");
	});
});

describe("updatePolicy", () => {
	it("updates daily limit", async () => {
		await createDefaultPolicy(db, "01JACCOUNT0000000000000");
		const result = await updatePolicy(db, "01JACCOUNT0000000000000", {
			dailyLimit: 1000,
		});
		expect(result.dailyLimit).toBe("1000.000000");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test packages/core/src/domain/__tests__/spending-policy.test.ts`
Expected: FAIL — functions not exported

- [ ] **Step 3: Implement CRUD operations**

Add to `packages/core/src/domain/spending-policy.ts`:

```ts
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ulid } from "ulidx";
import { spendingPolicies } from "../db/schema.js";
import { DEFAULT_POLICY } from "./policy-defaults.js";

type Db = PostgresJsDatabase;

export async function createDefaultPolicy(db: Db, accountId: string) {
	const [row] = await db
		.insert(spendingPolicies)
		.values({
			id: ulid(),
			accountId,
			dailyLimit: DEFAULT_POLICY.dailyLimit.toFixed(6),
			approvalThreshold: DEFAULT_POLICY.approvalThreshold.toFixed(6),
			priceFloors: DEFAULT_POLICY.priceFloors,
			minimumBalances: DEFAULT_POLICY.minimumBalances,
			fundingPriority: DEFAULT_POLICY.fundingPriority,
			enabled: DEFAULT_POLICY.enabled,
		})
		.returning();

	return row!;
}

export async function getPolicy(db: Db, accountId: string) {
	const [row] = await db
		.select()
		.from(spendingPolicies)
		.where(eq(spendingPolicies.accountId, accountId));
	return row ?? null;
}

export async function updatePolicy(
	db: Db,
	accountId: string,
	updates: {
		dailyLimit?: number | null;
		approvalThreshold?: number | null;
		priceFloors?: PriceFloor[];
		minimumBalances?: MinimumBalance[];
		fundingPriority?: FundingSource[];
		enabled?: boolean;
	},
) {
	const setValues: Record<string, unknown> = { updatedAt: new Date() };

	if (updates.dailyLimit !== undefined) {
		setValues.dailyLimit = updates.dailyLimit?.toFixed(6) ?? null;
	}
	if (updates.approvalThreshold !== undefined) {
		setValues.approvalThreshold = updates.approvalThreshold?.toFixed(6) ?? null;
	}
	if (updates.priceFloors !== undefined) {
		setValues.priceFloors = updates.priceFloors;
	}
	if (updates.minimumBalances !== undefined) {
		setValues.minimumBalances = updates.minimumBalances;
	}
	if (updates.fundingPriority !== undefined) {
		setValues.fundingPriority = updates.fundingPriority;
	}
	if (updates.enabled !== undefined) {
		setValues.enabled = updates.enabled;
	}

	const [row] = await db
		.update(spendingPolicies)
		.set(setValues)
		.where(eq(spendingPolicies.accountId, accountId))
		.returning();

	return row!;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test packages/core/src/domain/__tests__/spending-policy.test.ts`
Expected: PASS — all 9 tests green (6 from Task 1 + 3 new)

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/spending-policy.ts packages/core/src/domain/__tests__/spending-policy.test.ts
git commit -m "feat(core): add spending policy CRUD operations"
```

---

### Task 4: Policy Evaluation Engine

**Files:**
- Modify: `packages/core/src/domain/spending-policy.ts` (add `evaluatePolicy`)
- Test: `packages/core/src/domain/__tests__/spending-policy.test.ts` (extend)

**Interfaces:**
- Consumes: `getPolicy`, `getDailySpending` (from this file), `getAssetPrice` from `spending-power.ts`
- Produces: `evaluatePolicy(params): Promise<PolicyCheckResult>`

- [ ] **Step 1: Write the failing tests for policy evaluation**

```ts
import { describe, expect, it } from "vitest";
import { evaluatePolicyRules } from "../spending-policy.js";
import type { PolicyCheckResult } from "../spending-policy.js";

describe("evaluatePolicyRules", () => {
	it("passes when amount is within daily limit", () => {
		const result = evaluatePolicyRules({
			amount: 50,
			dailyLimit: 500,
			dailySpent: 100,
			approvalThreshold: 100,
			priceFloors: [],
			minimumBalances: [],
			currentPrices: {},
			currentPositions: {},
		});

		expect(result.passed).toBe(true);
		expect(result.requiresApproval).toBe(false);
		expect(result.violations).toHaveLength(0);
	});

	it("fails when amount exceeds daily limit", () => {
		const result = evaluatePolicyRules({
			amount: 200,
			dailyLimit: 500,
			dailySpent: 400,
			approvalThreshold: 100,
			priceFloors: [],
			minimumBalances: [],
			currentPrices: {},
			currentPositions: {},
		});

		expect(result.passed).toBe(false);
		expect(result.violations).toHaveLength(1);
		expect(result.violations[0]!.rule).toBe("daily_limit");
	});

	it("requires approval when amount exceeds threshold", () => {
		const result = evaluatePolicyRules({
			amount: 150,
			dailyLimit: 500,
			dailySpent: 0,
			approvalThreshold: 100,
			priceFloors: [],
			minimumBalances: [],
			currentPrices: {},
			currentPositions: {},
		});

		expect(result.passed).toBe(true);
		expect(result.requiresApproval).toBe(true);
	});

	it("does not require approval when amount is below threshold", () => {
		const result = evaluatePolicyRules({
			amount: 50,
			dailyLimit: 500,
			dailySpent: 0,
			approvalThreshold: 100,
			priceFloors: [],
			minimumBalances: [],
			currentPrices: {},
			currentPositions: {},
		});

		expect(result.passed).toBe(true);
		expect(result.requiresApproval).toBe(false);
	});

	it("fails when asset price is below price floor", () => {
		const result = evaluatePolicyRules({
			amount: 50,
			dailyLimit: 500,
			dailySpent: 0,
			approvalThreshold: 100,
			priceFloors: [{ assetSymbol: "wSPYx", floorPrice: 600 }],
			minimumBalances: [],
			currentPrices: { wSPYx: 550 },
			currentPositions: {},
		});

		expect(result.passed).toBe(false);
		expect(result.violations).toHaveLength(1);
		expect(result.violations[0]!.rule).toBe("price_floor");
	});

	it("passes when asset price is above price floor", () => {
		const result = evaluatePolicyRules({
			amount: 50,
			dailyLimit: 500,
			dailySpent: 0,
			approvalThreshold: 100,
			priceFloors: [{ assetSymbol: "wSPYx", floorPrice: 500 }],
			minimumBalances: [],
			currentPrices: { wSPYx: 550 },
			currentPositions: {},
		});

		expect(result.passed).toBe(true);
	});

	it("passes with null daily limit (no limit)", () => {
		const result = evaluatePolicyRules({
			amount: 10000,
			dailyLimit: null,
			dailySpent: 50000,
			approvalThreshold: null,
			priceFloors: [],
			minimumBalances: [],
			currentPrices: {},
			currentPositions: {},
		});

		expect(result.passed).toBe(true);
		expect(result.requiresApproval).toBe(false);
	});

	it("collects multiple violations", () => {
		const result = evaluatePolicyRules({
			amount: 600,
			dailyLimit: 500,
			dailySpent: 100,
			approvalThreshold: 100,
			priceFloors: [{ assetSymbol: "wSPYx", floorPrice: 600 }],
			minimumBalances: [],
			currentPrices: { wSPYx: 550 },
			currentPositions: {},
		});

		expect(result.passed).toBe(false);
		expect(result.violations.length).toBeGreaterThanOrEqual(2);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test packages/core/src/domain/__tests__/spending-policy.test.ts`
Expected: FAIL — evaluatePolicyRules not exported

- [ ] **Step 3: Implement policy evaluation**

Add to `packages/core/src/domain/spending-policy.ts`:

```ts
export function evaluatePolicyRules(params: {
	amount: number;
	dailyLimit: number | null;
	dailySpent: number;
	approvalThreshold: number | null;
	priceFloors: PriceFloor[];
	minimumBalances: MinimumBalance[];
	currentPrices: Record<string, number>;
	currentPositions: Record<string, bigint>;
}): PolicyCheckResult {
	const violations: PolicyViolation[] = [];

	// Check daily limit
	if (params.dailyLimit !== null) {
		const projectedTotal = params.dailySpent + params.amount;
		if (projectedTotal > params.dailyLimit) {
			violations.push({
				rule: "daily_limit",
				message: `Payment of $${params.amount} would exceed daily limit of $${params.dailyLimit} (already spent $${params.dailySpent} today)`,
				currentValue: projectedTotal,
				threshold: params.dailyLimit,
			});
		}
	}

	// Check price floors
	for (const floor of params.priceFloors) {
		const currentPrice = params.currentPrices[floor.assetSymbol];
		if (currentPrice !== undefined && currentPrice < floor.floorPrice) {
			violations.push({
				rule: "price_floor",
				message: `${floor.assetSymbol} price ($${currentPrice}) is below floor ($${floor.floorPrice})`,
				currentValue: currentPrice,
				threshold: floor.floorPrice,
			});
		}
	}

	// Check minimum balances
	for (const min of params.minimumBalances) {
		const currentPosition = params.currentPositions[min.assetSymbol];
		if (currentPosition !== undefined && currentPosition < min.minimumAmount) {
			violations.push({
				rule: "minimum_balance",
				message: `${min.assetSymbol} balance would drop below minimum`,
				currentValue: Number(currentPosition),
				threshold: Number(min.minimumAmount),
			});
		}
	}

	const passed = violations.length === 0;

	// Check approval threshold
	const requiresApproval =
		passed &&
		params.approvalThreshold !== null &&
		params.amount > params.approvalThreshold;

	return { passed, requiresApproval, violations };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test packages/core/src/domain/__tests__/spending-policy.test.ts`
Expected: PASS — all 17 tests green (9 from Tasks 1+3, 8 new)

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/spending-policy.ts packages/core/src/domain/__tests__/spending-policy.test.ts
git commit -m "feat(core): add policy evaluation engine"
```

---

### Task 5: Daily Spending Tracking

**Files:**
- Modify: `packages/core/src/domain/spending-policy.ts` (add daily tracking functions)
- Test: `packages/core/src/domain/__tests__/spending-policy.test.ts` (extend)

**Interfaces:**
- Consumes: `dailySpendingLog` table from `db/schema.ts`, `ulid()`, DB client
- Produces: `getDailySpending(db, accountId): Promise<{ total: number; limit: number | null; remaining: number | null }>`, `recordSpending(db, accountId, amount, paymentIntentId?): Promise<void>`

- [ ] **Step 1: Write the failing test for daily spending**

```ts
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../db/schema.js";
import {
	createDefaultPolicy,
	getPolicy,
	recordSpending,
	getDailySpending,
} from "../spending-policy.js";

const testClient = postgres(process.env.TEST_DATABASE_URL!);
const db = drizzle(testClient, { schema });

afterAll(async () => {
	await testClient.end();
});

beforeEach(async () => {
	await db.delete(schema.dailySpendingLog);
	await db.delete(schema.spendingPolicies);
	await db.delete(schema.accounts);
	await db.insert(schema.accounts).values({
		id: "01JACCOUNT0000000000000",
		walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
		status: "active",
	});
	await createDefaultPolicy(db, "01JACCOUNT0000000000000");
});

describe("recordSpending", () => {
	it("inserts a spending log entry", async () => {
		await recordSpending(db, "01JACCOUNT0000000000000", 25);

		const rows = await db
			.select()
			.from(schema.dailySpendingLog);
		expect(rows).toHaveLength(1);
		expect(Number(rows[0]!.amount)).toBe(25);
	});
});

describe("getDailySpending", () => {
	it("returns zero when no spending today", async () => {
		const policy = await getPolicy(db, "01JACCOUNT0000000000000");

		const result = await getDailySpending(db, "01JACCOUNT0000000000000", policy!);

		expect(result.total).toBe(0);
		expect(result.limit).toBe(500);
		expect(result.remaining).toBe(500);
	});

	it("returns correct totals after spending", async () => {
		await recordSpending(db, "01JACCOUNT0000000000000", 100);
		await recordSpending(db, "01JACCOUNT0000000000000", 50);

		const policy = await getPolicy(db, "01JACCOUNT0000000000000");
		const result = await getDailySpending(db, "01JACCOUNT0000000000000", policy!);

		expect(result.total).toBe(150);
		expect(result.limit).toBe(500);
		expect(result.remaining).toBe(350);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test packages/core/src/domain/__tests__/spending-policy.test.ts`
Expected: FAIL — functions not exported

- [ ] **Step 3: Implement daily spending tracking**

Add to `packages/core/src/domain/spending-policy.ts`:

```ts
import { and, gte, sql } from "drizzle-orm";
import { dailySpendingLog } from "../db/schema.js";

export async function recordSpending(
	db: Db,
	accountId: string,
	amount: number,
	paymentIntentId?: string,
) {
	await db.insert(dailySpendingLog).values({
		id: ulid(),
		accountId,
		amount: amount.toFixed(6),
		paymentIntentId: paymentIntentId ?? null,
	});
}

export async function getDailySpending(
	db: Db,
	accountId: string,
	policy: { dailyLimit: string | null },
) {
	const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

	const rows = await db
		.select({ amount: dailySpendingLog.amount })
		.from(dailySpendingLog)
		.where(
			and(
				eq(dailySpendingLog.accountId, accountId),
				gte(dailySpendingLog.spentAt, twentyFourHoursAgo),
			),
		);

	const total = rows.reduce((sum, row) => sum + Number(row.amount), 0);
	const limit = policy.dailyLimit ? Number(policy.dailyLimit) : null;
	const remaining = limit !== null ? Math.max(0, limit - total) : null;

	return { total, limit, remaining };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test packages/core/src/domain/__tests__/spending-policy.test.ts`
Expected: PASS — all 19 tests green

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/spending-policy.ts packages/core/src/domain/__tests__/spending-policy.test.ts
git commit -m "feat(core): add daily spending tracking"
```

---

### Task 6: Policy API Routes

**Files:**
- Create: `apps/api/src/routes/policies.ts`
- Test: `apps/api/src/routes/__tests__/policies.test.ts`

**Interfaces:**
- Consumes: `getPolicy`, `updatePolicy`, `getDailySpending` from `packages/core`
- Produces: Hono route group mounted at `/accounts/:id/policies`

- [ ] **Step 1: Write the failing test for policy routes**

```ts
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Hono } from "hono";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@avela/core/db/schema";
import {
	createDefaultPolicy,
	getPolicy,
	updatePolicy,
	getDailySpending,
} from "@avela/core/domain/spending-policy";
import { policiesRoutes } from "../policies.js";

const testClient = postgres(process.env.TEST_DATABASE_URL!);
const db = drizzle(testClient, { schema });

afterAll(async () => {
	await testClient.end();
});

beforeEach(async () => {
	await db.delete(schema.dailySpendingLog);
	await db.delete(schema.spendingPolicies);
	await db.delete(schema.accounts);
	await db.insert(schema.accounts).values({
		id: "01JACCOUNT0000000000000",
		walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
		status: "active",
	});
	await createDefaultPolicy(db, "01JACCOUNT0000000000000");
});

function buildApp() {
	const app = new Hono();
	app.route(
		"/accounts/:accountId/policies",
		policiesRoutes({
			getPolicy: (accountId: string) => getPolicy(db, accountId),
			updatePolicy: (accountId: string, updates: Record<string, unknown>) =>
				updatePolicy(db, accountId, updates),
			getDailySpending: (accountId: string, policy: { dailyLimit: string | null }) =>
				getDailySpending(db, accountId, policy),
		}),
	);
	return app;
}

describe("GET /accounts/:id/policies", () => {
	it("returns policy with 200", async () => {
		const app = buildApp();
		const res = await app.request("/accounts/01JACCOUNT0000000000000/policies");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.policy.dailyLimit).toBe("500.000000");
		expect(body.data.dailySpending.remaining).toBe(500);
	});

	it("returns 404 when no policy exists", async () => {
		const app = buildApp();
		const res = await app.request("/accounts/01JNOTFOUND0000000000000/policies");
		expect(res.status).toBe(404);
	});
});

describe("PUT /accounts/:id/policies", () => {
	it("updates policy and returns 200", async () => {
		const app = buildApp();
		const res = await app.request("/accounts/01JACCOUNT0000000000000/policies", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ dailyLimit: 1000, approvalThreshold: 200 }),
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.dailyLimit).toBe("1000.000000");
	});

	it("returns 400 for invalid input", async () => {
		const app = buildApp();
		const res = await app.request("/accounts/01JACCOUNT0000000000000/policies", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ dailyLimit: -100 }),
		});

		expect(res.status).toBe(400);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test apps/api/src/routes/__tests__/policies.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement policy routes**

```ts
// apps/api/src/routes/policies.ts

import { Hono } from "hono";
import { z } from "zod";

const updatePolicySchema = z.object({
	dailyLimit: z.number().positive().nullable().optional(),
	approvalThreshold: z.number().positive().nullable().optional(),
	priceFloors: z
		.array(
			z.object({
				assetSymbol: z.string(),
				floorPrice: z.number().positive(),
			}),
		)
		.optional(),
	minimumBalances: z
		.array(
			z.object({
				assetSymbol: z.string(),
				minimumAmount: z.string(),
			}),
		)
		.optional(),
	fundingPriority: z
		.array(z.enum(["spending_power", "stablecoin_balance"]))
		.min(1)
		.optional(),
	enabled: z.boolean().optional(),
});

type PolicyDeps = {
	getPolicy: (accountId: string) => Promise<unknown | null>;
	updatePolicy: (accountId: string, updates: unknown) => Promise<unknown>;
	getDailySpending: (
		accountId: string,
		policy: unknown,
	) => Promise<{ total: number; limit: number | null; remaining: number | null }>;
};

export function policiesRoutes(deps: PolicyDeps) {
	const app = new Hono();

	app.get("/", async (c) => {
		const accountId = c.req.param("accountId");
		const policy = await deps.getPolicy(accountId);

		if (!policy) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: "No policy found for this account" } },
				404,
			);
		}

		const dailySpending = await deps.getDailySpending(accountId, policy);
		return c.json({ data: { policy, dailySpending } });
	});

	app.put("/", async (c) => {
		const accountId = c.req.param("accountId");
		const body = await c.req.json();
		const parsed = updatePolicySchema.safeParse(body);

		if (!parsed.success) {
			return c.json(
				{
					error: {
						code: "VALIDATION_ERROR",
						message: "Invalid policy update",
						details: parsed.error.flatten(),
					},
				},
				400,
			);
		}

		const updated = await deps.updatePolicy(accountId, parsed.data);
		return c.json({ data: updated });
	});

	return app;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test apps/api/src/routes/__tests__/policies.test.ts`
Expected: PASS — all 4 tests green

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/policies.ts apps/api/src/routes/__tests__/policies.test.ts
git commit -m "feat(api): add spending policy API routes"
```
