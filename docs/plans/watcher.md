# Watcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the spending power threshold watcher that demonstrates the WATCH → EVALUATE → DECIDE → AUTHORIZE → EXECUTE loop — the architectural pattern for all future Avela automation.

**Architecture:** Watchers are stored in Postgres. A periodic evaluation cycle reads all active watchers, fetches current spending power, compares against thresholds, and dispatches WhatsApp notifications when triggered. Cooldown prevents re-alerting within a configurable window. The evaluator follows the explicit 5-phase loop (WATCH → EVALUATE → DECIDE → AUTHORIZE → EXECUTE) so judges can see the intelligence layer is real.

**Tech Stack:** Drizzle ORM (Postgres), Zod, ulidx, Hono, WhatsApp Business API (notification dispatch)

## Global Constraints

- Biome formatting: tabs, double quotes, semicolons, trailing commas
- All IDs are ULIDs via `ulidx`
- All domain inputs validated with Zod
- Tests use Vitest (`bun run test`)
- Lint with `bun run check`
- Typecheck with `bun run typecheck`
- No `as any`, `@ts-ignore`, or `@ts-expect-error`
- Tests use a real Postgres test database via `TEST_DATABASE_URL` — no mock databases
- Core domain logic lives in `packages/core/src/domain/`
- API routes live in `apps/api/src/routes/`
- DB schema lives in `packages/core/src/db/schema.ts`
- Notifications dispatch via WhatsApp Business API (not Telegram)

---

### Task 1: Watcher Domain Types

**Files:**
- Modify: `packages/core/src/domain/types.ts`
- Test: `packages/core/src/domain/__tests__/watcher-types.test.ts`

**Interfaces:**
- Consumes: Nothing (standalone types)
- Produces: `Watcher`, `WatcherStatus`, `SpendingPowerThresholdConfig`, `WatcherEvaluation`, `WatcherCyclePhase`, `CreateWatcherInput` — used by all subsequent tasks

- [ ] **Step 1: Write type validation test**

```ts
// packages/core/src/domain/__tests__/watcher-types.test.ts
import { describe, it, expect } from "vitest";
import {
	WatcherSchema,
	SpendingPowerThresholdConfigSchema,
	WatcherEvaluationSchema,
	CreateWatcherInputSchema,
} from "../types.js";

describe("Watcher types", () => {
	it("validates a well-formed SpendingPowerThresholdConfig", () => {
		const result = SpendingPowerThresholdConfigSchema.safeParse({
			threshold: 500,
			direction: "below",
		});
		expect(result.success).toBe(true);
	});

	it("rejects negative threshold", () => {
		const result = SpendingPowerThresholdConfigSchema.safeParse({
			threshold: -100,
			direction: "below",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid direction", () => {
		const result = SpendingPowerThresholdConfigSchema.safeParse({
			threshold: 500,
			direction: "above",
		});
		expect(result.success).toBe(false);
	});

	it("validates a well-formed Watcher", () => {
		const watcher = {
			id: "01JWATCH0000000000000001",
			accountId: "01JACCOUNT000000000000001",
			type: "spending_power_threshold" as const,
			config: { threshold: 500, direction: "below" as const },
			status: "active" as const,
			lastEvaluatedAt: null,
			lastTriggeredAt: null,
			cooldownMinutes: 60,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const result = WatcherSchema.safeParse(watcher);
		expect(result.success).toBe(true);
	});

	it("validates a well-formed WatcherEvaluation", () => {
		const evaluation = {
			watcherId: "01JWATCH0000000000000001",
			currentValue: 480,
			threshold: 500,
			triggered: true,
			evaluatedAt: new Date(),
		};
		const result = WatcherEvaluationSchema.safeParse(evaluation);
		expect(result.success).toBe(true);
	});

	it("validates CreateWatcherInput", () => {
		const result = CreateWatcherInputSchema.safeParse({
			accountId: "01JACCOUNT000000000000001",
			threshold: 500,
			cooldownMinutes: 60,
		});
		expect(result.success).toBe(true);
	});

	it("defaults cooldownMinutes to 60 when omitted", () => {
		const result = CreateWatcherInputSchema.safeParse({
			accountId: "01JACCOUNT000000000000001",
			threshold: 500,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.cooldownMinutes).toBe(60);
		}
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && bunx vitest run src/domain/__tests__/watcher-types.test.ts`
Expected: FAIL — imports not found

