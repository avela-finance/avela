# Funding Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the payment intent lifecycle, collateral verification against AvelaVault, and settlement via AvelaPaymentRouter — turning "Pay with Avela" into a settled payment without selling user positions.

**Architecture:** Payment intents flow through a state machine (`created → policy_check → awaiting_approval → collateral_verify → settling → settled | failed | rejected`). The Funding Engine verifies the user's locked collateral in AvelaVault backs the payment, then settles from the pre-funded stablecoin reserve via AvelaPaymentRouter. No Uniswap swaps occur per payment — positions stay locked and intact. Each payment generates a receipt with `paymentId` linking vault and router events.

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

	it("transitions from policy_check to collateral_verify (auto-approved)", () => {
		expect(transitionStatus("policy_check", "collateral_verify")).toBe("collateral_verify");
	});

	it("transitions from awaiting_approval to collateral_verify", () => {
		expect(transitionStatus("awaiting_approval", "collateral_verify")).toBe("collateral_verify");
	});

	it("transitions from awaiting_approval to rejected", () => {
		expect(transitionStatus("awaiting_approval", "rejected")).toBe("rejected");
	});

	it("transitions from collateral_verify to settling", () => {
		expect(transitionStatus("collateral_verify", "settling")).toBe("settling");
	});

	it("transitions from settling to settled", () => {
		expect(transitionStatus("settling", "settled")).toBe("settled");
	});

	it("transitions to failed from any non-terminal state", () => {
		expect(transitionStatus("collateral_verify", "failed")).toBe("failed");
		expect(transitionStatus("settling", "failed")).toBe("failed");
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
		expect(isTerminalStatus("collateral_verify")).toBe(false);
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
	"collateral_verify",
	"settling",
	"settled",
	"failed",
	"rejected",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type FundingDecision = {
	source: "spending_power" | "stablecoin_balance";
	collateralAsset: string | null;
	collateralVerified: boolean;
	collateralAmount: bigint | null;
	settlementToken: "USDG" | "USDC";
	paymentId: string;
	spendingPowerAtDecision: number;
	decidedAt: Date;
};

export type Settlement = {
	paymentId: string;
	txHash: string;
	blockNumber: number;
	amountSettled: bigint;
	settlementToken: "USDG" | "USDC";
	gasUsed: bigint;
	settledAt: Date;
};

export type PaymentIntent = {
	id: string;
	accountId: string;
	amount: number;
	recipientAddress: string;
	recipientUsername: string | null;
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
	collateralAsset: string;
	settlementToken: string;
	settlementTxHash: string;
	recipientAddress: string;
	timestamp: Date;
};

const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
	created: ["policy_check", "failed"],
	policy_check: ["awaiting_approval", "collateral_verify", "failed"],
	awaiting_approval: ["collateral_verify", "rejected", "failed"],
	collateral_verify: ["settling", "failed"],
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
Expected: PASS — all 10 tests green

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
		expect(columns).toContain("paymentId");
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
	"collateral_verify",
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
	paymentId: varchar("payment_id", { length: 66 }).notNull(),
	txHash: varchar("tx_hash", { length: 66 }).notNull(),
	blockNumber: integer("block_number").notNull(),
	amountSettled: varchar("amount_settled", { length: 78 }).notNull(),
	settlementToken: varchar("settlement_token", { length: 10 }).notNull(),
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

		await updatePaymentStatus(db, intent.id, "policy_check");
		await updatePaymentStatus(db, intent.id, "collateral_verify");
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
- Produces: `selectFundingSource(params): FundingDecision`

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
	it("selects spending power first, picking asset with highest spending power", () => {
		const result = selectFundingSource({
			amount: 25,
			spendingPower: MOCK_SPENDING_POWER,
		});

		expect(result.source).toBe("spending_power");
		expect(result.collateralAsset).toBe("wSPYx");
		expect(result.settlementToken).toBe("USDG");
		expect(result.collateralVerified).toBe(false);
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
		});

		expect(result.source).toBe("stablecoin_balance");
		expect(result.collateralAsset).toBeNull();
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
			}),
		).toThrow("Insufficient funds");
	});

	it("records spendingPowerAtDecision", () => {
		const result = selectFundingSource({
			amount: 25,
			spendingPower: MOCK_SPENDING_POWER,
		});

		expect(result.spendingPowerAtDecision).toBe(1700);
	});

	it("generates a paymentId as bytes32 hex", () => {
		const result = selectFundingSource({
			amount: 25,
			spendingPower: MOCK_SPENDING_POWER,
		});

		expect(result.paymentId).toMatch(/^0x[a-f0-9]{64}$/);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test packages/core/src/domain/__tests__/funding-engine.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement funding source selection**

```ts
// packages/core/src/domain/funding-engine.ts

import { ulid } from "ulidx";
import { keccak256, toHex } from "viem";
import { getAsset } from "./asset.js";
import type { FundingDecision } from "./payment-intent.js";
import type { SpendingPower } from "./spending-power.js";

export function generatePaymentId(): string {
	return keccak256(toHex(ulid()));
}

export function selectFundingSource(params: {
	amount: number;
	spendingPower: SpendingPower;
}): FundingDecision {
	const { amount, spendingPower } = params;
	const paymentId = generatePaymentId();

	const eligible = spendingPower.perAsset
		.filter((a) => a.spendingPower >= amount)
		.filter((a) => getAsset(a.assetSymbol) !== undefined);

	if (eligible.length > 0) {
		const selected = eligible.sort((a, b) => b.spendingPower - a.spendingPower)[0]!;
		const asset = getAsset(selected.assetSymbol)!;

		return {
			source: "spending_power",
			collateralAsset: selected.assetSymbol,
			collateralVerified: false,
			collateralAmount: null,
			settlementToken: asset.settlementStablecoin,
			paymentId,
			spendingPowerAtDecision: spendingPower.totalSpendingPower,
			decidedAt: new Date(),
		};
	}

	if (spendingPower.stablecoinBalance >= amount) {
		return {
			source: "stablecoin_balance",
			collateralAsset: null,
			collateralVerified: false,
			collateralAmount: null,
			settlementToken: "USDG",
			paymentId,
			spendingPowerAtDecision: spendingPower.totalSpendingPower,
			decidedAt: new Date(),
		};
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
git commit -m "feat(core): add funding source selection with vault model"
```

---

### Task 5: Vault Adapter Interface and Implementation

**Files:**
- Create: `packages/core/src/adapters/vault-adapter.ts`
- Test: `packages/core/src/adapters/__tests__/vault-adapter.test.ts`

**Interfaces:**
- Consumes: viem `PublicClient` for X Layer, AvelaVault contract ABI
- Produces: `VaultAdapter` interface, `createVaultAdapter(publicClient, vaultAddress): VaultAdapter`

- [ ] **Step 1: Write the failing test for vault adapter interface**

```ts
import { describe, expect, it } from "vitest";
import type { VaultAdapter } from "../vault-adapter.js";

describe("VaultAdapter interface", () => {
	it("getLockedBalance returns expected shape", async () => {
		const testAdapter: VaultAdapter = {
			getLockedBalance: async () => 1000000000000000000n,
		};

		const balance = await testAdapter.getLockedBalance(
			"0x1234567890abcdef1234567890abcdef12345678",
			"0xe7e553cd128f0011777323a0b44a7b96ea1cb540",
		);

		expect(balance).toBe(1000000000000000000n);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test packages/core/src/adapters/__tests__/vault-adapter.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write vault adapter interface and implementation**

```ts
// packages/core/src/adapters/vault-adapter.ts

import type { PublicClient } from "viem";

export interface VaultAdapter {
	getLockedBalance(depositor: string, token: string): Promise<bigint>;
}

const VAULT_ABI = [
	{
		inputs: [
			{ name: "depositor", type: "address" },
			{ name: "token", type: "address" },
		],
		name: "getLockedBalance",
		outputs: [{ name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
] as const;

export function createVaultAdapter(
	publicClient: PublicClient,
	vaultAddress: string,
): VaultAdapter {
	return {
		async getLockedBalance(depositor: string, token: string): Promise<bigint> {
			const balance = await publicClient.readContract({
				address: vaultAddress as `0x${string}`,
				abi: VAULT_ABI,
				functionName: "getLockedBalance",
				args: [depositor as `0x${string}`, token as `0x${string}`],
			});
			return balance;
		},
	};
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test packages/core/src/adapters/__tests__/vault-adapter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/adapters/vault-adapter.ts packages/core/src/adapters/__tests__/vault-adapter.test.ts
git commit -m "feat(core): add vault adapter interface for AvelaVault"
```

---

### Task 6: Router Adapter Interface and Implementation

**Files:**
- Create: `packages/core/src/adapters/router-adapter.ts`
- Test: `packages/core/src/adapters/__tests__/router-adapter.test.ts`

**Interfaces:**
- Consumes: viem `PublicClient` and `WalletClient` for X Layer, AvelaPaymentRouter contract ABI
- Produces: `RouterAdapter` interface, `createRouterAdapter(publicClient, walletClient, routerAddress): RouterAdapter`

- [ ] **Step 1: Write the failing test for router adapter interface**

```ts
import { describe, expect, it } from "vitest";
import type { RouterAdapter } from "../router-adapter.js";

describe("RouterAdapter interface", () => {
	it("executePayment returns expected shape", async () => {
		const testAdapter: RouterAdapter = {
			executePayment: async () => ({
				txHash: "0xabc123",
				blockNumber: 1000,
				gasUsed: 150000n,
			}),
			isPaymentExecuted: async () => false,
		};

		const result = await testAdapter.executePayment({
			token: "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
			merchant: "0x1234567890abcdef1234567890abcdef12345678",
			amount: 25000000n,
			paymentId: "0x0000000000000000000000000000000000000000000000000000000000000001",
			collateralOwner: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
		});

		expect(result.txHash).toBe("0xabc123");
		expect(result.gasUsed).toBe(150000n);
	});

	it("isPaymentExecuted returns boolean", async () => {
		const testAdapter: RouterAdapter = {
			executePayment: async () => ({
				txHash: "0x",
				blockNumber: 0,
				gasUsed: 0n,
			}),
			isPaymentExecuted: async () => true,
		};

		const result = await testAdapter.isPaymentExecuted(
			"0x0000000000000000000000000000000000000000000000000000000000000001",
		);
		expect(result).toBe(true);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test packages/core/src/adapters/__tests__/router-adapter.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write router adapter interface and implementation**

```ts
// packages/core/src/adapters/router-adapter.ts

import type { PublicClient, WalletClient } from "viem";

export type ExecutePaymentParams = {
	token: string;
	merchant: string;
	amount: bigint;
	paymentId: string;
	collateralOwner: string;
};

export type ExecutePaymentResult = {
	txHash: string;
	blockNumber: number;
	gasUsed: bigint;
};

export interface RouterAdapter {
	executePayment(params: ExecutePaymentParams): Promise<ExecutePaymentResult>;
	isPaymentExecuted(paymentId: string): Promise<boolean>;
}

const ROUTER_ABI = [
	{
		inputs: [
			{ name: "token", type: "address" },
			{ name: "merchant", type: "address" },
			{ name: "amount", type: "uint256" },
			{ name: "paymentId", type: "bytes32" },
			{ name: "collateralOwner", type: "address" },
		],
		name: "executePayment",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ name: "paymentId", type: "bytes32" }],
		name: "isExecuted",
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "view",
		type: "function",
	},
] as const;

export function createRouterAdapter(
	publicClient: PublicClient,
	walletClient: WalletClient,
	routerAddress: string,
): RouterAdapter {
	return {
		async executePayment(params: ExecutePaymentParams): Promise<ExecutePaymentResult> {
			const account = walletClient.account;
			if (!account) {
				throw new Error("Wallet client has no account");
			}

			const hash = await walletClient.writeContract({
				address: routerAddress as `0x${string}`,
				abi: ROUTER_ABI,
				functionName: "executePayment",
				args: [
					params.token as `0x${string}`,
					params.merchant as `0x${string}`,
					params.amount,
					params.paymentId as `0x${string}`,
					params.collateralOwner as `0x${string}`,
				],
				account,
				chain: null,
			});

			const receipt = await publicClient.waitForTransactionReceipt({ hash });

			return {
				txHash: hash,
				blockNumber: Number(receipt.blockNumber),
				gasUsed: receipt.gasUsed,
			};
		},

		async isPaymentExecuted(paymentId: string): Promise<boolean> {
			return publicClient.readContract({
				address: routerAddress as `0x${string}`,
				abi: ROUTER_ABI,
				functionName: "isExecuted",
				args: [paymentId as `0x${string}`],
			});
		},
	};
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test packages/core/src/adapters/__tests__/router-adapter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/adapters/router-adapter.ts packages/core/src/adapters/__tests__/router-adapter.test.ts
git commit -m "feat(core): add router adapter interface for AvelaPaymentRouter"
```

---

### Task 7: Payment Execution Orchestrator

**Files:**
- Modify: `packages/core/src/domain/asset.ts` (add `STABLECOIN_DECIMALS`)
- Modify: `packages/core/src/domain/funding-engine.ts` (add `executePayment`)
- Test: `packages/core/src/domain/__tests__/funding-engine.test.ts` (extend)
- Test: `packages/core/src/domain/__tests__/asset.test.ts` (extend with decimals test)

**Interfaces:**
- Consumes: `updatePaymentStatus` from `payment-intent.ts`, `selectFundingSource` from this file, `evaluatePolicy` from `spending-policy.ts`, `VaultAdapter` from `adapters/vault-adapter.ts`, `RouterAdapter` from `adapters/router-adapter.ts`, `calculateSpendingPower` from `spending-power.ts`, `STABLECOIN_DECIMALS` from `asset.ts`
- Produces: `executePayment(deps, intentId): Promise<PaymentIntent>`

- [ ] **Step 0: Add STABLECOIN_DECIMALS to asset.ts**

USDG has 18 decimals, USDC has 6. Settlement amounts must use the correct decimals per stablecoin.

```ts
// In packages/core/src/domain/asset.ts — add after STABLECOINS export
export const STABLECOIN_DECIMALS: Record<SettlementStablecoin, number> = {
	USDG: 18,
	USDC: 6,
} as const;
```

Add test in `asset.test.ts`:

```ts
it("has correct stablecoin decimals", () => {
	expect(STABLECOIN_DECIMALS.USDG).toBe(18);
	expect(STABLECOIN_DECIMALS.USDC).toBe(6);
});
```

Run: `cd packages/core && bun run test -- --reporter=verbose`
Expected: all tests pass including new decimals test.

- [ ] **Step 1: Write the failing test for executePayment**

```ts
import { describe, expect, it } from "vitest";
import { executePayment } from "../funding-engine.js";
import type { ExecutePaymentDeps } from "../funding-engine.js";
import type { PaymentIntent } from "../payment-intent.js";

let callLog: string[] = [];

function buildDeps(overrides: Partial<ExecutePaymentDeps> = {}): ExecutePaymentDeps {
	callLog = [];
	return {
		db: {} as ExecutePaymentDeps["db"],
		getPaymentIntent: async () => {
			callLog.push("getPaymentIntent");
			return {
				id: "01JTEST000000000000000000",
				accountId: "01JACCOUNT0000000000000",
				amount: 25,
				recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
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
		vaultAdapter: {
			getLockedBalance: async () => {
				callLog.push("vaultAdapter.getLockedBalance");
				return 1000000000000000000n;
			},
		},
		routerAdapter: {
			executePayment: async () => {
				callLog.push("routerAdapter.executePayment");
				return {
					txHash: "0xabc123",
					blockNumber: 1000,
					gasUsed: 150000n,
				};
			},
			isPaymentExecuted: async () => false,
		},
		recordSettlement: async () => {
			callLog.push("recordSettlement");
			return {};
		},
		getAccountWalletAddress: async () => {
			return "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
		},
		...overrides,
	};
}

describe("executePayment", () => {
	it("orchestrates: policy → collateral verify → settle", async () => {
		const deps = buildDeps();
		const result = await executePayment(deps, "01JTEST000000000000000000");

		expect(callLog).toContain("evaluatePolicy");
		expect(callLog).toContain("vaultAdapter.getLockedBalance");
		expect(callLog).toContain("routerAdapter.executePayment");
		expect(callLog).toContain("recordSettlement");
		expect(result.status).toBe("settled");
	});

	it("fails when policy check fails", async () => {
		const deps = buildDeps({
			evaluatePolicy: async () => ({
				passed: false,
				requiresApproval: false,
				violations: [{ rule: "daily_limit", message: "Exceeds limit", currentValue: 600, threshold: 500 }],
			}),
		});

		const result = await executePayment(deps, "01JTEST000000000000000000");
		expect(result.status).toBe("failed");
		expect(callLog).not.toContain("routerAdapter.executePayment");
	});

	it("routes to awaiting_approval when policy requires it", async () => {
		const deps = buildDeps({
			evaluatePolicy: async () => ({
				passed: true,
				requiresApproval: true,
				violations: [],
			}),
		});

		const result = await executePayment(deps, "01JTEST000000000000000000");
		expect(result.status).toBe("awaiting_approval");
		expect(callLog).not.toContain("routerAdapter.executePayment");
	});

	it("fails when collateral verification returns zero", async () => {
		const deps = buildDeps({
			vaultAdapter: {
				getLockedBalance: async () => 0n,
			},
		});

		const result = await executePayment(deps, "01JTEST000000000000000000");
		expect(result.status).toBe("failed");
		expect(callLog).not.toContain("routerAdapter.executePayment");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test packages/core/src/domain/__tests__/funding-engine.test.ts`
Expected: FAIL — executePayment not exported

- [ ] **Step 3: Implement executePayment orchestrator**

Add to `packages/core/src/domain/funding-engine.ts`:

```ts
import type { VaultAdapter } from "../adapters/vault-adapter.js";
import type { RouterAdapter } from "../adapters/router-adapter.js";
import { STABLECOINS, STABLECOIN_DECIMALS } from "./asset.js";
import type { PaymentIntent, FundingDecision, PaymentStatus } from "./payment-intent.js";
import type { SpendingPower } from "./spending-power.js";
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
	vaultAdapter: VaultAdapter;
	routerAdapter: RouterAdapter;
	recordSettlement: (
		db: Db,
		params: {
			paymentIntentId: string;
			paymentId: string;
			txHash: string;
			blockNumber: number;
			amountSettled: bigint;
			settlementToken: string;
			gasUsed: bigint;
		},
	) => Promise<unknown>;
	getAccountWalletAddress: (accountId: string) => Promise<string>;
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

	// Phase 2: Funding source selection + collateral verification
	const spendingPower = await deps.calculateSpendingPower(intent.accountId);
	const fundingDecision = selectFundingSource({
		amount: intent.amount,
		spendingPower,
	});

	if (fundingDecision.source === "spending_power" && fundingDecision.collateralAsset) {
		const walletAddress = await deps.getAccountWalletAddress(intent.accountId);
		const asset = getAsset(fundingDecision.collateralAsset)!;
		const lockedBalance = await deps.vaultAdapter.getLockedBalance(walletAddress, asset.address);

		// Verify collateral sufficiency — not just existence
		const spendingPower = await deps.calculateSpendingPower(intent.accountId);
		const assetPower = spendingPower.perAsset.find(
			(a) => a.symbol === fundingDecision.collateralAsset,
		);

		if (!assetPower || assetPower.spendingPower < intent.amount) {
			return deps.updatePaymentStatus(deps.db, intentId, "failed");
		}

		fundingDecision.collateralVerified = true;
		fundingDecision.collateralAmount = lockedBalance;
	}

	await deps.updatePaymentStatus(deps.db, intentId, "collateral_verify", fundingDecision);

	// Phase 3: Settlement via AvelaPaymentRouter
	await deps.updatePaymentStatus(deps.db, intentId, "settling");
	const walletAddress = await deps.getAccountWalletAddress(intent.accountId);
	const stablecoinAddress = STABLECOINS[fundingDecision.settlementToken];
	const decimals = STABLECOIN_DECIMALS[fundingDecision.settlementToken];
	const settlementAmount = BigInt(Math.round(intent.amount * 10 ** decimals));

	const result = await deps.routerAdapter.executePayment({
		token: stablecoinAddress,
		merchant: intent.recipientAddress,
		amount: settlementAmount,
		paymentId: fundingDecision.paymentId,
		collateralOwner: walletAddress,
	});

	// Phase 4: Record settlement
	await deps.recordSettlement(deps.db, {
		paymentIntentId: intentId,
		paymentId: fundingDecision.paymentId,
		txHash: result.txHash,
		blockNumber: result.blockNumber,
		amountSettled: settlementAmount,
		settlementToken: fundingDecision.settlementToken,
		gasUsed: result.gasUsed,
	});

	return deps.updatePaymentStatus(deps.db, intentId, "settled");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test packages/core/src/domain/__tests__/funding-engine.test.ts`
Expected: PASS — all 9 tests green (5 from Task 4 + 4 new)

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/funding-engine.ts packages/core/src/domain/__tests__/funding-engine.test.ts
git commit -m "feat(core): add payment execution orchestrator with vault+reserve model"
```

---

### Task 8: Settlement Recording and Receipt Generation

**Files:**
- Create: `packages/core/src/domain/settlement.ts`
- Test: `packages/core/src/domain/__tests__/settlement.test.ts`

**Interfaces:**
- Consumes: `settlements` table from `db/schema.ts`, `paymentIntents` table, `ulid()` from `ulidx`
- Produces: `recordSettlement(db, params): Promise<Settlement>`, `getReceipt(db, paymentIntentId): Promise<Receipt | null>`, `buildReceipt(params): Receipt`

- [ ] **Step 1: Write the failing test for settlement and receipt**

```ts
import { describe, expect, it } from "vitest";
import { buildReceipt } from "../settlement.js";

describe("buildReceipt", () => {
	it("builds a receipt from payment intent and settlement data", () => {
		const receipt = buildReceipt({
			intent: {
				id: "01JPAYMENT0000000000000000",
				accountId: "01JACCOUNT0000000000000",
				amount: 25,
				recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
				fundingDecision: {
					source: "spending_power",
					collateralAsset: "wSPYx",
					collateralVerified: true,
					collateralAmount: 1000000000000000000n,
					settlementToken: "USDG",
					paymentId: "0x0000000000000000000000000000000000000000000000000000000000000001",
					spendingPowerAtDecision: 800,
					decidedAt: new Date("2026-09-21T12:00:00Z"),
				},
			},
			settlement: {
				paymentId: "0x0000000000000000000000000000000000000000000000000000000000000001",
				txHash: "0xabc123def456",
				blockNumber: 12345,
				amountSettled: 25000000n,
				settlementToken: "USDG",
				gasUsed: 150000n,
				settledAt: new Date("2026-09-21T12:00:05Z"),
			},
		});

		expect(receipt.paymentId).toBe("0x0000000000000000000000000000000000000000000000000000000000000001");
		expect(receipt.accountId).toBe("01JACCOUNT0000000000000");
		expect(receipt.amount).toBe(25);
		expect(receipt.collateralAsset).toBe("wSPYx");
		expect(receipt.settlementToken).toBe("USDG");
		expect(receipt.settlementTxHash).toBe("0xabc123def456");
		expect(receipt.recipientAddress).toBe("0x1234567890abcdef1234567890abcdef12345678");
	});

	it("handles stablecoin balance funding source", () => {
		const receipt = buildReceipt({
			intent: {
				id: "01JPAYMENT0000000000000001",
				accountId: "01JACCOUNT0000000000000",
				amount: 10,
				recipientAddress: "0x1234567890abcdef1234567890abcdef12345678",
				fundingDecision: {
					source: "stablecoin_balance",
					collateralAsset: null,
					collateralVerified: false,
					collateralAmount: null,
					settlementToken: "USDC",
					paymentId: "0x0000000000000000000000000000000000000000000000000000000000000002",
					spendingPowerAtDecision: 100,
					decidedAt: new Date("2026-09-21T12:00:00Z"),
				},
			},
			settlement: {
				paymentId: "0x0000000000000000000000000000000000000000000000000000000000000002",
				txHash: "0xdef789",
				blockNumber: 12346,
				amountSettled: 10000000n,
				settlementToken: "USDC",
				gasUsed: 50000n,
				settledAt: new Date("2026-09-21T12:00:02Z"),
			},
		});

		expect(receipt.collateralAsset).toBe("stablecoin");
		expect(receipt.settlementToken).toBe("USDC");
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
import type { FundingDecision, Receipt } from "./payment-intent.js";

type Db = PostgresJsDatabase<typeof schema>;

export async function recordSettlement(
	db: Db,
	params: {
		paymentIntentId: string;
		paymentId: string;
		txHash: string;
		blockNumber: number;
		amountSettled: bigint;
		settlementToken: string;
		gasUsed: bigint;
	},
) {
	const [row] = await db
		.insert(settlements)
		.values({
			id: ulid(),
			paymentIntentId: params.paymentIntentId,
			paymentId: params.paymentId,
			txHash: params.txHash,
			blockNumber: params.blockNumber,
			amountSettled: params.amountSettled.toString(),
			settlementToken: params.settlementToken,
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
		fundingDecision: FundingDecision | null;
	};
	settlement: {
		paymentId: string;
		txHash: string;
		blockNumber: number;
		amountSettled: bigint;
		settlementToken: string;
		gasUsed: bigint;
		settledAt: Date;
	};
}): Receipt {
	const { intent, settlement } = params;
	const fd = intent.fundingDecision;

	return {
		paymentId: settlement.paymentId,
		accountId: intent.accountId,
		amount: intent.amount,
		collateralAsset: fd?.collateralAsset ?? "stablecoin",
		settlementToken: settlement.settlementToken,
		settlementTxHash: settlement.txHash,
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
			fundingDecision: intent.fundingDecision as FundingDecision | null,
		},
		settlement: {
			paymentId: settlement.paymentId,
			txHash: settlement.txHash,
			blockNumber: settlement.blockNumber,
			amountSettled: BigInt(settlement.amountSettled),
			settlementToken: settlement.settlementToken,
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

### Task 9: Payment API Routes

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
});

type PaymentDeps = {
	createPaymentIntent: (params: {
		accountId: string;
		amount: number;
		recipientAddress: string;
		recipientUsername?: string;
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

---

### Task 10: Barrel Exports and Integration

**Files:**
- Modify: `packages/core/src/index.ts` (add payment, settlement, adapter exports)

**Interfaces:**
- Consumes: All modules from Tasks 1–8
- Produces: Clean public API from `@avela/core`

- [ ] **Step 1: Update barrel exports**

Add to `packages/core/src/index.ts`:

```ts
// Payment intent lifecycle
export {
	PAYMENT_STATUSES,
	type PaymentStatus,
	type PaymentIntent,
	type FundingDecision,
	type Settlement,
	type Receipt,
	transitionStatus,
	isTerminalStatus,
	createPaymentIntent,
	getPaymentIntent,
	getPaymentHistory,
	updatePaymentStatus,
} from "./domain/payment-intent.js";

// Funding engine
export {
	selectFundingSource,
	executePayment,
	generatePaymentId,
	type ExecutePaymentDeps,
} from "./domain/funding-engine.js";

// Settlement
export {
	recordSettlement,
	getReceipt,
	buildReceipt,
} from "./domain/settlement.js";

// Vault adapter
export {
	type VaultAdapter,
	createVaultAdapter,
} from "./adapters/vault-adapter.js";

// Router adapter
export {
	type RouterAdapter,
	type ExecutePaymentParams,
	type ExecutePaymentResult,
	createRouterAdapter,
} from "./adapters/router-adapter.js";
```

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: PASS — no type errors

- [ ] **Step 3: Run all tests**

Run: `bun run test`
Expected: PASS — all tests green

- [ ] **Step 4: Run lint**

Run: `bun run check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/index.ts
git commit -m "feat(core): export payment and adapter modules from barrel"
```
