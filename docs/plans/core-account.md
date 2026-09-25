# Core Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundational domain package — accounts, portfolio positions, asset registry, price feeds, and spending power calculation.

**Architecture:** All domain logic lives in `packages/core`. Exports types, domain functions, DB schema, and adapter interfaces. No HTTP — that's the API's job. Uses Drizzle ORM for Postgres access, viem for X Layer RPC reads, Zod for domain input validation.

**Tech Stack:** TypeScript, Drizzle ORM, Zod, viem, ulidx, Vitest

## Global Constraints

- Biome formatting: tabs, double quotes, semicolons, trailing commas
- TypeScript strict mode, ESNext target, Preserve modules
- All entity IDs are ULIDs via `ulidx`
- No mocks — real DB for integration tests, real RPC for price feed tests
- No `as any`, `@ts-ignore`, or `@ts-expect-error`
- Tests require `TEST_DATABASE_URL` env var pointing to a Postgres database. Run migrations before tests.
- X Layer chain ID: 196, RPC: `https://rpc.xlayer.tech`
- Package name: `@avela/core`
- Run `bun run check` and `bun run typecheck` before each commit

---

### Task 1: Package Scaffold

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: `@avela/core` package importable by `apps/api` and other consumers

- [ ] **Step 1: Create package.json**

```json
{
	"name": "@avela/core",
	"type": "module",
	"version": "0.1.0",
	"private": true,
	"exports": {
		".": "./src/index.ts"
	},
	"scripts": {
		"test": "vitest run",
		"typecheck": "tsc --noEmit",
		"db:generate": "drizzle-kit generate",
		"db:migrate": "drizzle-kit migrate",
		"db:studio": "drizzle-kit studio"
	},
	"dependencies": {
		"drizzle-orm": "^0.44.0",
		"postgres": "^3.4.5",
		"ulidx": "^2.4.1",
		"viem": "^2.31.0",
		"zod": "^3.25.0"
	},
	"devDependencies": {
		"drizzle-kit": "^0.31.0",
		"vitest": "^5.0.1"
	}
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
	"extends": "../../tsconfig.json",
	"compilerOptions": {
		"rootDir": "./src",
		"outDir": "./dist",
		"paths": {
			"@/*": ["./src/*"]
		}
	},
	"include": ["src/**/*.ts"],
	"exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create barrel export**

File: `packages/core/src/index.ts`

```ts
export * from "./domain/types.js";
```

- [ ] **Step 4: Install dependencies**

```bash
cd /Users/samueldanso/Workspace/products/avela && bun install
```

Expected: dependencies resolve, `@avela/core` available in workspace.

- [ ] **Step 5: Verify typecheck**

```bash
bun run typecheck
```

Expected: PASS (empty barrel is valid)

- [ ] **Step 6: Commit**

```bash
git add packages/core/
git commit -m "feat(core): scaffold package with dependencies"
```

---

### Task 2: Domain Types

**Files:**
- Create: `packages/core/src/domain/types.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `Account`, `Asset`, `Position`, `StablecoinBalance`, `SpendingPower`, `SpendingPowerBreakdown` — all exported from `@avela/core`

- [ ] **Step 1: Write the types file**

File: `packages/core/src/domain/types.ts`

```ts
export type AccountStatus = "active" | "frozen" | "closed";

export type Account = {
	id: string;
	walletAddress: string;
	username: string | null;
	status: AccountStatus;
	createdAt: Date;
	updatedAt: Date;
};

export type AssetType = "index" | "single_stock";
export type SettlementStablecoin = "USDG" | "USDC";

export type Asset = {
	symbol: string;
	name: string;
	address: string;
	decimals: number;
	assetType: AssetType;
	haircut: number;
	settlementStablecoin: SettlementStablecoin;
	poolAddress: string;
	enabled: boolean;
};

export type Position = {
	id: string;
	accountId: string;
	assetSymbol: string;
	amount: bigint;
	depositTxHash: string;
	createdAt: Date;
	updatedAt: Date;
};

export type StablecoinBalance = {
	id: string;
	accountId: string;
	stablecoin: SettlementStablecoin;
	amount: bigint;
	updatedAt: Date;
};

export type SpendingPowerBreakdown = {
	assetSymbol: string;
	positionValue: number;
	haircut: number;
	spendingPower: number;
};

export type SpendingPower = {
	accountId: string;
	perAsset: SpendingPowerBreakdown[];
	stablecoinBalance: number;
	totalSpendingPower: number;
	calculatedAt: Date;
};

export type PriceResult = {
	price: number;
	source: string;
	confidence: number;
	timestamp: Date;
};
```