- [ ] **Step 3: Implement watcher types**

```ts
// Append to packages/core/src/domain/types.ts

// --- Watcher ---

export const WatcherStatusEnum = z.enum(["active", "triggered", "paused", "disabled"]);
export type WatcherStatus = z.infer<typeof WatcherStatusEnum>;

export const SpendingPowerThresholdConfigSchema = z.object({
	threshold: z.number().nonnegative(),
	direction: z.literal("below"),
});
export type SpendingPowerThresholdConfig = z.infer<typeof SpendingPowerThresholdConfigSchema>;

export const WatcherSchema = z.object({
	id: z.string(),
	accountId: z.string(),
	type: z.literal("spending_power_threshold"),
	config: SpendingPowerThresholdConfigSchema,
	status: WatcherStatusEnum,
	lastEvaluatedAt: z.date().nullable(),
	lastTriggeredAt: z.date().nullable(),
	cooldownMinutes: z.number().int().positive(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
export type Watcher = z.infer<typeof WatcherSchema>;

export const WatcherEvaluationSchema = z.object({
	watcherId: z.string(),
	currentValue: z.number(),
	threshold: z.number(),
	triggered: z.boolean(),
	evaluatedAt: z.date(),
});
export type WatcherEvaluation = z.infer<typeof WatcherEvaluationSchema>;

export type WatcherCyclePhase = "watch" | "evaluate" | "decide" | "authorize" | "execute";

export const CreateWatcherInputSchema = z.object({
	accountId: z.string().min(1),
	threshold: z.number().nonnegative(),
	cooldownMinutes: z.number().int().positive().default(60),
});
export type CreateWatcherInput = z.infer<typeof CreateWatcherInputSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/core && bunx vitest run src/domain/__tests__/watcher-types.test.ts`
Expected: PASS (all 7 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/types.ts packages/core/src/domain/__tests__/watcher-types.test.ts
git commit -m "feat(core): add watcher domain types"
```

---

### Task 2: Watcher Database Schema

**Files:**
- Modify: `packages/core/src/db/schema.ts`
- Test: `packages/core/src/db/__tests__/watcher-schema.test.ts`

**Interfaces:**
- Consumes: `accounts` table from schema.ts (defined by core-account plan)
- Produces: `watchers` table — used by watcher CRUD and evaluator tasks

- [ ] **Step 1: Write schema validation test**

```ts
// packages/core/src/db/__tests__/watcher-schema.test.ts
import { describe, it, expect } from "vitest";
import { watchers } from "../schema.js";

describe("Watcher DB schema", () => {
	it("watchers table has required columns", () => {
		const columns = Object.keys(watchers);
		expect(columns).toContain("id");
		expect(columns).toContain("accountId");
		expect(columns).toContain("type");
		expect(columns).toContain("config");
		expect(columns).toContain("status");
		expect(columns).toContain("lastEvaluatedAt");
		expect(columns).toContain("lastTriggeredAt");
		expect(columns).toContain("cooldownMinutes");
		expect(columns).toContain("createdAt");
		expect(columns).toContain("updatedAt");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && bunx vitest run src/db/__tests__/watcher-schema.test.ts`
Expected: FAIL — `watchers` not exported

- [ ] **Step 3: Implement schema**

```ts
// Append to packages/core/src/db/schema.ts

import { integer } from "drizzle-orm/pg-core";

export const watchers = pgTable("watchers", {
	id: text("id").primaryKey(),
	accountId: text("account_id")
		.notNull()
		.references(() => accounts.id),
	type: varchar("type", { length: 50 }).notNull().default("spending_power_threshold"),
	config: jsonb("config").notNull().$type<import("../domain/types.js").SpendingPowerThresholdConfig>(),
	status: varchar("status", { length: 20 }).notNull().default("active"),
	lastEvaluatedAt: timestamp("last_evaluated_at", { withTimezone: true }),
	lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),
	cooldownMinutes: integer("cooldown_minutes").notNull().default(60),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/core && bunx vitest run src/db/__tests__/watcher-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Generate migration**

Run: `cd packages/core && bunx drizzle-kit generate --name add-watchers`
Expected: Migration file created in `packages/core/drizzle/`

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/db/schema.ts packages/core/src/db/__tests__/watcher-schema.test.ts packages/core/drizzle/
git commit -m "feat(core): add watchers DB schema"
```

---

### Task 3: Watcher CRUD Operations

**Files:**
- Create: `packages/core/src/domain/watcher.ts`
- Test: `packages/core/src/domain/__tests__/watcher.test.ts`

**Interfaces:**
- Consumes: `watchers` table (Task 2), `Watcher`, `CreateWatcherInput` types (Task 1)
- Produces: `createWatcher()`, `getWatcher()`, `getWatchersByAccount()`, `updateWatcher()`, `deleteWatcher()` — used by evaluator (Task 4) and API routes (Task 6)

- [ ] **Step 1: Write failing tests**

```ts
// packages/core/src/domain/__tests__/watcher.test.ts
import { describe, it, expect, afterAll } from "vitest";
import {
	createWatcher,
	getWatcher,
	getWatchersByAccount,
	updateWatcher,
	deleteWatcher,
} from "../watcher.js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema.js";

const testClient = postgres(process.env.TEST_DATABASE_URL!);
const db = drizzle(testClient, { schema });

afterAll(async () => {
	await testClient.end();
});

describe("createWatcher", () => {
	it("creates a watcher with valid input", async () => {
		const result = await createWatcher(db, {
			accountId: "01JACCOUNT000000000000001",
			threshold: 500,
			cooldownMinutes: 60,
		});

		expect(result.status).toBe("active");
		expect(result.config.threshold).toBe(500);
		expect(result.cooldownMinutes).toBe(60);
	});

	it("rejects negative threshold", async () => {
		await expect(
			createWatcher(db, {
				accountId: "01JACCOUNT000000000000001",
				threshold: -100,
				cooldownMinutes: 60,
			}),
		).rejects.toThrow();
	});
});

describe("getWatcher", () => {
	it("returns watcher by ID", async () => {
		const created = await createWatcher(db, {
			accountId: "01JACCOUNT000000000000001",
			threshold: 500,
			cooldownMinutes: 60,
		});

		const result = await getWatcher(db, created.id);
		expect(result).not.toBeNull();
		expect(result!.id).toBe(created.id);
	});

	it("returns null for unknown ID", async () => {
		const result = await getWatcher(db, "nonexistent");
		expect(result).toBeNull();
	});
});

describe("deleteWatcher", () => {
	it("deletes watcher by ID", async () => {
		const created = await createWatcher(db, {
			accountId: "01JACCOUNT000000000000001",
			threshold: 500,
			cooldownMinutes: 60,
		});
		await deleteWatcher(db, created.id);
		const result = await getWatcher(db, created.id);
		expect(result).toBeNull();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && bunx vitest run src/domain/__tests__/watcher.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement watcher CRUD**

```ts
// packages/core/src/domain/watcher.ts
import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { watchers } from "../db/schema.js";
import type { Watcher, CreateWatcherInput } from "./types.js";
import { CreateWatcherInputSchema, WatcherStatusEnum } from "./types.js";
import type * as schema from "../db/schema.js";

type Db = PostgresJsDatabase<typeof schema>;

export async function createWatcher(db: Db, input: CreateWatcherInput): Promise<Watcher> {
	const validated = CreateWatcherInputSchema.parse(input);

	const id = ulid();
	const now = new Date();

	const [watcher] = await db
		.insert(watchers)
		.values({
			id,
			accountId: validated.accountId,
			type: "spending_power_threshold",
			config: {
				threshold: validated.threshold,
				direction: "below" as const,
			},
			status: "active",
			lastEvaluatedAt: null,
			lastTriggeredAt: null,
			cooldownMinutes: validated.cooldownMinutes,
			createdAt: now,
			updatedAt: now,
		})
		.returning();

	return watcher as Watcher;
}

export async function getWatcher(db: Db, watcherId: string): Promise<Watcher | null> {
	const rows = await db.select().from(watchers).where(eq(watchers.id, watcherId));
	return (rows[0] as Watcher) ?? null;
}

export async function getWatchersByAccount(db: Db, accountId: string): Promise<Watcher[]> {
	const rows = await db.select().from(watchers).where(eq(watchers.accountId, accountId));
	return rows as Watcher[];
}

export async function updateWatcher(
	db: Db,
	watcherId: string,
	updates: {
		threshold?: number;
		cooldownMinutes?: number;
		status?: "active" | "triggered" | "paused" | "disabled";
	},
): Promise<Watcher> {
	const setValues: Record<string, unknown> = { updatedAt: new Date() };

	if (updates.threshold !== undefined) {
		setValues.config = { threshold: updates.threshold, direction: "below" };
	}
	if (updates.cooldownMinutes !== undefined) {
		setValues.cooldownMinutes = updates.cooldownMinutes;
	}
	if (updates.status !== undefined) {
		WatcherStatusEnum.parse(updates.status);
		setValues.status = updates.status;
	}

	const [updated] = await db
		.update(watchers)
		.set(setValues)
		.where(eq(watchers.id, watcherId))
		.returning();

	if (!updated) {
		throw new Error(`Watcher ${watcherId} not found`);
	}

	return updated as Watcher;
}

export async function deleteWatcher(db: Db, watcherId: string): Promise<void> {
	await db.delete(watchers).where(eq(watchers.id, watcherId));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/core && bunx vitest run src/domain/__tests__/watcher.test.ts`
Expected: PASS (all 5 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/watcher.ts packages/core/src/domain/__tests__/watcher.test.ts
git commit -m "feat(core): add watcher CRUD operations"
```

---

### Task 4: Watcher Evaluator (WATCH → EVALUATE → DECIDE → AUTHORIZE → EXECUTE)

**Files:**
- Create: `packages/core/src/domain/watcher-evaluator.ts`
- Test: `packages/core/src/domain/__tests__/watcher-evaluator.test.ts`

**Interfaces:**
- Consumes: `getWatcher()` from watcher.ts (Task 3), `calculateSpendingPower()` from spending-power.ts (core-account plan), `watchers` table (Task 2), WhatsApp notification dispatch (whatsapp-access plan)
- Produces: `evaluateWatcher()`, `evaluateAllActiveWatchers()`, `handleWatcherTrigger()` — used by API routes (Task 6) and cron/background job

- [ ] **Step 1: Write failing tests for the evaluation loop**

```ts
// packages/core/src/domain/__tests__/watcher-evaluator.test.ts
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { evaluateWatcher, evaluateAllActiveWatchers } from "../watcher-evaluator.js";
import { createWatcher } from "../watcher.js";
import type { Watcher } from "../types.js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema.js";

const testClient = postgres(process.env.TEST_DATABASE_URL!);
const db = drizzle(testClient, { schema });

afterAll(async () => {
	await db.delete(schema.watchers);
	await testClient.end();
});

type SpendingPowerResult = { totalSpendingPower: number };
type AlertRecord = { accountId: string; message: string };

let spendingPowerResponses: SpendingPowerResult[] = [];
let alertsSent: AlertRecord[] = [];
let spendingPowerCallCount = 0;

const testGetSpendingPower = async (_db: typeof db, _accountId: string): Promise<SpendingPowerResult> => {
	spendingPowerCallCount++;
	return spendingPowerResponses.shift() ?? { totalSpendingPower: 0 };
};

const testSendAlert = async (accountId: string, message: string): Promise<void> => {
	alertsSent.push({ accountId, message });
};

describe("evaluateWatcher", () => {
	beforeEach(async () => {
		await db.delete(schema.watchers);
		spendingPowerResponses = [];
		alertsSent = [];
		spendingPowerCallCount = 0;
	});

	it("does not trigger when spending power is above threshold", async () => {
		const watcher = await createWatcher(db, {
			accountId: "01JACCOUNT000000000000001",
			threshold: 500,
			cooldownMinutes: 60,
		});
		spendingPowerResponses = [{ totalSpendingPower: 600 }];

		const result = await evaluateWatcher(
			db,
			watcher.id,
			testGetSpendingPower,
			testSendAlert,
		);

		expect(result.triggered).toBe(false);
		expect(result.currentValue).toBe(600);
		expect(result.threshold).toBe(500);
		expect(alertsSent).toHaveLength(0);
	});

	it("triggers when spending power drops below threshold", async () => {
		const watcher = await createWatcher(db, {
			accountId: "01JACCOUNT000000000000001",
			threshold: 500,
			cooldownMinutes: 60,
		});
		spendingPowerResponses = [{ totalSpendingPower: 480 }];

		const result = await evaluateWatcher(
			db,
			watcher.id,
			testGetSpendingPower,
			testSendAlert,
		);

		expect(result.triggered).toBe(true);
		expect(result.currentValue).toBe(480);
		expect(alertsSent).toHaveLength(1);
		expect(alertsSent[0].accountId).toBe("01JACCOUNT000000000000001");
		expect(alertsSent[0].message).toContain("480");
	});

	it("respects cooldown — does not re-trigger within window", async () => {
		const watcher = await createWatcher(db, {
			accountId: "01JACCOUNT000000000000001",
			threshold: 500,
			cooldownMinutes: 60,
		});
		// First trigger to set lastTriggeredAt
		spendingPowerResponses = [{ totalSpendingPower: 480 }];
		await evaluateWatcher(db, watcher.id, testGetSpendingPower, testSendAlert);

		// Second evaluation within cooldown window
		alertsSent = [];
		spendingPowerResponses = [{ totalSpendingPower: 480 }];
		const result = await evaluateWatcher(
			db,
			watcher.id,
			testGetSpendingPower,
			testSendAlert,
		);

		expect(result.triggered).toBe(false);
	});

	it("skips paused watchers", async () => {
		const watcher = await createWatcher(db, {
			accountId: "01JACCOUNT000000000000001",
			threshold: 500,
			cooldownMinutes: 60,
		});
		const { updateWatcher } = await import("../watcher.js");
		await updateWatcher(db, watcher.id, { status: "paused" });

		const prevCallCount = spendingPowerCallCount;
		const result = await evaluateWatcher(
			db,
			watcher.id,
			testGetSpendingPower,
			testSendAlert,
		);

		expect(result.triggered).toBe(false);
		expect(spendingPowerCallCount).toBe(prevCallCount);
	});
});

describe("evaluateAllActiveWatchers", () => {
	beforeEach(async () => {
		await db.delete(schema.watchers);
		spendingPowerResponses = [];
		alertsSent = [];
	});

	it("evaluates all active watchers", async () => {
		await createWatcher(db, {
			accountId: "01JACCOUNT000000000000001",
			threshold: 500,
			cooldownMinutes: 60,
		});
		await createWatcher(db, {
			accountId: "01JACCOUNT000000000000002",
			threshold: 500,
			cooldownMinutes: 60,
		});

		spendingPowerResponses = [
			{ totalSpendingPower: 600 },
			{ totalSpendingPower: 400 },
		];

		const results = await evaluateAllActiveWatchers(
			db,
			testGetSpendingPower,
			testSendAlert,
		);

		expect(results.length).toBeGreaterThanOrEqual(2);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && bunx vitest run src/domain/__tests__/watcher-evaluator.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement watcher evaluator**

```ts
// packages/core/src/domain/watcher-evaluator.ts
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { watchers } from "../db/schema.js";
import type { Watcher, WatcherEvaluation, WatcherCyclePhase } from "./types.js";
import type * as schema from "../db/schema.js";

type Db = PostgresJsDatabase<typeof schema>;
type SpendingPowerResult = { totalSpendingPower: number };
type GetSpendingPowerFn = (db: Db, accountId: string) => Promise<SpendingPowerResult>;
type SendAlertFn = (accountId: string, message: string) => Promise<void>;

export async function evaluateWatcher(
	db: Db,
	watcherId: string,
	getSpendingPower: GetSpendingPowerFn,
	sendAlert: SendAlertFn,
): Promise<WatcherEvaluation> {
	const now = new Date();

	// --- WATCH: Fetch watcher state ---
	const rows = await db.select().from(watchers).where(eq(watchers.id, watcherId));
	const watcher = rows[0] as Watcher | undefined;

	if (!watcher) {
		return { watcherId, currentValue: 0, threshold: 0, triggered: false, evaluatedAt: now };
	}

	// Skip non-active and non-triggered watchers
	if (watcher.status !== "active" && watcher.status !== "triggered") {
		return {
			watcherId,
			currentValue: 0,
			threshold: watcher.config.threshold,
			triggered: false,
			evaluatedAt: now,
		};
	}

	// --- EVALUATE: Get current spending power and compare ---
	const spendingPower = await getSpendingPower(db, watcher.accountId);
	const currentValue = spendingPower.totalSpendingPower;
	const threshold = watcher.config.threshold;
	const breached = currentValue < threshold;

	// --- DECIDE: Should we alert? ---
	let shouldAlert = false;
	if (breached) {
		const inCooldown =
			watcher.lastTriggeredAt !== null &&
			now.getTime() - watcher.lastTriggeredAt.getTime() < watcher.cooldownMinutes * 60 * 1000;

		shouldAlert = !inCooldown;
	}

	// --- AUTHORIZE: Alert notifications are auto-authorized (no human approval needed) ---

	// --- EXECUTE: Send notification and update state ---
	if (shouldAlert) {
		const message =
			`Your spending power is now $${currentValue.toFixed(2)} ` +
			`(threshold: $${threshold.toFixed(2)}). ` +
			`It has dropped below your alert level.`;

		await sendAlert(watcher.accountId, message);

		await db
			.update(watchers)
			.set({
				status: "triggered",
				lastEvaluatedAt: now,
				lastTriggeredAt: now,
				updatedAt: now,
			})
			.where(eq(watchers.id, watcherId))
			.returning();
	} else {
		// Update lastEvaluatedAt even when not triggered
		await db
			.update(watchers)
			.set({ lastEvaluatedAt: now, updatedAt: now })
			.where(eq(watchers.id, watcherId));
	}

	return {
		watcherId,
		currentValue,
		threshold,
		triggered: shouldAlert,
		evaluatedAt: now,
	};
}

export async function evaluateAllActiveWatchers(
	db: Db,
	getSpendingPower: GetSpendingPowerFn,
	sendAlert: SendAlertFn,
): Promise<WatcherEvaluation[]> {
	const activeRows = await db
		.select()
		.from(watchers)
		.where(eq(watchers.status, "active"));

	const triggeredRows = await db
		.select()
		.from(watchers)
		.where(eq(watchers.status, "triggered"));

	const allWatchers = [...(activeRows as Watcher[]), ...(triggeredRows as Watcher[])];

	const results: WatcherEvaluation[] = [];
	for (const watcher of allWatchers) {
		const result = await evaluateWatcher(db, watcher.id, getSpendingPower, sendAlert);
		results.push(result);
	}

	return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/core && bunx vitest run src/domain/__tests__/watcher-evaluator.test.ts`
Expected: PASS (all 6 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/watcher-evaluator.ts packages/core/src/domain/__tests__/watcher-evaluator.test.ts
git commit -m "feat(core): add watcher evaluator with WATCH→EVALUATE→DECIDE→AUTHORIZE→EXECUTE loop"
```

---

### Task 5: Watcher API Routes

**Files:**
- Create: `apps/api/src/routes/watchers.ts`
- Modify: `apps/api/src/index.ts` (mount routes)
- Test: `apps/api/src/routes/__tests__/watchers.test.ts`

**Interfaces:**
- Consumes: `createWatcher()`, `getWatchersByAccount()`, `updateWatcher()`, `deleteWatcher()` from watcher.ts (Task 3), `evaluateAllActiveWatchers()` from watcher-evaluator.ts (Task 4)
- Produces: HTTP endpoints — `POST /accounts/:id/watchers`, `GET /accounts/:id/watchers`, `PUT /watchers/:id`, `DELETE /watchers/:id`, `POST /watchers/evaluate`

- [ ] **Step 1: Write failing route test**

```ts
// apps/api/src/routes/__tests__/watchers.test.ts
import { describe, it, expect } from "vitest";
import { watcherRoutes } from "../watchers.js";

describe("watcherRoutes", () => {
	it("exports a Hono app", () => {
		expect(watcherRoutes).toBeDefined();
		expect(typeof watcherRoutes.fetch).toBe("function");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && bunx vitest run src/routes/__tests__/watchers.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement watcher routes**

```ts
// apps/api/src/routes/watchers.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
	createWatcher,
	getWatchersByAccount,
	updateWatcher,
	deleteWatcher,
} from "@avela/core/domain/watcher";
import { evaluateAllActiveWatchers } from "@avela/core/domain/watcher-evaluator";

export const watcherRoutes = new Hono();

// Nested under /accounts/:accountId/watchers
const accountWatcherRoutes = new Hono();

accountWatcherRoutes.post(
	"/",
	zValidator(
		"json",
		z.object({
			threshold: z.number().nonnegative(),
			cooldownMinutes: z.number().int().positive().optional(),
		}),
	),
	async (c) => {
		const db = c.get("db");
		const accountId = c.req.param("accountId");
		const body = c.req.valid("json");
		const watcher = await createWatcher(db, {
			accountId,
			threshold: body.threshold,
			cooldownMinutes: body.cooldownMinutes ?? 60,
		});
		return c.json({ data: watcher }, 201);
	},
);

accountWatcherRoutes.get("/", async (c) => {
	const db = c.get("db");
	const accountId = c.req.param("accountId");
	const list = await getWatchersByAccount(db, accountId);
	return c.json({ data: list });
});

watcherRoutes.route("/accounts/:accountId/watchers", accountWatcherRoutes);

// Direct watcher operations
watcherRoutes.put(
	"/watchers/:id",
	zValidator(
		"json",
		z.object({
			threshold: z.number().nonnegative().optional(),
			cooldownMinutes: z.number().int().positive().optional(),
			status: z.enum(["active", "paused", "disabled"]).optional(),
		}),
	),
	async (c) => {
		const db = c.get("db");
		const updates = c.req.valid("json");
		const updated = await updateWatcher(db, c.req.param("id"), updates);
		return c.json({ data: updated });
	},
);

watcherRoutes.delete("/watchers/:id", async (c) => {
	const db = c.get("db");
	await deleteWatcher(db, c.req.param("id"));
	return c.json({ data: { deleted: true } });
});

watcherRoutes.post("/watchers/evaluate", async (c) => {
	const db = c.get("db");

	// The spending power function and alert function are injected from app context
	const getSpendingPower = c.get("getSpendingPower");
	const sendAlert = c.get("sendAlert");

	const results = await evaluateAllActiveWatchers(db, getSpendingPower, sendAlert);
	return c.json({ data: results });
});
```

- [ ] **Step 4: Mount routes in index.ts**

Add to `apps/api/src/index.ts`:

```ts
import { watcherRoutes } from "./routes/watchers.js";
app.route("/", watcherRoutes);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd apps/api && bunx vitest run src/routes/__tests__/watchers.test.ts`
Expected: PASS

- [ ] **Step 6: Run lint**

Run: `bun run check`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/routes/watchers.ts apps/api/src/routes/__tests__/watchers.test.ts apps/api/src/index.ts
git commit -m "feat(api): add watcher CRUD and evaluation routes"
```
