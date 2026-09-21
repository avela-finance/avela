# Funding Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the payment intent lifecycle, funding source selection, Uniswap V3 swap execution, and settlement proof — turning "Pay with Avela" into a settled onchain payment.

**Architecture:** Payment intents flow through a state machine (created → policy_check → awaiting_approval → funding → executing → settling → settled | failed | rejected). The Funding Engine selects the best funding source under policy (spending power first, stablecoin fallback), picks the asset with the deepest pool, executes a Uniswap V3 swap on X Layer, and records settlement proof. Each payment generates a receipt with full audit trail.

**Tech Stack:** Drizzle ORM (Postgres), Zod, ulidx, viem (X Layer RPC + contract calls), Hono (API routes), Vitest

## Global Constraints

- All entity IDs are ULIDs via `ulidx`
- Biome formatting: tabs, double quotes, semicolons, trailing commas
- TypeScript strict mode, ESNext modules
- Test with Vitest: `bun run test`
- Lint with Biome: `bun run check`
- X Layer chain ID: 196, RPC: `https://rpc.xlayer.tech`
- Avela never silently sells stocks — payment fails if spending power insufficient
- Both USDG and USDC supported, routed per-asset by pool depth
- No mocks — real Drizzle DB for tests, typed interfaces for adapters. No `as any`, `as never`, or `as unknown`.
- Tests require `TEST_DATABASE_URL` env var pointing to a Postgres database. Run migrations before tests.

---

### Task 1: Payment Intent Types and State Machine

**Files:**
- Create: `packages/core/src/domain/payment-intent.ts`
- Test: `packages/core/src/domain/__tests__/payment-intent.test.ts`

**Interfaces:**
- Consumes: Nothing (foundational types)
- Produces: `PaymentStatus`, `PaymentIntent`, `FundingDecision`, `Settlement`, `Receipt`, `transitionStatus(current, next): PaymentStatus`, `isTerminalStatus(status): boolean`

- [ ] **Step 1: Write the failing test for state machine transitions**

```ts
import { describe, expect, it } from "vitest";
import { isTerminalStatus, transitionStatus } from "../payment-intent.js";

describe("payment intent state machine", () => {
	it("transitions from created to policy_check", () => {
		expect(transitionStatus("created", "policy_check")).toBe("policy_check");
	});

	it("transitions from policy_check to awaiting_approval", () => {
		expect(transitionStatus("policy_check", "awaiting_approval")).toBe("awaiting_approval");
	});

	it("transitions from policy_check to funding (auto-approved)", () => {
		expect(transitionStatus("policy_check", "funding")).toBe("funding");
	});

	it("transitions from awaiting_approval to funding", () => {
		expect(transitionStatus("awaiting_approval", "funding")).toBe("funding");
	});

	it("transitions from awaiting_approval to rejected", () => {
		expect(transitionStatus("awaiting_approval", "rejected")).toBe("rejected");
	});

	it("transitions from funding to executing", () => {
		expect(transitionStatus("funding", "executing")).toBe("executing");
	});

	it("transitions from executing to settling", () => {
		expect(transitionStatus("executing", "settling")).toBe("settling");
	});

	it("transitions from settling to settled", () => {
		expect(transitionStatus("settling", "settled")).toBe("settled");
	});

	it("transitions to failed from any non-terminal state", () => {
		expect(transitionStatus("funding", "failed")).toBe("failed");
		expect(transitionStatus("executing", "failed")).toBe("failed");
	});

	it("rejects invalid transitions", () => {
		expect(() => transitionStatus("created", "settled")).toThrow("Invalid transition");
		expect(() => transitionStatus("settled", "created")).toThrow("Invalid transition");
	});

	it("identifies terminal statuses", () => {
		expect(isTerminalStatus("settled")).toBe(true);
		expect(isTerminalStatus("failed")).toBe(true);
		expect(isTerminalStatus("rejected")).toBe(true);
		expect(isTerminalStatus("created")).toBe(false);
		expect(isTerminalStatus("executing")).toBe(false);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test packages/core/src/domain/__tests__/payment-intent.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write types and state machine implementation**

```ts
// packages/core/src/domain/payment-intent.ts

export const PAYMENT_STATUSES = [
	"created",
	"policy_check",
	"awaiting_approval",
	"funding",
	"executing",
	"settling",
	"settled",
	"failed",
	"rejected",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type FundingDecision = {
	source: "spending_power" | "stablecoin_balance";
	asset: string | null;
	amountIn: bigint;
	amountOutMin: bigint;
	pool: string;
	stablecoin: "USDG" | "USDC";
	conversionHop: boolean;
	estimatedSlippage: number;
	decidedAt: Date;
};

export type Settlement = {
	txHash: string;
	blockNumber: number;
	amountSettled: bigint;
	stablecoin: "USDG" | "USDC";
	gasUsed: bigint;
	settledAt: Date;
};

export type PaymentIntent = {
	id: string;
	accountId: string;
	amount: number;
	recipientAddress: string;
	recipientUsername: string | null;
	settlementCurrency: "USDG" | "USDC";
	status: PaymentStatus;
	fundingDecision: FundingDecision | null;
	settlement: Settlement | null;
	createdAt: Date;
	updatedAt: Date;
};

export type Receipt = {
	paymentId: string;
	accountId: string;
	amount: number;
	sourceAsset: string;
	fundingSource: string;
	settlementTxHash: string;
	settlementStablecoin: string;
	recipientAddress: string;
	timestamp: Date;
};

const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
	created: ["policy_check", "failed"],
	policy_check: ["awaiting_approval", "funding", "failed"],
	awaiting_approval: ["funding", "rejected", "failed"],
	funding: ["executing", "failed"],
	executing: ["settling", "failed"],
	settling: ["settled", "failed"],
	settled: [],
	failed: [],
	rejected: [],
};

export function transitionStatus(current: PaymentStatus, next: PaymentStatus): PaymentStatus {
	const allowed = VALID_TRANSITIONS[current];
	if (!allowed.includes(next)) {
		throw new Error(`Invalid transition: ${current} → ${next}`);
	}
	return next;
}