- [ ] **Step 2: Update barrel export**

File: `packages/core/src/index.ts`

```ts
export * from "./domain/types.js";
```

(Already correct from Task 1.)

- [ ] **Step 3: Verify typecheck**

```bash
bun run typecheck
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/domain/types.ts
git commit -m "feat(core): add domain types for account, asset, position, spending power"
```

---

### Task 3: Asset Registry

**Files:**
- Create: `packages/core/src/domain/asset.ts`
- Create: `packages/core/src/domain/__tests__/asset.test.ts`

**Interfaces:**
- Consumes: `Asset` from `./types.ts`
- Produces: `MVP_ASSETS`, `STABLECOINS`, `getSupportedAssets()`, `getAsset(symbol)`, `isAssetEligible(symbol)`

- [ ] **Step 1: Write the failing test**

File: `packages/core/src/domain/__tests__/asset.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { getAsset, getSupportedAssets, isAssetEligible, STABLECOINS } from "../asset.js";

describe("asset registry", () => {
	it("returns 3 MVP assets", () => {
		const assets = getSupportedAssets();
		expect(assets).toHaveLength(3);
		expect(assets.map((a) => a.symbol)).toEqual(["wSPYx", "wQQQx", "wNVDAx"]);
	});

	it("returns correct wSPYx config", () => {
		const spy = getAsset("wSPYx");
		expect(spy).toBeDefined();
		expect(spy!.address).toBe("0xe7e553cd128f0011777323a0b44a7b96ea1cb540");
		expect(spy!.haircut).toBe(0.5);
		expect(spy!.settlementStablecoin).toBe("USDG");
		expect(spy!.assetType).toBe("index");
	});

	it("returns correct wQQQx config", () => {
		const qqq = getAsset("wQQQx");
		expect(qqq).toBeDefined();
		expect(qqq!.address).toBe("0x4c1ae29c159838fc1b224636e28e086eb69101f7");
		expect(qqq!.settlementStablecoin).toBe("USDC");
	});

	it("returns correct wNVDAx config", () => {
		const nvda = getAsset("wNVDAx");
		expect(nvda).toBeDefined();
		expect(nvda!.address).toBe("0xa8ddb5cd96b5222afe198316e9a57caa642850d5");
		expect(nvda!.assetType).toBe("single_stock");
	});

	it("returns undefined for unknown asset", () => {
		expect(getAsset("wFAKE")).toBeUndefined();
	});

	it("checks eligibility", () => {
		expect(isAssetEligible("wSPYx")).toBe(true);
		expect(isAssetEligible("wFAKE")).toBe(false);
	});

	it("has USDG and USDC stablecoin addresses", () => {
		expect(STABLECOINS.USDG).toBe("0x4ae46a509f6b1d9056937ba4500cb143933d2dc8");
		expect(STABLECOINS.USDC).toBe("0xb6ceceab302e2e4948951ee7843fc24e92933061");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test -- packages/core/src/domain/__tests__/asset.test.ts
```

Expected: FAIL — module `../asset.js` not found.

- [ ] **Step 3: Write the implementation**

File: `packages/core/src/domain/asset.ts`

```ts
import type { Asset, SettlementStablecoin } from "./types.js";

export const STABLECOINS: Record<SettlementStablecoin, string> = {
	USDG: "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
	USDC: "0xb6ceceab302e2e4948951ee7843fc24e92933061",
} as const;

const MVP_ASSETS: Asset[] = [
	{
		symbol: "wSPYx",
		name: "S&P 500",
		address: "0xe7e553cd128f0011777323a0b44a7b96ea1cb540",
		decimals: 18,
		assetType: "index",
		haircut: 0.5,
		settlementStablecoin: "USDG",
		poolAddress: "0x0000000000000000000000000000000000000000", // TODO: verify exact Uniswap V3 pool address
		enabled: true,
	},
	{
		symbol: "wQQQx",
		name: "Nasdaq 100",
		address: "0x4c1ae29c159838fc1b224636e28e086eb69101f7",
		decimals: 18,
		assetType: "index",
		haircut: 0.5,
		settlementStablecoin: "USDC",
		poolAddress: "0x0000000000000000000000000000000000000000", // TODO: verify exact Uniswap V3 pool address
		enabled: true,
	},
	{
		symbol: "wNVDAx",
		name: "Nvidia",
		address: "0xa8ddb5cd96b5222afe198316e9a57caa642850d5",
		decimals: 18,
		assetType: "single_stock",
		haircut: 0.5,
		settlementStablecoin: "USDG",
		poolAddress: "0x0000000000000000000000000000000000000000", // TODO: verify exact Uniswap V3 pool address
		enabled: true,
	},
];

export function getSupportedAssets(): Asset[] {
	return MVP_ASSETS.filter((a) => a.enabled);
}

export function getAsset(symbol: string): Asset | undefined {
	return MVP_ASSETS.find((a) => a.symbol === symbol);
}

export function isAssetEligible(symbol: string): boolean {
	const asset = getAsset(symbol);
	return asset !== undefined && asset.enabled;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test -- packages/core/src/domain/__tests__/asset.test.ts
```

Expected: PASS (all 7 tests)

- [ ] **Step 5: Update barrel export**

File: `packages/core/src/index.ts`

```ts
export * from "./domain/types.js";
export * from "./domain/asset.js";
```

- [ ] **Step 6: Lint and commit**

```bash
bun run check
git add packages/core/src/domain/asset.ts packages/core/src/domain/__tests__/asset.test.ts packages/core/src/index.ts
git commit -m "feat(core): add asset registry with 3 MVP xStocks"
```

---

### Task 4: Database Schema and Client

**Files:**
- Create: `packages/core/src/db/schema.ts`
- Create: `packages/core/src/db/client.ts`
- Create: `packages/core/drizzle.config.ts`

**Interfaces:**
- Consumes: `AccountStatus`, `SettlementStablecoin` from `./domain/types.ts`
- Produces: `accountsTable`, `positionsTable`, `stablecoinBalancesTable` (Drizzle table objects), `createDb(databaseUrl)` factory

- [ ] **Step 1: Create the schema**

File: `packages/core/src/db/schema.ts`

```ts
import { bigint, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const accountsTable = pgTable("accounts", {
	id: varchar("id", { length: 26 }).primaryKey(),
	walletAddress: varchar("wallet_address", { length: 42 }).notNull().unique(),
	username: varchar("username", { length: 32 }).unique(),
	status: varchar("status", { length: 20 }).notNull().default("active"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const positionsTable = pgTable("positions", {
	id: varchar("id", { length: 26 }).primaryKey(),
	accountId: varchar("account_id", { length: 26 })
		.notNull()
		.references(() => accountsTable.id),
	assetSymbol: varchar("asset_symbol", { length: 20 }).notNull(),
	amount: bigint("amount", { mode: "bigint" }).notNull(),
	depositTxHash: varchar("deposit_tx_hash", { length: 66 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stablecoinBalancesTable = pgTable("stablecoin_balances", {
	id: varchar("id", { length: 26 }).primaryKey(),
	accountId: varchar("account_id", { length: 26 })
		.notNull()
		.references(() => accountsTable.id),
	stablecoin: varchar("stablecoin", { length: 10 }).notNull(),
	amount: bigint("amount", { mode: "bigint" }).notNull().default(0n),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 2: Create the DB client factory**

File: `packages/core/src/db/client.ts`

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export type Database = ReturnType<typeof createDb>;

export function createDb(databaseUrl: string) {
	const client = postgres(databaseUrl);
	return drizzle(client, { schema });
}
```

- [ ] **Step 3: Create Drizzle config**

File: `packages/core/drizzle.config.ts`

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
});
```

- [ ] **Step 4: Update barrel export**

File: `packages/core/src/index.ts`

```ts
export * from "./domain/types.js";
export * from "./domain/asset.js";
export * from "./db/schema.js";
export * from "./db/client.js";
```

- [ ] **Step 5: Verify typecheck**

```bash
bun run typecheck
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/db/ packages/core/drizzle.config.ts packages/core/src/index.ts
git commit -m "feat(core): add Drizzle schema for accounts, positions, balances"
```

---

### Task 5: Account Operations

**Files:**
- Create: `packages/core/src/domain/account.ts`
- Create: `packages/core/src/domain/__tests__/account.test.ts`

**Interfaces:**
- Consumes: `Database` from `../db/client.ts`, `accountsTable` from `../db/schema.ts`, `Account` from `./types.ts`
- Produces: `createAccount(db, walletAddress)`, `getAccount(db, id)`, `getAccountByWallet(db, walletAddress)`

- [ ] **Step 1: Write the failing test**

File: `packages/core/src/domain/__tests__/account.test.ts`

```ts
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "../../db/schema.js";
import { createAccount, getAccount, getAccountByWallet } from "../account.js";