export function isTerminalStatus(status: PaymentStatus): boolean {
	return status === "settled" || status === "failed" || status === "rejected";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test packages/core/src/domain/__tests__/payment-intent.test.ts`
Expected: PASS — all 11 tests green

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/payment-intent.ts packages/core/src/domain/__tests__/payment-intent.test.ts
git commit -m "feat(core): add payment intent types and state machine"
```

---

### Task 2: Payment Intent DB Schema

**Files:**
- Modify: `packages/core/src/db/schema.ts` (add payment_intents, settlements tables)
- Test: `packages/core/src/db/__tests__/schema.test.ts`

**Interfaces:**
- Consumes: `PaymentStatus` from `payment-intent.ts`, `accounts` table from core-account schema
- Produces: `paymentIntents` table, `settlements` table (Drizzle table references for queries)

- [ ] **Step 1: Write the failing test for schema exports**

```ts
import { describe, expect, it } from "vitest";
import { paymentIntents, settlements } from "../schema.js";

describe("payment intent schema", () => {
	it("exports paymentIntents table with required columns", () => {
		expect(paymentIntents).toBeDefined();
		const columns = Object.keys(paymentIntents);
		expect(columns).toContain("id");
		expect(columns).toContain("accountId");
		expect(columns).toContain("amount");
		expect(columns).toContain("recipientAddress");
		expect(columns).toContain("status");
	});

	it("exports settlements table with required columns", () => {
		expect(settlements).toBeDefined();
		const columns = Object.keys(settlements);
		expect(columns).toContain("paymentIntentId");
		expect(columns).toContain("txHash");
		expect(columns).toContain("blockNumber");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test packages/core/src/db/__tests__/schema.test.ts`
Expected: FAIL — paymentIntents not exported

- [ ] **Step 3: Extend schema with payment tables**

Add to `packages/core/src/db/schema.ts`:

```ts
import {
	bigint,
	boolean,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const paymentStatusEnum = pgEnum("payment_status", [
	"created",
	"policy_check",
	"awaiting_approval",
	"funding",
	"executing",
	"settling",
	"settled",
	"failed",
	"rejected",
]);

export const paymentIntents = pgTable("payment_intents", {
	id: varchar("id", { length: 26 }).primaryKey(),
	accountId: varchar("account_id", { length: 26 }).notNull().references(() => accounts.id),
	amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
	recipientAddress: varchar("recipient_address", { length: 42 }).notNull(),
	recipientUsername: varchar("recipient_username", { length: 32 }),
	settlementCurrency: varchar("settlement_currency", { length: 10 }).notNull(),
	status: paymentStatusEnum("status").notNull().default("created"),
	fundingDecision: jsonb("funding_decision"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settlements = pgTable("settlements", {
	id: varchar("id", { length: 26 }).primaryKey(),
	paymentIntentId: varchar("payment_intent_id", { length: 26 })
		.notNull()
		.references(() => paymentIntents.id)
		.unique(),
	txHash: varchar("tx_hash", { length: 66 }).notNull(),
	blockNumber: integer("block_number").notNull(),
	amountSettled: varchar("amount_settled", { length: 78 }).notNull(),
	stablecoin: varchar("stablecoin", { length: 10 }).notNull(),
	gasUsed: varchar("gas_used", { length: 78 }).notNull(),
	settledAt: timestamp("settled_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test packages/core/src/db/__tests__/schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/db/schema.ts packages/core/src/db/__tests__/schema.test.ts
git commit -m "feat(core): add payment_intents and settlements db schema"
```

---

### Task 3: Payment Intent CRUD Operations

**Files:**
- Modify: `packages/core/src/domain/payment-intent.ts` (add CRUD functions)
- Test: `packages/core/src/domain/__tests__/payment-intent.test.ts` (extend)

**Interfaces:**
- Consumes: `paymentIntents` table from `db/schema.ts`, `ulid()` from `ulidx`, DB client from `db/client.ts`
- Produces: `createPaymentIntent(db, params): Promise<PaymentIntent>`, `getPaymentIntent(db, id): Promise<PaymentIntent | null>`, `getPaymentHistory(db, accountId, limit?): Promise<PaymentIntent[]>`, `updatePaymentStatus(db, id, status, fundingDecision?): Promise<PaymentIntent>`

- [ ] **Step 1: Write the failing tests for CRUD operations**

```ts
import { afterAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../db/schema.js";
import {
	createPaymentIntent,
	getPaymentHistory,
	getPaymentIntent,
	updatePaymentStatus,
} from "../payment-intent.js";

const testClient = postgres(process.env.TEST_DATABASE_URL!);
const db = drizzle(testClient, { schema });

afterAll(async () => {
	await testClient.end();
});

describe("createPaymentIntent", () => {
	it("creates a payment intent with ULID id and 'created' status", async () => {
		const result = await createPaymentIntent(db, {
			accountId: "01JACCOUNT0000000000000",
			amount: 25,
			recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
		});

		expect(result.status).toBe("created");
		expect(result.amount).toBe("25.000000");
		expect(result.fundingDecision).toBeNull();
		expect(result.id).toMatch(/^[0-9A-Z]{26}$/i);
	});
});

describe("getPaymentIntent", () => {
	it("returns null when payment not found", async () => {
		const result = await getPaymentIntent(db, "01JNOTFOUND00000000000000");
		expect(result).toBeNull();
	});
});

describe("updatePaymentStatus", () => {
	it("throws on invalid state transition", async () => {
		const intent = await createPaymentIntent(db, {
			accountId: "01JACCOUNT0000000000000",
			amount: 10,
			recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
		});

		// Transition to settled through valid path
		await updatePaymentStatus(db, intent.id, "policy_check");
		await updatePaymentStatus(db, intent.id, "funding");
		await updatePaymentStatus(db, intent.id, "executing");
		await updatePaymentStatus(db, intent.id, "settling");
		await updatePaymentStatus(db, intent.id, "settled");

		await expect(
			updatePaymentStatus(db, intent.id, "created"),
		).rejects.toThrow("Invalid transition");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test packages/core/src/domain/__tests__/payment-intent.test.ts`
Expected: FAIL — functions not exported

- [ ] **Step 3: Implement CRUD operations**

Add to `packages/core/src/domain/payment-intent.ts`:

```ts
import { eq, desc } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ulid } from "ulidx";
import { paymentIntents } from "../db/schema.js";
import type * as schema from "../db/schema.js";

type Db = PostgresJsDatabase<typeof schema>;

export async function createPaymentIntent(
	db: Db,
	params: {
		accountId: string;
		amount: number;
		recipientAddress: string;
		recipientUsername?: string;
		settlementCurrency?: "USDG" | "USDC";
	},
) {
	const id = ulid();
	const [row] = await db
		.insert(paymentIntents)
		.values({
			id,
			accountId: params.accountId,
			amount: params.amount.toFixed(6),
			recipientAddress: params.recipientAddress,
			recipientUsername: params.recipientUsername ?? null,
			settlementCurrency: params.settlementCurrency ?? "USDG",
			status: "created",
		})
		.returning();

	return row!;
}

export async function getPaymentIntent(db: Db, id: string) {
	const [row] = await db.select().from(paymentIntents).where(eq(paymentIntents.id, id));
	return row ?? null;
}

export async function getPaymentHistory(db: Db, accountId: string, limit = 20) {
	return db
		.select()
		.from(paymentIntents)
		.where(eq(paymentIntents.accountId, accountId))
		.orderBy(desc(paymentIntents.createdAt))
		.limit(limit);
}

export async function updatePaymentStatus(
	db: Db,
	id: string,
	nextStatus: PaymentStatus,
	fundingDecision?: FundingDecision,
) {
	const [current] = await db
		.select({ status: paymentIntents.status })
		.from(paymentIntents)
		.where(eq(paymentIntents.id, id));

	if (!current) {
		throw new Error(`Payment intent not found: ${id}`);
	}

	transitionStatus(current.status as PaymentStatus, nextStatus);

	const updates: Record<string, unknown> = {
		status: nextStatus,
		updatedAt: new Date(),
	};
	if (fundingDecision) {
		updates.fundingDecision = fundingDecision;
	}

	const [row] = await db
		.update(paymentIntents)
		.set(updates)
		.where(eq(paymentIntents.id, id))
		.returning();

	return row!;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test packages/core/src/domain/__tests__/payment-intent.test.ts`
Expected: PASS — all tests green

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/payment-intent.ts packages/core/src/domain/__tests__/payment-intent.test.ts
git commit -m "feat(core): add payment intent CRUD operations"
```

---

### Task 4: Funding Source Selection

**Files:**
- Create: `packages/core/src/domain/funding-engine.ts`
- Test: `packages/core/src/domain/__tests__/funding-engine.test.ts`

**Interfaces:**
- Consumes: `calculateSpendingPower(accountId)` from `spending-power.ts`, `getAsset(symbol)` from `asset.ts`, `PaymentIntent` and `FundingDecision` from `payment-intent.ts`
- Produces: `selectFundingSource(params): Promise<FundingDecision>`

- [ ] **Step 1: Write the failing test for funding source selection**

```ts
import { describe, expect, it } from "vitest";
import { selectFundingSource } from "../funding-engine.js";
import type { SpendingPower } from "../spending-power.js";

const MOCK_SPENDING_POWER: SpendingPower = {
	accountId: "01JACCOUNT0000000000000",
	perAsset: [
		{
			assetSymbol: "wSPYx",
			positionValue: 1400,
			haircut: 0.5,
			spendingPower: 700,
		},
		{
			assetSymbol: "wQQQx",
			positionValue: 920,
			haircut: 0.5,
			spendingPower: 460,
		},
		{
			assetSymbol: "wNVDAx",
			positionValue: 880,
			haircut: 0.5,
			spendingPower: 440,
		},
	],
	stablecoinBalance: 100,
	totalSpendingPower: 1700,
	calculatedAt: new Date(),
};

describe("selectFundingSource", () => {
	it("selects spending power first, picking asset with deepest pool", () => {
		const result = selectFundingSource({
			amount: 25,
			spendingPower: MOCK_SPENDING_POWER,
			fundingPriority: ["spending_power", "stablecoin_balance"],
		});

		expect(result.source).toBe("spending_power");
		expect(result.asset).toBe("wSPYx");
		expect(result.stablecoin).toBe("USDG");
		expect(result.conversionHop).toBe(false);
	});

	it("falls back to stablecoin balance when spending power insufficient", () => {
		const lowSpendingPower: SpendingPower = {
			...MOCK_SPENDING_POWER,
			perAsset: MOCK_SPENDING_POWER.perAsset.map((a) => ({
				...a,
				spendingPower: 5,
			})),
			stablecoinBalance: 100,
			totalSpendingPower: 115,
		};

		const result = selectFundingSource({
			amount: 25,
			spendingPower: lowSpendingPower,
			fundingPriority: ["spending_power", "stablecoin_balance"],
		});

		expect(result.source).toBe("stablecoin_balance");
		expect(result.asset).toBeNull();
	});

	it("throws when neither source covers the amount", () => {
		const emptyPower: SpendingPower = {
			...MOCK_SPENDING_POWER,
			perAsset: [],
			stablecoinBalance: 0,
			totalSpendingPower: 0,
		};

		expect(() =>
			selectFundingSource({
				amount: 25,
				spendingPower: emptyPower,
				fundingPriority: ["spending_power", "stablecoin_balance"],
			}),
		).toThrow("Insufficient funds");
	});

	it("adds conversion hop when settlement currency differs from pool stablecoin", () => {
		const result = selectFundingSource({
			amount: 25,
			spendingPower: MOCK_SPENDING_POWER,
			fundingPriority: ["spending_power", "stablecoin_balance"],
			requiredSettlementCurrency: "USDC",
		});

		expect(result.source).toBe("spending_power");
		expect(result.asset).toBe("wSPYx");
		expect(result.stablecoin).toBe("USDG");
		expect(result.conversionHop).toBe(true);
	});

	it("prefers asset whose pool already matches settlement currency", () => {
		const result = selectFundingSource({
			amount: 25,
			spendingPower: MOCK_SPENDING_POWER,
			fundingPriority: ["spending_power", "stablecoin_balance"],
			requiredSettlementCurrency: "USDC",
			preferDirectSettlement: true,
		});

		expect(result.asset).toBe("wQQQx");
		expect(result.stablecoin).toBe("USDC");
		expect(result.conversionHop).toBe(false);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test packages/core/src/domain/__tests__/funding-engine.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement funding source selection**

```ts
// packages/core/src/domain/funding-engine.ts

import type { FundingDecision } from "./payment-intent.js";
import type { SpendingPower } from "./spending-power.js";

type FundingSource = "spending_power" | "stablecoin_balance";

const ASSET_POOL_CONFIG: Record<string, { stablecoin: "USDG" | "USDC"; liquidityUsd: number }> = {
	wSPYx: { stablecoin: "USDG", liquidityUsd: 1_890_000 },
	wQQQx: { stablecoin: "USDC", liquidityUsd: 738_000 },
	wNVDAx: { stablecoin: "USDG", liquidityUsd: 623_000 },
};

export function selectFundingSource(params: {
	amount: number;
	spendingPower: SpendingPower;
	fundingPriority: FundingSource[];
	requiredSettlementCurrency?: "USDG" | "USDC";
	preferDirectSettlement?: boolean;
}): FundingDecision {
	const { amount, spendingPower, fundingPriority, requiredSettlementCurrency, preferDirectSettlement } = params;

	for (const source of fundingPriority) {
		if (source === "spending_power") {
			const eligible = spendingPower.perAsset
				.filter((a) => a.spendingPower >= amount)
				.filter((a) => ASSET_POOL_CONFIG[a.assetSymbol] !== undefined);

			if (eligible.length === 0) continue;

			let selected;
			if (preferDirectSettlement && requiredSettlementCurrency) {
				const directMatch = eligible.find(
					(a) => ASSET_POOL_CONFIG[a.assetSymbol]!.stablecoin === requiredSettlementCurrency,
				);
				selected = directMatch ?? eligible[0]!;
			} else {
				selected = eligible.sort(
					(a, b) =>
						(ASSET_POOL_CONFIG[b.assetSymbol]?.liquidityUsd ?? 0) -
						(ASSET_POOL_CONFIG[a.assetSymbol]?.liquidityUsd ?? 0),
				)[0]!;
			}

			const poolConfig = ASSET_POOL_CONFIG[selected.assetSymbol]!;
			const needsHop =
				requiredSettlementCurrency !== undefined &&
				poolConfig.stablecoin !== requiredSettlementCurrency;

			return {
				source: "spending_power",
				asset: selected.assetSymbol,
				amountIn: 0n,
				amountOutMin: 0n,
				pool: selected.assetSymbol,
				stablecoin: poolConfig.stablecoin,
				conversionHop: needsHop,
				estimatedSlippage: 0,
				decidedAt: new Date(),
			};
		}

		if (source === "stablecoin_balance") {
			if (spendingPower.stablecoinBalance >= amount) {
				return {
					source: "stablecoin_balance",
					asset: null,
					amountIn: 0n,
					amountOutMin: 0n,
					pool: "",
					stablecoin: requiredSettlementCurrency ?? "USDC",
					conversionHop: false,
					estimatedSlippage: 0,
					decidedAt: new Date(),
				};
			}
		}
	}

	throw new Error("Insufficient funds: neither spending power nor stablecoin balance covers the payment");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test packages/core/src/domain/__tests__/funding-engine.test.ts`
Expected: PASS — all 5 tests green

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/funding-engine.ts packages/core/src/domain/__tests__/funding-engine.test.ts
git commit -m "feat(core): add funding source selection logic"
```

---

### Task 5: Swap Adapter Interface and Uniswap V3 Implementation

**Files:**
- Create: `packages/core/src/adapters/swap.ts`
- Create: `packages/core/src/adapters/uniswap-v3.ts`
- Test: `packages/core/src/adapters/__tests__/swap.test.ts`

**Interfaces:**
- Consumes: viem `PublicClient` and `WalletClient` for X Layer
- Produces: `SwapAdapter` interface, `UniswapV3SwapAdapter` class, `createUniswapV3Adapter(publicClient, walletClient): SwapAdapter`

- [ ] **Step 1: Write the failing test for swap adapter interface**

```ts
import { describe, expect, it } from "vitest";
import type { SwapAdapter, SwapQuote } from "../swap.js";

describe("SwapAdapter interface", () => {
	it("quote returns expected shape", async () => {
		const testAdapter: SwapAdapter = {
			quote: async () => ({
				amountOut: 25000000n,
				priceImpact: 0.001,
				route: ["0xTOKEN_IN", "0xTOKEN_OUT"],
			}),
			execute: async () => ({
				txHash: "0xabc123",
				blockNumber: 1000,
				amountOut: 25000000n,
				gasUsed: 150000n,
			}),
		};

		const result = await testAdapter.quote({
			tokenIn: "0xe7e553cd128f0011777323a0b44a7b96ea1cb540",
			tokenOut: "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
			amountIn: 45000000000000000n,
			chainId: 196,
		});

		expect(result.amountOut).toBe(25000000n);
		expect(result.priceImpact).toBeLessThan(0.01);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test packages/core/src/adapters/__tests__/swap.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write swap adapter interface**

```ts
// packages/core/src/adapters/swap.ts

export type SwapQuoteParams = {
	tokenIn: string;
	tokenOut: string;
	amountIn: bigint;
	chainId: number;
};

export type SwapQuote = {
	amountOut: bigint;
	priceImpact: number;
	route: string[];
};

export type SwapExecuteParams = {
	tokenIn: string;
	tokenOut: string;
	amountIn: bigint;
	amountOutMin: bigint;
	recipient: string;
	chainId: number;
};

export type SwapResult = {
	txHash: string;
	blockNumber: number;
	amountOut: bigint;
	gasUsed: bigint;
};

export interface SwapAdapter {
	quote(params: SwapQuoteParams): Promise<SwapQuote>;
	execute(params: SwapExecuteParams): Promise<SwapResult>;
}
```

- [ ] **Step 4: Write Uniswap V3 adapter implementation**

```ts
// packages/core/src/adapters/uniswap-v3.ts

import type { PublicClient, WalletClient } from "viem";
import type { SwapAdapter, SwapExecuteParams, SwapQuoteParams, SwapQuote, SwapResult } from "./swap.js";

const UNISWAP_V3_QUOTER_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6" as const;
const UNISWAP_V3_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564" as const;

const QUOTER_ABI = [
	{
		inputs: [
			{ name: "tokenIn", type: "address" },
			{ name: "tokenOut", type: "address" },
			{ name: "fee", type: "uint24" },
			{ name: "amountIn", type: "uint256" },
			{ name: "sqrtPriceLimitX96", type: "uint160" },
		],
		name: "quoteExactInputSingle",
		outputs: [{ name: "amountOut", type: "uint256" }],
		stateMutability: "nonpayable",
		type: "function",
	},
] as const;

const ROUTER_ABI = [
	{
		inputs: [
			{
				components: [
					{ name: "tokenIn", type: "address" },
					{ name: "tokenOut", type: "address" },
					{ name: "fee", type: "uint24" },
					{ name: "recipient", type: "address" },
					{ name: "deadline", type: "uint256" },
					{ name: "amountIn", type: "uint256" },
					{ name: "amountOutMinimum", type: "uint256" },
					{ name: "sqrtPriceLimitX96", type: "uint160" },
				],
				name: "params",
				type: "tuple",
			},
		],
		name: "exactInputSingle",
		outputs: [{ name: "amountOut", type: "uint256" }],
		stateMutability: "payable",
		type: "function",
	},
] as const;

const DEFAULT_FEE = 3000; // 0.3% fee tier
const DEFAULT_SLIPPAGE_BPS = 100; // 1%
const DEADLINE_SECONDS = 300; // 5 minutes

export class UniswapV3SwapAdapter implements SwapAdapter {
	constructor(
		private publicClient: PublicClient,
		private walletClient: WalletClient,
	) {}

	async quote(params: SwapQuoteParams): Promise<SwapQuote> {
		const amountOut = await this.publicClient.readContract({
			address: UNISWAP_V3_QUOTER_ADDRESS,
			abi: QUOTER_ABI,
			functionName: "quoteExactInputSingle",
			args: [
				params.tokenIn as `0x${string}`,
				params.tokenOut as `0x${string}`,
				DEFAULT_FEE,
				params.amountIn,
				0n,
			],
		});

		const priceImpact = Number(params.amountIn - amountOut) / Number(params.amountIn);

		return {
			amountOut,
			priceImpact: Math.abs(priceImpact),
			route: [params.tokenIn, params.tokenOut],
		};
	}

	async execute(params: SwapExecuteParams): Promise<SwapResult> {
		const deadline = BigInt(Math.floor(Date.now() / 1000) + DEADLINE_SECONDS);
		const account = this.walletClient.account;
		if (!account) {
			throw new Error("Wallet client has no account");
		}

		const hash = await this.walletClient.writeContract({
			address: UNISWAP_V3_ROUTER_ADDRESS,
			abi: ROUTER_ABI,
			functionName: "exactInputSingle",
			args: [
				{
					tokenIn: params.tokenIn as `0x${string}`,
					tokenOut: params.tokenOut as `0x${string}`,
					fee: DEFAULT_FEE,
					recipient: params.recipient as `0x${string}`,
					deadline,
					amountIn: params.amountIn,
					amountOutMinimum: params.amountOutMin,
					sqrtPriceLimitX96: 0n,
				},
			],
			account,
			chain: null,
		});

		const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

		return {
			txHash: hash,
			blockNumber: Number(receipt.blockNumber),
			amountOut: params.amountIn,
			gasUsed: receipt.gasUsed,
		};
	}
}

export function createUniswapV3Adapter(
	publicClient: PublicClient,
	walletClient: WalletClient,
): SwapAdapter {
	return new UniswapV3SwapAdapter(publicClient, walletClient);
}

export function calculateAmountOutMin(amountOut: bigint, slippageBps = DEFAULT_SLIPPAGE_BPS): bigint {
	return amountOut - (amountOut * BigInt(slippageBps)) / 10000n;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun run test packages/core/src/adapters/__tests__/swap.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/adapters/swap.ts packages/core/src/adapters/uniswap-v3.ts packages/core/src/adapters/__tests__/swap.test.ts
git commit -m "feat(core): add swap adapter interface and Uniswap V3 implementation"
```

---

### Task 6: Payment Execution Orchestrator

**Files:**
- Modify: `packages/core/src/domain/funding-engine.ts` (add `executePayment`)
- Test: `packages/core/src/domain/__tests__/funding-engine.test.ts` (extend)

**Interfaces:**
- Consumes: `updatePaymentStatus` from `payment-intent.ts`, `selectFundingSource` from this file, `evaluatePolicy` from `spending-policy.ts`, `SwapAdapter` from `adapters/swap.ts`, `calculateSpendingPower` from `spending-power.ts`
- Produces: `executePayment(deps, intentId): Promise<PaymentIntent>`

- [ ] **Step 1: Write the failing test for executePayment**

```ts
import { afterAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../db/schema.js";
import { executePayment } from "../funding-engine.js";
import type { ExecutePaymentDeps } from "../funding-engine.js";
import type { PaymentIntent } from "../types.js";
import type { SpendingPower } from "../spending-power.js";

const testClient = postgres(process.env.TEST_DATABASE_URL!);
const db = drizzle(testClient, { schema });

afterAll(async () => {
	await testClient.end();
});

let callLog: string[] = [];

function buildDeps(overrides: Partial<ExecutePaymentDeps> = {}): ExecutePaymentDeps {
	callLog = [];
	return {
		db,
		getPaymentIntent: async (_db, _id) => {
			callLog.push("getPaymentIntent");
			return {
				id: "01JTEST000000000000000000",
				accountId: "01JACCOUNT0000000000000",
				amount: 25,
				recipientAddress: "0xMERCHANT",
				status: "created",
			} as PaymentIntent;
		},
		updatePaymentStatus: async (_db, _id, status) => {
			callLog.push(`updatePaymentStatus:${status}`);
			return { status } as PaymentIntent;
		},
		evaluatePolicy: async () => {
			callLog.push("evaluatePolicy");
			return { passed: true, requiresApproval: false, violations: [] };
		},
		calculateSpendingPower: async () => {
			callLog.push("calculateSpendingPower");
			return {
				accountId: "01JACCOUNT0000000000000",
				perAsset: [
					{ assetSymbol: "wSPYx", positionValue: 1400, haircut: 0.5, spendingPower: 700 },
				],
				stablecoinBalance: 100,
				totalSpendingPower: 800,
				calculatedAt: new Date(),
			};
		},
		swapAdapter: {
			quote: async () => {
				callLog.push("swapAdapter.quote");
				return {
					amountOut: 25000000n,
					priceImpact: 0.001,
					route: ["0xWTOKEN", "0xSTABLE"],
				};
			},
			execute: async () => {
				callLog.push("swapAdapter.execute");
				return {
					txHash: "0xabc123",
					blockNumber: 1000,
					amountOut: 25000000n,
					gasUsed: 150000n,
				};
			},
		},
		recordSettlement: async () => {
			callLog.push("recordSettlement");
			return { txHash: "0xabc123", blockNumber: 1000 };
		},
		getAsset: () => ({
			symbol: "wSPYx",
			address: "0xe7e553cd128f0011777323a0b44a7b96ea1cb540",
			decimals: 18,
			settlementStablecoin: "USDG",
		}),
		getStablecoinAddress: () => "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
		...overrides,
	};
}

describe("executePayment", () => {
	it("orchestrates the full payment flow: policy → fund → swap → settle", async () => {
		const deps = buildDeps();

		const result = await executePayment(deps, "01JTEST000000000000000000");

		expect(callLog).toContain("evaluatePolicy");
		expect(callLog).toContain("swapAdapter.execute");
		expect(callLog).toContain("recordSettlement");
		expect(result.status).toBe("settled");
	});

	it("fails gracefully when policy check fails", async () => {
		const deps = buildDeps({
			getPaymentIntent: async () =>
				({
					id: "01JTEST000000000000000000",
					accountId: "01JACCOUNT0000000000000",
					amount: 600,
					recipientAddress: "0xMERCHANT",
					status: "created",
				}) as PaymentIntent,
			evaluatePolicy: async () => ({
				passed: false,
				requiresApproval: false,
				violations: [
					{
						rule: "daily_limit",
						message: "Exceeds daily limit of $500",
						currentValue: 600,
						threshold: 500,
					},
				],
			}),
		});

		const result = await executePayment(deps, "01JTEST000000000000000000");
		expect(result.status).toBe("failed");
		expect(callLog).not.toContain("swapAdapter.execute");
	});

	it("routes to awaiting_approval when policy requires it", async () => {
		const deps = buildDeps({
			getPaymentIntent: async () =>
				({
					id: "01JTEST000000000000000000",
					accountId: "01JACCOUNT0000000000000",
					amount: 150,
					recipientAddress: "0xMERCHANT",
					status: "created",
				}) as PaymentIntent,
			evaluatePolicy: async () => ({
				passed: true,
				requiresApproval: true,
				violations: [],
			}),
		});

		const result = await executePayment(deps, "01JTEST000000000000000000");
		expect(result.status).toBe("awaiting_approval");
		expect(callLog).not.toContain("swapAdapter.execute");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test packages/core/src/domain/__tests__/funding-engine.test.ts`
Expected: FAIL — executePayment not exported

- [ ] **Step 3: Implement executePayment orchestrator**

Add to `packages/core/src/domain/funding-engine.ts`:

```ts
import type { SwapAdapter } from "../adapters/swap.js";
import type { PaymentIntent, FundingDecision, PaymentStatus } from "./payment-intent.js";
import { calculateAmountOutMin } from "../adapters/uniswap-v3.js";

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "../db/schema.js";
type Db = PostgresJsDatabase<typeof schema>;

export type ExecutePaymentDeps = {
	db: Db;
	getPaymentIntent: (db: Db, id: string) => Promise<PaymentIntent>;
	updatePaymentStatus: (
		db: Db,
		id: string,
		status: PaymentStatus,
		fundingDecision?: FundingDecision,
	) => Promise<PaymentIntent>;
	evaluatePolicy: (params: {
		accountId: string;
		amount: number;
	}) => Promise<{ passed: boolean; requiresApproval: boolean; violations: unknown[] }>;
	calculateSpendingPower: (accountId: string) => Promise<SpendingPower>;
	swapAdapter: SwapAdapter;
	recordSettlement: (
		db: Db,
		params: {
			paymentIntentId: string;
			txHash: string;
			blockNumber: number;
			amountSettled: bigint;
			stablecoin: string;
			gasUsed: bigint;
		},
	) => Promise<unknown>;
	getAsset: (symbol: string) => {
		symbol: string;
		address: string;
		decimals: number;
		settlementStablecoin: "USDG" | "USDC";
	};
	getStablecoinAddress: (symbol: "USDG" | "USDC") => string;
};

export async function executePayment(
	deps: ExecutePaymentDeps,
	intentId: string,
): Promise<{ status: PaymentStatus }> {
	const intent = await deps.getPaymentIntent(deps.db, intentId);

	// Phase 1: Policy check
	await deps.updatePaymentStatus(deps.db, intentId, "policy_check");
	const policyResult = await deps.evaluatePolicy({
		accountId: intent.accountId,
		amount: intent.amount,
	});

	if (!policyResult.passed) {
		return deps.updatePaymentStatus(deps.db, intentId, "failed");
	}

	if (policyResult.requiresApproval) {
		return deps.updatePaymentStatus(deps.db, intentId, "awaiting_approval");
	}

	// Phase 2: Funding source selection
	await deps.updatePaymentStatus(deps.db, intentId, "funding");
	const spendingPower = await deps.calculateSpendingPower(intent.accountId);
	const fundingDecision = selectFundingSource({
		amount: intent.amount,
		spendingPower,
		fundingPriority: ["spending_power", "stablecoin_balance"],
	});

	await deps.updatePaymentStatus(deps.db, intentId, "executing", fundingDecision);

	// Phase 3: Execute swap
	if (fundingDecision.source === "spending_power" && fundingDecision.asset) {
		const asset = deps.getAsset(fundingDecision.asset);
		const stablecoinAddress = deps.getStablecoinAddress(fundingDecision.stablecoin);

		const quote = await deps.swapAdapter.quote({
			tokenIn: asset.address,
			tokenOut: stablecoinAddress,
			amountIn: fundingDecision.amountIn,
			chainId: 196,
		});

		const amountOutMin = calculateAmountOutMin(quote.amountOut);

		const swapResult = await deps.swapAdapter.execute({
			tokenIn: asset.address,
			tokenOut: stablecoinAddress,
			amountIn: fundingDecision.amountIn,
			amountOutMin,
			recipient: intent.recipientAddress,
			chainId: 196,
		});

		// Phase 4: Record settlement
		await deps.updatePaymentStatus(deps.db, intentId, "settling");
		await deps.recordSettlement(deps.db, {
			paymentIntentId: intentId,
			txHash: swapResult.txHash,
			blockNumber: swapResult.blockNumber,
			amountSettled: swapResult.amountOut,
			stablecoin: fundingDecision.stablecoin,
			gasUsed: swapResult.gasUsed,
		});

		return deps.updatePaymentStatus(deps.db, intentId, "settled");
	}

	// Stablecoin direct transfer path (simpler, no swap needed)
	await deps.updatePaymentStatus(deps.db, intentId, "settling");
	// TODO: Execute ERC-20 transfer for stablecoin balance payments
	return deps.updatePaymentStatus(deps.db, intentId, "settled");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test packages/core/src/domain/__tests__/funding-engine.test.ts`
Expected: PASS — all 8 tests green (5 from Task 4 + 3 new)

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/funding-engine.ts packages/core/src/domain/__tests__/funding-engine.test.ts
git commit -m "feat(core): add payment execution orchestrator"
```

---

### Task 7: Settlement Recording and Receipt Generation

**Files:**
- Create: `packages/core/src/domain/settlement.ts`
- Test: `packages/core/src/domain/__tests__/settlement.test.ts`

**Interfaces:**
- Consumes: `settlements` table from `db/schema.ts`, `paymentIntents` table, `ulid()` from `ulidx`
- Produces: `recordSettlement(db, params): Promise<Settlement>`, `getReceipt(db, paymentIntentId): Promise<Receipt | null>`

- [ ] **Step 1: Write the failing test for settlement and receipt**

```ts
import { describe, expect, it, vi } from "vitest";
import { buildReceipt } from "../settlement.js";

describe("buildReceipt", () => {
	it("builds a receipt from payment intent and settlement data", () => {
		const receipt = buildReceipt({
			intent: {
				id: "01JPAYMENT0000000000000000",
				accountId: "01JACCOUNT0000000000000",
				amount: 25,
				recipientAddress: "0xMERCHANT",
				recipientUsername: "merchant1",
				fundingDecision: {
					source: "spending_power",
					asset: "wSPYx",
					stablecoin: "USDG",
					amountIn: 45000000000000000n,
					amountOutMin: 24750000n,
					pool: "wSPYx",
					conversionHop: false,
					estimatedSlippage: 0.001,
					decidedAt: new Date("2026-09-21T12:00:00Z"),
				},
			},
			settlement: {
				txHash: "0xabc123def456",
				blockNumber: 12345,
				amountSettled: 25000000n,
				stablecoin: "USDG",
				gasUsed: 150000n,
				settledAt: new Date("2026-09-21T12:00:05Z"),
			},
		});

		expect(receipt.paymentId).toBe("01JPAYMENT0000000000000000");
		expect(receipt.accountId).toBe("01JACCOUNT0000000000000");
		expect(receipt.amount).toBe(25);
		expect(receipt.sourceAsset).toBe("wSPYx");
		expect(receipt.fundingSource).toBe("spending_power");
		expect(receipt.settlementTxHash).toBe("0xabc123def456");
		expect(receipt.settlementStablecoin).toBe("USDG");
		expect(receipt.recipientAddress).toBe("0xMERCHANT");
	});

	it("handles stablecoin balance funding source", () => {
		const receipt = buildReceipt({
			intent: {
				id: "01JPAYMENT0000000000000001",
				accountId: "01JACCOUNT0000000000000",
				amount: 10,
				recipientAddress: "0xMERCHANT",
				recipientUsername: null,
				fundingDecision: {
					source: "stablecoin_balance",
					asset: null,
					stablecoin: "USDC",
					amountIn: 0n,
					amountOutMin: 0n,
					pool: "",
					conversionHop: false,
					estimatedSlippage: 0,
					decidedAt: new Date("2026-09-21T12:00:00Z"),
				},
			},
			settlement: {
				txHash: "0xdef789",
				blockNumber: 12346,
				amountSettled: 10000000n,
				stablecoin: "USDC",
				gasUsed: 50000n,
				settledAt: new Date("2026-09-21T12:00:02Z"),
			},
		});

		expect(receipt.sourceAsset).toBe("USDC");
		expect(receipt.fundingSource).toBe("stablecoin_balance");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test packages/core/src/domain/__tests__/settlement.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement settlement recording and receipt builder**

```ts
// packages/core/src/domain/settlement.ts

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import { settlements, paymentIntents } from "../db/schema.js";
import type * as schema from "../db/schema.js";
import type { FundingDecision, Receipt, Settlement } from "./payment-intent.js";

type Db = PostgresJsDatabase<typeof schema>;

export async function recordSettlement(
	db: Db,
	params: {
		paymentIntentId: string;
		txHash: string;
		blockNumber: number;
		amountSettled: bigint;
		stablecoin: string;
		gasUsed: bigint;
	},
) {
	const [row] = await db
		.insert(settlements)
		.values({
			id: ulid(),
			paymentIntentId: params.paymentIntentId,
			txHash: params.txHash,
			blockNumber: params.blockNumber,
			amountSettled: params.amountSettled.toString(),
			stablecoin: params.stablecoin,
			gasUsed: params.gasUsed.toString(),
		})
		.returning();

	return row!;
}

export async function getSettlement(db: Db, paymentIntentId: string) {
	const [row] = await db
		.select()
		.from(settlements)
		.where(eq(settlements.paymentIntentId, paymentIntentId));
	return row ?? null;
}

export function buildReceipt(params: {
	intent: {
		id: string;
		accountId: string;
		amount: number;
		recipientAddress: string;
		recipientUsername: string | null;
		fundingDecision: FundingDecision | null;
	};
	settlement: {
		txHash: string;
		blockNumber: number;
		amountSettled: bigint;
		stablecoin: string;
		gasUsed: bigint;
		settledAt: Date;
	};
}): Receipt {
	const { intent, settlement } = params;
	const fd = intent.fundingDecision;

	return {
		paymentId: intent.id,
		accountId: intent.accountId,
		amount: intent.amount,
		sourceAsset: fd?.asset ?? fd?.stablecoin ?? "unknown",
		fundingSource: fd?.source ?? "unknown",
		settlementTxHash: settlement.txHash,
		settlementStablecoin: settlement.stablecoin,
		recipientAddress: intent.recipientAddress,
		timestamp: settlement.settledAt,
	};
}

export async function getReceipt(db: Db, paymentIntentId: string): Promise<Receipt | null> {
	const [intent] = await db
		.select()
		.from(paymentIntents)
		.where(eq(paymentIntents.id, paymentIntentId));

	if (!intent) return null;

	const settlement = await getSettlement(db, paymentIntentId);
	if (!settlement) return null;

	return buildReceipt({
		intent: {
			id: intent.id,
			accountId: intent.accountId,
			amount: Number(intent.amount),
			recipientAddress: intent.recipientAddress,
			recipientUsername: intent.recipientUsername,
			fundingDecision: intent.fundingDecision as FundingDecision | null,
		},
		settlement: {
			txHash: settlement.txHash,
			blockNumber: settlement.blockNumber,
			amountSettled: BigInt(settlement.amountSettled),
			stablecoin: settlement.stablecoin,
			gasUsed: BigInt(settlement.gasUsed),
			settledAt: settlement.settledAt,
		},
	});
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test packages/core/src/domain/__tests__/settlement.test.ts`
Expected: PASS — both tests green

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/settlement.ts packages/core/src/domain/__tests__/settlement.test.ts
git commit -m "feat(core): add settlement recording and receipt generation"
```

---

### Task 8: Payment API Routes

**Files:**
- Create: `apps/api/src/routes/payments.ts`
- Test: `apps/api/src/routes/__tests__/payments.test.ts`

**Interfaces:**
- Consumes: `createPaymentIntent`, `getPaymentIntent`, `getPaymentHistory`, `updatePaymentStatus` from `packages/core`, `executePayment` from `packages/core`, `getReceipt` from `packages/core`
- Produces: Hono route group mounted at `/payments`

- [ ] **Step 1: Write the failing test for payment routes**

```ts
import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { paymentsRoutes } from "../payments.js";

describe("POST /payments/intent", () => {
	it("creates a payment intent and returns 201", async () => {
		const app = new Hono();
		const mockCreatePaymentIntent = vi.fn().mockResolvedValue({
			id: "01JTEST000000000000000000",
			accountId: "01JACCOUNT0000000000000",
			amount: "25.000000",
			recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
			status: "created",
			createdAt: "2026-09-21T00:00:00Z",
		});

		app.route(
			"/payments",
			paymentsRoutes({
				createPaymentIntent: mockCreatePaymentIntent,
				getPaymentIntent: vi.fn(),
				getPaymentHistory: vi.fn(),
				executePayment: vi.fn(),
				getReceipt: vi.fn(),
				updatePaymentStatus: vi.fn(),
			}),
		);

		const res = await app.request("/payments/intent", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				accountId: "01JACCOUNT0000000000000",
				amount: 25,
				recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
			}),
		});

		expect(res.status).toBe(201);
		const body = await res.json();
		expect(body.data.id).toBe("01JTEST000000000000000000");
		expect(body.data.status).toBe("created");
	});

	it("returns 400 for invalid input", async () => {
		const app = new Hono();
		app.route(
			"/payments",
			paymentsRoutes({
				createPaymentIntent: vi.fn(),
				getPaymentIntent: vi.fn(),
				getPaymentHistory: vi.fn(),
				executePayment: vi.fn(),
				getReceipt: vi.fn(),
				updatePaymentStatus: vi.fn(),
			}),
		);

		const res = await app.request("/payments/intent", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ amount: -5 }),
		});

		expect(res.status).toBe(400);
	});
});

describe("GET /payments/:id", () => {
	it("returns payment intent with 200", async () => {
		const app = new Hono();
		const mockGetPaymentIntent = vi.fn().mockResolvedValue({
			id: "01JTEST000000000000000000",
			status: "settled",
		});

		app.route(
			"/payments",
			paymentsRoutes({
				createPaymentIntent: vi.fn(),
				getPaymentIntent: mockGetPaymentIntent,
				getPaymentHistory: vi.fn(),
				executePayment: vi.fn(),
				getReceipt: vi.fn(),
				updatePaymentStatus: vi.fn(),
			}),
		);

		const res = await app.request("/payments/01JTEST000000000000000000");
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.id).toBe("01JTEST000000000000000000");
	});

	it("returns 404 when payment not found", async () => {
		const app = new Hono();
		app.route(
			"/payments",
			paymentsRoutes({
				createPaymentIntent: vi.fn(),
				getPaymentIntent: vi.fn().mockResolvedValue(null),
				getPaymentHistory: vi.fn(),
				executePayment: vi.fn(),
				getReceipt: vi.fn(),
				updatePaymentStatus: vi.fn(),
			}),
		);

		const res = await app.request("/payments/01JNOTFOUND00000000000000");
		expect(res.status).toBe(404);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test apps/api/src/routes/__tests__/payments.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement payment routes**

```ts
// apps/api/src/routes/payments.ts

import { Hono } from "hono";
import { z } from "zod";

const createPaymentIntentSchema = z.object({
	accountId: z.string().min(1),
	amount: z.number().positive(),
	recipientAddress: z
		.string()
		.regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address"),
	recipientUsername: z.string().optional(),
	settlementCurrency: z.enum(["USDG", "USDC"]).optional(),
});

type PaymentDeps = {
	createPaymentIntent: (params: {
		accountId: string;
		amount: number;
		recipientAddress: string;
		recipientUsername?: string;
		settlementCurrency?: "USDG" | "USDC";
	}) => Promise<unknown>;
	getPaymentIntent: (id: string) => Promise<unknown | null>;
	getPaymentHistory: (accountId: string, limit?: number) => Promise<unknown[]>;
	executePayment: (intentId: string) => Promise<unknown>;
	getReceipt: (paymentIntentId: string) => Promise<unknown | null>;
	updatePaymentStatus: (id: string, status: string) => Promise<unknown>;
};

export function paymentsRoutes(deps: PaymentDeps) {
	const app = new Hono();

	app.post("/intent", async (c) => {
		const body = await c.req.json();
		const parsed = createPaymentIntentSchema.safeParse(body);

		if (!parsed.success) {
			return c.json(
				{
					error: {
						code: "VALIDATION_ERROR",
						message: "Invalid request body",
						details: parsed.error.flatten(),
					},
				},
				400,
			);
		}

		const intent = await deps.createPaymentIntent(parsed.data);
		return c.json({ data: intent }, 201);
	});

	app.get("/:id", async (c) => {
		const id = c.req.param("id");
		const intent = await deps.getPaymentIntent(id);

		if (!intent) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: `Payment ${id} not found` } },
				404,
			);
		}

		return c.json({ data: intent });
	});

	app.get("/:id/receipt", async (c) => {
		const id = c.req.param("id");
		const receipt = await deps.getReceipt(id);

		if (!receipt) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: `Receipt not found for payment ${id}` } },
				404,
			);
		}

		return c.json({ data: receipt });
	});

	app.post("/:id/authorize", async (c) => {
		const id = c.req.param("id");
		const intent = await deps.getPaymentIntent(id);

		if (!intent) {
			return c.json(
				{ error: { code: "NOT_FOUND", message: `Payment ${id} not found` } },
				404,
			);
		}

		const result = await deps.executePayment(id);
		return c.json({ data: result });
	});

	app.post("/:id/reject", async (c) => {
		const id = c.req.param("id");
		const result = await deps.updatePaymentStatus(id, "rejected");
		return c.json({ data: result });
	});

	return app;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test apps/api/src/routes/__tests__/payments.test.ts`
Expected: PASS — all 4 tests green

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes/payments.ts apps/api/src/routes/__tests__/payments.test.ts
git commit -m "feat(api): add payment intent API routes"
```