const testClient = postgres(process.env.TEST_DATABASE_URL!);
const db = drizzle(testClient, { schema });

afterEach(async () => {
	await db.execute(sql`DELETE FROM positions`);
	await db.execute(sql`DELETE FROM stablecoin_balances`);
	await db.execute(sql`DELETE FROM accounts`);
});

afterAll(async () => {
	await testClient.end();
});

describe("account operations", () => {
	it("createAccount returns an Account with ULID id", async () => {
		const account = await createAccount(db, "0x1234567890abcdef1234567890abcdef12345678");
		expect(account.walletAddress).toBe("0x1234567890abcdef1234567890abcdef12345678");
		expect(account.status).toBe("active");
		expect(account.id).toMatch(/^[0-9A-Z]{26}$/i);
	});

	it("getAccount queries by id", async () => {
		const created = await createAccount(db, "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
		const account = await getAccount(db, created.id);
		expect(account).toBeDefined();
		expect(account!.id).toBe(created.id);
		expect(account!.walletAddress).toBe("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
	});

	it("getAccount returns null for missing id", async () => {
		const account = await getAccount(db, "01JMISSING0000000000000000");
		expect(account).toBeNull();
	});

	it("getAccountByWallet returns account by wallet address", async () => {
		await createAccount(db, "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
		const account = await getAccountByWallet(db, "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
		expect(account).toBeDefined();
		expect(account!.walletAddress).toBe("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test -- packages/core/src/domain/__tests__/account.test.ts
```

Expected: FAIL — module `../account.js` not found.

- [ ] **Step 3: Write the implementation**

File: `packages/core/src/domain/account.ts`

```ts
import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import type { Database } from "../db/client.js";
import { accountsTable } from "../db/schema.js";
import type { Account } from "./types.js";

export async function createAccount(db: Database, walletAddress: string): Promise<Account> {
	const now = new Date();
	const row = {
		id: ulid(),
		walletAddress,
		username: null,
		status: "active" as const,
		createdAt: now,
		updatedAt: now,
	};

	const [inserted] = await db.insert(accountsTable).values(row).returning();
	return inserted as Account;
}

export async function getAccount(db: Database, id: string): Promise<Account | null> {
	const rows = await db.select().from(accountsTable).where(eq(accountsTable.id, id));
	return (rows[0] as Account) ?? null;
}

export async function getAccountByWallet(
	db: Database,
	walletAddress: string,
): Promise<Account | null> {
	const rows = await db
		.select()
		.from(accountsTable)
		.where(eq(accountsTable.walletAddress, walletAddress));
	return (rows[0] as Account) ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test -- packages/core/src/domain/__tests__/account.test.ts
```

Expected: PASS (all 3 tests)

- [ ] **Step 5: Update barrel export**

File: `packages/core/src/index.ts`

```ts
export * from "./domain/types.js";
export * from "./domain/asset.js";
export * from "./domain/account.js";
export * from "./db/schema.js";
export * from "./db/client.js";
```

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/domain/account.ts packages/core/src/domain/__tests__/account.test.ts packages/core/src/index.ts
git commit -m "feat(core): add account CRUD operations"
```

---

### Task 6: Position Operations

**Files:**
- Create: `packages/core/src/domain/position.ts`
- Create: `packages/core/src/domain/__tests__/position.test.ts`

**Interfaces:**
- Consumes: `Database` from `../db/client.ts`, `positionsTable` from `../db/schema.ts`, `Position` from `./types.ts`, `isAssetEligible` from `./asset.ts`
- Produces: `getPortfolio(db, accountId)`, `recordDeposit(db, params)`, `recordWithdrawal(db, params)`

- [ ] **Step 1: Write the failing test**

File: `packages/core/src/domain/__tests__/position.test.ts`

```ts
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "../../db/schema.js";
import { createAccount } from "../account.js";
import {
	getPortfolio,
	recordDeposit,
	type RecordDepositParams,
} from "../position.js";

const testClient = postgres(process.env.TEST_DATABASE_URL!);
const db = drizzle(testClient, { schema });

afterEach(async () => {
	await db.execute(sql`DELETE FROM positions`);
	await db.execute(sql`DELETE FROM stablecoin_balances`);
	await db.execute(sql`DELETE FROM accounts`);
});

afterAll(async () => {
	await testClient.end();
});

describe("position operations", () => {
	it("recordDeposit creates a position with ULID", async () => {
		const account = await createAccount(db, "0x1234567890abcdef1234567890abcdef12345678");
		const params: RecordDepositParams = {
			accountId: account.id,
			assetSymbol: "wSPYx",
			amount: 1000000000000000000n,
			depositTxHash: "0xabc123def456789000000000000000000000000000000000000000000000abcd",
		};
		const position = await recordDeposit(db, params);
		expect(position.accountId).toBe(account.id);
		expect(position.assetSymbol).toBe("wSPYx");
		expect(position.amount).toBe(1000000000000000000n);
		expect(position.id).toMatch(/^[0-9A-Z]{26}$/i);
	});

	it("recordDeposit rejects ineligible asset", async () => {
		const account = await createAccount(db, "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
		const params: RecordDepositParams = {
			accountId: account.id,
			assetSymbol: "wFAKE",
			amount: 100n,
			depositTxHash: "0xabc",
		};
		await expect(recordDeposit(db, params)).rejects.toThrow("Asset wFAKE is not eligible");
	});

	it("getPortfolio returns positions for account", async () => {
		const account = await createAccount(db, "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
		await recordDeposit(db, {
			accountId: account.id,
			assetSymbol: "wSPYx",
			amount: 100n,
			depositTxHash: "0x0000000000000000000000000000000000000000000000000000000000000001",
		});
		const positions = await getPortfolio(db, account.id);
		expect(positions).toHaveLength(1);
		expect(positions[0]!.assetSymbol).toBe("wSPYx");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test -- packages/core/src/domain/__tests__/position.test.ts
```

Expected: FAIL — module `../position.js` not found.

- [ ] **Step 3: Write the implementation**

File: `packages/core/src/domain/position.ts`

```ts
import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import type { Database } from "../db/client.js";
import { positionsTable } from "../db/schema.js";
import { isAssetEligible } from "./asset.js";
import type { Position } from "./types.js";

export type RecordDepositParams = {
	accountId: string;
	assetSymbol: string;
	amount: bigint;
	depositTxHash: string;
};

export async function recordDeposit(db: Database, params: RecordDepositParams): Promise<Position> {
	if (!isAssetEligible(params.assetSymbol)) {
		throw new Error(`Asset ${params.assetSymbol} is not eligible`);
	}

	const now = new Date();
	const row = {
		id: ulid(),
		accountId: params.accountId,
		assetSymbol: params.assetSymbol,
		amount: params.amount,
		depositTxHash: params.depositTxHash,
		createdAt: now,
		updatedAt: now,
	};

	const [inserted] = await db.insert(positionsTable).values(row).returning();
	return inserted as Position;
}

export type RecordWithdrawalParams = {
	positionId: string;
	amount: bigint;
};

export async function recordWithdrawal(
	db: Database,
	params: RecordWithdrawalParams,
): Promise<Position> {
	const rows = await db
		.select()
		.from(positionsTable)
		.where(eq(positionsTable.id, params.positionId));
	const position = rows[0];

	if (!position) {
		throw new Error(`Position ${params.positionId} not found`);
	}
	if (position.amount < params.amount) {
		throw new Error("Withdrawal amount exceeds position balance");
	}

	const newAmount = position.amount - params.amount;
	const now = new Date();

	const [updated] = await db
		.update(positionsTable)
		.set({ amount: newAmount, updatedAt: now })
		.where(eq(positionsTable.id, params.positionId))
		.returning();

	return updated as Position;
}

export async function getPortfolio(db: Database, accountId: string): Promise<Position[]> {
	const rows = await db
		.select()
		.from(positionsTable)
		.where(eq(positionsTable.accountId, accountId));
	return rows as Position[];
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test -- packages/core/src/domain/__tests__/position.test.ts
```

Expected: PASS (all 3 tests)

- [ ] **Step 5: Update barrel export**

File: `packages/core/src/index.ts`

```ts
export * from "./domain/types.js";
export * from "./domain/asset.js";
export * from "./domain/account.js";
export * from "./domain/position.js";
export * from "./db/schema.js";
export * from "./db/client.js";
```

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/domain/position.ts packages/core/src/domain/__tests__/position.test.ts packages/core/src/index.ts
git commit -m "feat(core): add position deposit, withdrawal, and portfolio query"
```

---

### Task 7: Price Feed Adapter

**Files:**
- Create: `packages/core/src/adapters/price-feed.ts`
- Create: `packages/core/src/adapters/uniswap-twap.ts`
- Create: `packages/core/src/adapters/xlayer-rpc.ts`
- Create: `packages/core/src/adapters/__tests__/price-feed.test.ts`

**Interfaces:**
- Consumes: `PriceResult` from `../domain/types.ts`, `getAsset` from `../domain/asset.ts`
- Produces: `PriceFeedAdapter` interface, `createUniswapTwapAdapter(client)`, `createXLayerClient()`

- [ ] **Step 1: Write the failing test**

File: `packages/core/src/adapters/__tests__/price-feed.test.ts`

```ts
import { describe, expect, it } from "vitest";
import type { PriceFeedAdapter } from "../price-feed.js";
import type { PriceResult } from "../../domain/types.js";

describe("PriceFeedAdapter interface", () => {
	it("adapter conforms to the interface", () => {
		const mockAdapter: PriceFeedAdapter = {
			getPrice: async (_assetAddress: string, _chainId: number): Promise<PriceResult> => ({
				price: 550.25,
				source: "test",
				confidence: 1,
				timestamp: new Date(),
			}),
		};
		expect(mockAdapter.getPrice).toBeDefined();
	});

	it("getPrice returns a PriceResult", async () => {
		const mockAdapter: PriceFeedAdapter = {
			getPrice: async () => ({
				price: 550.25,
				source: "test",
				confidence: 1,
				timestamp: new Date(),
			}),
		};
		const result = await mockAdapter.getPrice("0xabc", 196);
		expect(result.price).toBe(550.25);
		expect(result.source).toBe("test");
		expect(result.confidence).toBeGreaterThanOrEqual(0);
		expect(result.confidence).toBeLessThanOrEqual(1);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test -- packages/core/src/adapters/__tests__/price-feed.test.ts
```

Expected: FAIL — module `../price-feed.js` not found.

- [ ] **Step 3: Write the adapter interface**

File: `packages/core/src/adapters/price-feed.ts`

```ts
import type { PriceResult } from "../domain/types.js";

export interface PriceFeedAdapter {
	getPrice(assetAddress: string, chainId: number): Promise<PriceResult>;
}
```

- [ ] **Step 4: Write the X Layer RPC client**

File: `packages/core/src/adapters/xlayer-rpc.ts`

```ts
import { createPublicClient, http } from "viem";
import { defineChain } from "viem";

export const xlayer = defineChain({
	id: 196,
	name: "X Layer",
	nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
	rpcUrls: {
		default: { http: ["https://rpc.xlayer.tech"] },
	},
	blockExplorers: {
		default: { name: "OKX Explorer", url: "https://www.okx.com/web3/explorer/xlayer" },
	},
});

export function createXLayerClient(rpcUrl?: string) {
	return createPublicClient({
		chain: xlayer,
		transport: http(rpcUrl ?? "https://rpc.xlayer.tech"),
	});
}
```

- [ ] **Step 5: Write the Uniswap TWAP adapter**

File: `packages/core/src/adapters/uniswap-twap.ts`

```ts
import type { PublicClient } from "viem";
import type { PriceResult } from "../domain/types.js";
import type { PriceFeedAdapter } from "./price-feed.js";

const UNISWAP_V3_POOL_ABI = [
	{
		inputs: [],
		name: "slot0",
		outputs: [
			{ internalType: "uint160", name: "sqrtPriceX96", type: "uint160" },
			{ internalType: "int24", name: "tick", type: "int24" },
			{ internalType: "uint16", name: "observationIndex", type: "uint16" },
			{ internalType: "uint16", name: "observationCardinality", type: "uint16" },
			{ internalType: "uint16", name: "observationCardinalityNext", type: "uint16" },
			{ internalType: "uint8", name: "feeProtocol", type: "uint8" },
			{ internalType: "bool", name: "unlocked", type: "bool" },
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "token0",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "token1",
		outputs: [{ internalType: "address", name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
] as const;

// Mapping: asset address → pool address. Populated at runtime or by config.
type PoolConfig = {
	poolAddress: `0x${string}`;
	stablecoinDecimals: number;
	assetDecimals: number;
};

export function createUniswapTwapAdapter(
	client: PublicClient,
	poolMap: Record<string, PoolConfig>,
): PriceFeedAdapter {
	return {
		async getPrice(assetAddress: string, _chainId: number): Promise<PriceResult> {
			const config = poolMap[assetAddress.toLowerCase()];
			if (!config) {
				throw new Error(`No pool configured for asset ${assetAddress}`);
			}

			const [slot0Result, token0] = await Promise.all([
				client.readContract({
					address: config.poolAddress,
					abi: UNISWAP_V3_POOL_ABI,
					functionName: "slot0",
				}),
				client.readContract({
					address: config.poolAddress,
					abi: UNISWAP_V3_POOL_ABI,
					functionName: "token0",
				}),
			]);

			const sqrtPriceX96 = slot0Result[0];
			const isToken0 = token0.toLowerCase() === assetAddress.toLowerCase();

			// sqrtPriceX96 = sqrt(price) * 2^96
			// price = (sqrtPriceX96 / 2^96)^2 adjusted for decimal difference
			const sqrtPrice = Number(sqrtPriceX96) / 2 ** 96;
			let price = sqrtPrice * sqrtPrice;

			// Adjust for decimal difference between token0 and token1
			const decimalDiff = config.assetDecimals - config.stablecoinDecimals;
			price = price * 10 ** decimalDiff;

			// If asset is token1, invert the price
			if (!isToken0) {
				price = 1 / price;
			}

			return {
				price,
				source: "uniswap_twap",
				confidence: 0.9,
				timestamp: new Date(),
			};
		},
	};
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
bun run test -- packages/core/src/adapters/__tests__/price-feed.test.ts
```

Expected: PASS (both tests)

- [ ] **Step 7: Update barrel export**

File: `packages/core/src/index.ts`

```ts
export * from "./domain/types.js";
export * from "./domain/asset.js";
export * from "./domain/account.js";
export * from "./domain/position.js";
export * from "./adapters/price-feed.js";
export * from "./adapters/uniswap-twap.js";
export * from "./adapters/xlayer-rpc.js";
export * from "./db/schema.js";
export * from "./db/client.js";
```

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/adapters/ packages/core/src/index.ts
git commit -m "feat(core): add price feed adapter with Uniswap V3 TWAP"
```

---

### Task 8: Spending Power Calculation

**Files:**
- Create: `packages/core/src/domain/spending-power.ts`
- Create: `packages/core/src/domain/__tests__/spending-power.test.ts`

**Interfaces:**
- Consumes: `Database` from `../db/client.ts`, `Position`, `SpendingPower`, `SpendingPowerBreakdown`, `PriceResult` from `./types.ts`, `getAsset` from `./asset.ts`, `getPortfolio` from `./position.ts`, `PriceFeedAdapter` from `../adapters/price-feed.ts`
- Produces: `calculateSpendingPower(db, priceFeed, accountId)`, `computeAssetSpendingPower(amount, decimals, price, haircut)`

- [ ] **Step 1: Write the failing test**

File: `packages/core/src/domain/__tests__/spending-power.test.ts`

```ts
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "../../db/schema.js";
import { computeAssetSpendingPower, calculateSpendingPower } from "../spending-power.js";
import { createAccount } from "../account.js";
import { recordDeposit } from "../position.js";
import type { PriceFeedAdapter } from "../../adapters/price-feed.js";

const testClient = postgres(process.env.TEST_DATABASE_URL!);
const db = drizzle(testClient, { schema });

afterEach(async () => {
	await db.execute(sql`DELETE FROM positions`);
	await db.execute(sql`DELETE FROM stablecoin_balances`);
	await db.execute(sql`DELETE FROM accounts`);
});

afterAll(async () => {
	await testClient.end();
});

describe("spending power", () => {
	describe("computeAssetSpendingPower", () => {
		it("applies haircut correctly", () => {
			const result = computeAssetSpendingPower(
				1000000000000000000n,
				18,
				550.0,
				0.5,
			);
			expect(result.positionValue).toBeCloseTo(550.0, 1);
			expect(result.spendingPower).toBeCloseTo(275.0, 1);
			expect(result.haircut).toBe(0.5);
		});

		it("handles zero amount", () => {
			const result = computeAssetSpendingPower(0n, 18, 100.0, 0.5);
			expect(result.positionValue).toBe(0);
			expect(result.spendingPower).toBe(0);
		});

		it("handles fractional tokens", () => {
			const result = computeAssetSpendingPower(500000000000000000n, 18, 1000.0, 0.5);
			expect(result.positionValue).toBeCloseTo(500.0, 1);
			expect(result.spendingPower).toBeCloseTo(250.0, 1);
		});
	});

	describe("calculateSpendingPower", () => {
		it("aggregates spending power across positions", async () => {
			const account = await createAccount(db, "0x1234567890abcdef1234567890abcdef12345678");

			await recordDeposit(db, {
				accountId: account.id,
				assetSymbol: "wSPYx",
				amount: 2000000000000000000n,
				depositTxHash: "0x0000000000000000000000000000000000000000000000000000000000000001",
			});
			await recordDeposit(db, {
				accountId: account.id,
				assetSymbol: "wNVDAx",
				amount: 5000000000000000000n,
				depositTxHash: "0x0000000000000000000000000000000000000000000000000000000000000002",
			});

			const testPriceFeed: PriceFeedAdapter = {
				getPrice: async (address: string) => {
					if (address === "0xe7e553cd128f0011777323a0b44a7b96ea1cb540") {
						return { price: 550, source: "test", confidence: 1, timestamp: new Date() };
					}
					if (address === "0xa8ddb5cd96b5222afe198316e9a57caa642850d5") {
						return { price: 140, source: "test", confidence: 1, timestamp: new Date() };
					}
					throw new Error("Unknown asset");
				},
			};

			const sp = await calculateSpendingPower(db, testPriceFeed, account.id);
			// wSPYx: 2 * 550 = 1100 value, 50% haircut = 550 SP
			// wNVDAx: 5 * 140 = 700 value, 50% haircut = 350 SP
			// Total = 900 SP
			expect(sp.perAsset).toHaveLength(2);
			expect(sp.totalSpendingPower).toBeCloseTo(900.0, 0);
			expect(sp.accountId).toBe(account.id);
		});
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
bun run test -- packages/core/src/domain/__tests__/spending-power.test.ts
```

Expected: FAIL — module `../spending-power.js` not found.

- [ ] **Step 3: Write the implementation**

File: `packages/core/src/domain/spending-power.ts`

```ts
import type { Database } from "../db/client.js";
import type { PriceFeedAdapter } from "../adapters/price-feed.js";
import type { SpendingPower, SpendingPowerBreakdown } from "./types.js";
import { getAsset } from "./asset.js";
import { getPortfolio } from "./position.js";

export function computeAssetSpendingPower(
	amount: bigint,
	decimals: number,
	price: number,
	haircut: number,
): Omit<SpendingPowerBreakdown, "assetSymbol"> {
	const tokenAmount = Number(amount) / 10 ** decimals;
	const positionValue = tokenAmount * price;
	const spendingPower = positionValue * (1 - haircut);

	return {
		positionValue,
		haircut,
		spendingPower,
	};
}

export async function calculateSpendingPower(
	db: Database,
	priceFeed: PriceFeedAdapter,
	accountId: string,
): Promise<SpendingPower> {
	const positions = await getPortfolio(db, accountId);

	const perAsset: SpendingPowerBreakdown[] = [];

	for (const position of positions) {
		const asset = getAsset(position.assetSymbol);
		if (!asset) continue;

		const priceResult = await priceFeed.getPrice(asset.address, 196);
		const breakdown = computeAssetSpendingPower(
			position.amount,
			asset.decimals,
			priceResult.price,
			asset.haircut,
		);

		perAsset.push({
			assetSymbol: position.assetSymbol,
			...breakdown,
		});
	}

	// TODO: add stablecoin balances (query stablecoinBalancesTable)
	const stablecoinBalance = 0;

	const totalSpendingPower =
		perAsset.reduce((sum, a) => sum + a.spendingPower, 0) + stablecoinBalance;

	return {
		accountId,
		perAsset,
		stablecoinBalance,
		totalSpendingPower,
		calculatedAt: new Date(),
	};
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun run test -- packages/core/src/domain/__tests__/spending-power.test.ts
```

Expected: PASS (all 4 tests)

- [ ] **Step 5: Update barrel export**

File: `packages/core/src/index.ts`

```ts
export * from "./domain/types.js";
export * from "./domain/asset.js";
export * from "./domain/account.js";
export * from "./domain/position.js";
export * from "./domain/spending-power.js";
export * from "./adapters/price-feed.js";
export * from "./adapters/uniswap-twap.js";
export * from "./adapters/xlayer-rpc.js";
export * from "./db/schema.js";
export * from "./db/client.js";
```

- [ ] **Step 6: Run all core tests**

```bash
bun run test -- packages/core/
```

Expected: All tests pass.

- [ ] **Step 7: Lint and typecheck**

```bash
bun run check
bun run typecheck
```

Expected: Both pass.

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/domain/spending-power.ts packages/core/src/domain/__tests__/spending-power.test.ts packages/core/src/index.ts
git commit -m "feat(core): add spending power calculation with haircut"
```
