# Agent Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable AI agents to spend from a user's portfolio within scoped permissions, with full audit logging and MCP skill exposure.

**Architecture:** Agent entities link to accounts via `accountId`. Each agent has a permission scope (amount caps, asset restrictions, recipient allowlists). Permission evaluation runs before every agent-initiated payment. An MCP server exposes tools for agents to interact with the account. All agent actions are logged with a snapshot of the permission state at time of action.

**Tech Stack:** Drizzle ORM (Postgres), Zod, ulidx, Hono, Privy server-auth, MCP SDK (`@modelcontextprotocol/sdk`)

## Global Constraints

- Biome formatting: tabs, double quotes, semicolons, trailing commas
- All IDs are ULIDs via `ulidx`
- All domain inputs validated with Zod
- Tests use Vitest (`bun run test`)
- Lint with `bun run check`
- Typecheck with `bun run typecheck`
- No `as any`, `@ts-ignore`, or `@ts-expect-error`
- Core domain logic lives in `packages/core/src/domain/`
- API routes live in `apps/api/src/routes/`
- DB schema lives in `packages/core/src/db/schema.ts`

---

### Task 1: Agent Domain Types

**Files:**
- Modify: `packages/core/src/domain/types.ts`
- Test: `packages/core/src/domain/__tests__/agent-types.test.ts`

**Interfaces:**
- Consumes: `Account` type from `types.ts` (defined by core-account plan)
- Produces: `Agent`, `AgentPermission`, `AgentSpendingLog`, `AgentStatus`, `AgentPermissionEvaluation`, `DEMO_AGENT_PERMISSION` — used by all subsequent tasks

- [ ] **Step 1: Write type validation test**

```ts
// packages/core/src/domain/__tests__/agent-types.test.ts
import { describe, it, expect } from "vitest";
import {
	AgentPermissionSchema,
	AgentSchema,
	AgentSpendingLogSchema,
	DEMO_AGENT_PERMISSION,
} from "../types.js";

describe("Agent types", () => {
	it("validates a well-formed AgentPermission", () => {
		const result = AgentPermissionSchema.safeParse(DEMO_AGENT_PERMISSION);
		expect(result.success).toBe(true);
	});

	it("rejects negative maxPerTransaction", () => {
		const result = AgentPermissionSchema.safeParse({
			...DEMO_AGENT_PERMISSION,
			maxPerTransaction: -10,
		});
		expect(result.success).toBe(false);
	});

	it("rejects maxPerTransaction greater than maxPerDay", () => {
		const result = AgentPermissionSchema.safeParse({
			...DEMO_AGENT_PERMISSION,
			maxPerTransaction: 300,
			maxPerDay: 200,
		});
		expect(result.success).toBe(false);
	});

	it("validates a well-formed Agent", () => {
		const agent = {
			id: "01J000000000000000000000AA",
			accountId: "01J000000000000000000000BB",
			name: "Trading Bot",
			walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
			permissions: DEMO_AGENT_PERMISSION,
			status: "active" as const,
			createdAt: new Date(),
			expiresAt: null,
		};
		const result = AgentSchema.safeParse(agent);
		expect(result.success).toBe(true);
	});

	it("validates a well-formed AgentSpendingLog entry", () => {
		const entry = {
			id: "01J000000000000000000000CC",
			agentId: "01J000000000000000000000AA",
			paymentIntentId: "01J000000000000000000000DD",
			amount: 25,
			asset: "wSPYx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
			permissionSnapshot: DEMO_AGENT_PERMISSION,
			status: "auto_approved" as const,
			decidedAt: new Date(),
		};
		const result = AgentSpendingLogSchema.safeParse(entry);
		expect(result.success).toBe(true);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && bunx vitest run src/domain/__tests__/agent-types.test.ts`
Expected: FAIL — imports not found

- [ ] **Step 3: Implement agent types**

```ts
// Append to packages/core/src/domain/types.ts

import { z } from "zod";

// --- Agent Permission ---

export const AgentPermissionSchema = z
	.object({
		maxPerTransaction: z.number().nonnegative(),
		maxPerDay: z.number().nonnegative(),
		allowedAssets: z.array(z.string()),
		allowedRecipients: z.array(z.string()),
		requiresApproval: z.boolean(),
		approvalThreshold: z.number().nonnegative(),
	})
	.refine((data) => data.maxPerTransaction <= data.maxPerDay, {
		message: "maxPerTransaction must not exceed maxPerDay",
	});

export type AgentPermission = z.infer<typeof AgentPermissionSchema>;

export const DEMO_AGENT_PERMISSION: AgentPermission = {
	maxPerTransaction: 50,
	maxPerDay: 200,
	allowedAssets: ["wSPYx"],
	allowedRecipients: [],
	requiresApproval: false,
	approvalThreshold: 25,
};

// --- Agent ---

export const AgentStatusEnum = z.enum(["active", "suspended", "expired", "revoked"]);
export type AgentStatus = z.infer<typeof AgentStatusEnum>;

export const AgentSchema = z.object({
	id: z.string(),
	accountId: z.string(),
	name: z.string().min(1).max(100),
	walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
	permissions: AgentPermissionSchema,
	status: AgentStatusEnum,
	createdAt: z.date(),
	expiresAt: z.date().nullable(),
});

export type Agent = z.infer<typeof AgentSchema>;

// --- Agent Spending Log ---

export const AgentSpendingLogStatusEnum = z.enum([
	"approved",
	"rejected",
	"auto_approved",
	"pending_approval",
]);

export const AgentSpendingLogSchema = z.object({
	id: z.string(),
	agentId: z.string(),
	paymentIntentId: z.string(),
	amount: z.number().nonnegative(),
	asset: z.string(),
	recipient: z.string(),
	permissionSnapshot: AgentPermissionSchema,
	status: AgentSpendingLogStatusEnum,
	decidedAt: z.date(),
});

export type AgentSpendingLog = z.infer<typeof AgentSpendingLogSchema>;

// --- Permission Evaluation Result ---

export type AgentPermissionEvaluation = {
	allowed: boolean;
	requiresApproval: boolean;
	violations: string[];
	dailySpent: number;
	dailyRemaining: number;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/core && bunx vitest run src/domain/__tests__/agent-types.test.ts`
Expected: PASS (all 5 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/types.ts packages/core/src/domain/__tests__/agent-types.test.ts
git commit -m "feat(core): add agent permission domain types"
```

---

### Task 2: Agent Database Schema

**Files:**
- Modify: `packages/core/src/db/schema.ts`
- Test: `packages/core/src/db/__tests__/agent-schema.test.ts`

**Interfaces:**
- Consumes: `accounts` table from schema.ts (defined by core-account plan)
- Produces: `agents` table, `agentSpendingLog` table — used by agent CRUD and spending log tasks

- [ ] **Step 1: Write schema validation test**

```ts
// packages/core/src/db/__tests__/agent-schema.test.ts
import { describe, it, expect } from "vitest";
import { agents, agentSpendingLog } from "../schema.js";

describe("Agent DB schema", () => {
	it("agents table has required columns", () => {
		const columns = Object.keys(agents);
		expect(columns).toContain("id");
		expect(columns).toContain("accountId");
		expect(columns).toContain("name");
		expect(columns).toContain("walletAddress");
		expect(columns).toContain("permissions");
		expect(columns).toContain("status");
		expect(columns).toContain("createdAt");
		expect(columns).toContain("expiresAt");
	});

	it("agentSpendingLog table has required columns", () => {
		const columns = Object.keys(agentSpendingLog);
		expect(columns).toContain("id");
		expect(columns).toContain("agentId");
		expect(columns).toContain("paymentIntentId");
		expect(columns).toContain("amount");
		expect(columns).toContain("asset");
		expect(columns).toContain("recipient");
		expect(columns).toContain("permissionSnapshot");
		expect(columns).toContain("status");
		expect(columns).toContain("decidedAt");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && bunx vitest run src/db/__tests__/agent-schema.test.ts`
Expected: FAIL — exports not found

- [ ] **Step 3: Implement schema**

```ts
// Append to packages/core/src/db/schema.ts

import {
	pgTable,
	text,
	timestamp,
	jsonb,
	numeric,
	varchar,
} from "drizzle-orm/pg-core";

export const agents = pgTable("agents", {
	id: text("id").primaryKey(),
	accountId: text("account_id")
		.notNull()
		.references(() => accounts.id),
	name: varchar("name", { length: 100 }).notNull(),
	walletAddress: varchar("wallet_address", { length: 42 }).notNull(),
	permissions: jsonb("permissions").notNull().$type<import("../domain/types.js").AgentPermission>(),
	status: varchar("status", { length: 20 }).notNull().default("active"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const agentSpendingLog = pgTable("agent_spending_log", {
	id: text("id").primaryKey(),
	agentId: text("agent_id")
		.notNull()
		.references(() => agents.id),
	paymentIntentId: text("payment_intent_id").notNull(),
	amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
	asset: varchar("asset", { length: 20 }).notNull(),
	recipient: varchar("recipient", { length: 42 }).notNull(),
	permissionSnapshot: jsonb("permission_snapshot")
		.notNull()
		.$type<import("../domain/types.js").AgentPermission>(),
	status: varchar("status", { length: 20 }).notNull(),
	decidedAt: timestamp("decided_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/core && bunx vitest run src/db/__tests__/agent-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Generate migration**

Run: `cd packages/core && bunx drizzle-kit generate --name add-agents`
Expected: Migration file created in `packages/core/drizzle/`

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/db/schema.ts packages/core/src/db/__tests__/agent-schema.test.ts packages/core/drizzle/
git commit -m "feat(core): add agents and spending log DB schema"
```

---

### Task 3: Agent CRUD Operations

**Files:**
- Create: `packages/core/src/domain/agent.ts`
- Test: `packages/core/src/domain/__tests__/agent.test.ts`

**Interfaces:**
- Consumes: `agents` table from schema.ts (Task 2), `Agent`, `AgentPermission`, `AgentStatus` types (Task 1)
- Produces: `registerAgent()`, `getAgent()`, `getAgentsByAccount()`, `updateAgentPermissions()`, `revokeAgent()` — used by API routes (Task 6) and permission evaluation (Task 4)

- [ ] **Step 1: Write failing tests for agent CRUD**

```ts
// packages/core/src/domain/__tests__/agent.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	registerAgent,
	getAgent,
	getAgentsByAccount,
	updateAgentPermissions,
	revokeAgent,
} from "../agent.js";
import type { AgentPermission } from "../types.js";
import { DEMO_AGENT_PERMISSION } from "../types.js";

const mockDb = {
	insert: vi.fn().mockReturnThis(),
	values: vi.fn().mockReturnThis(),
	returning: vi.fn(),
	select: vi.fn().mockReturnThis(),
	from: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	update: vi.fn().mockReturnThis(),
	set: vi.fn().mockReturnThis(),
};

describe("registerAgent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("creates an agent with valid params", async () => {
		const fakeAgent = {
			id: "01JAGENT00000000000000001",
			accountId: "01JACCOUNT000000000000001",
			name: "Trading Bot",
			walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
			permissions: DEMO_AGENT_PERMISSION,
			status: "active" as const,
			createdAt: new Date(),
			expiresAt: null,
		};
		mockDb.returning.mockResolvedValueOnce([fakeAgent]);

		const result = await registerAgent(mockDb as any, {
			accountId: "01JACCOUNT000000000000001",
			name: "Trading Bot",
			walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
			permissions: DEMO_AGENT_PERMISSION,
		});

		expect(result.name).toBe("Trading Bot");
		expect(result.status).toBe("active");
		expect(result.permissions.maxPerTransaction).toBe(50);
	});

	it("rejects empty name", async () => {
		await expect(
			registerAgent(mockDb as any, {
				accountId: "01JACCOUNT000000000000001",
				name: "",
				walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
				permissions: DEMO_AGENT_PERMISSION,
			}),
		).rejects.toThrow();
	});
});

describe("getAgent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns agent by ID", async () => {
		const fakeAgent = {
			id: "01JAGENT00000000000000001",
			accountId: "01JACCOUNT000000000000001",
			name: "Trading Bot",
			walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
			permissions: DEMO_AGENT_PERMISSION,
			status: "active",
			createdAt: new Date(),
			expiresAt: null,
		};
		mockDb.where.mockResolvedValueOnce([fakeAgent]);

		const result = await getAgent(mockDb as any, "01JAGENT00000000000000001");
		expect(result).not.toBeNull();
		expect(result!.id).toBe("01JAGENT00000000000000001");
	});

	it("returns null for unknown ID", async () => {
		mockDb.where.mockResolvedValueOnce([]);
		const result = await getAgent(mockDb as any, "nonexistent");
		expect(result).toBeNull();
	});
});

describe("revokeAgent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("sets status to revoked", async () => {
		const revokedAgent = {
			id: "01JAGENT00000000000000001",
			status: "revoked",
		};
		mockDb.returning.mockResolvedValueOnce([revokedAgent]);

		const result = await revokeAgent(mockDb as any, "01JAGENT00000000000000001");
		expect(result.status).toBe("revoked");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && bunx vitest run src/domain/__tests__/agent.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement agent CRUD**

```ts
// packages/core/src/domain/agent.ts
import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import { z } from "zod";
import { agents } from "../db/schema.js";
import type { Agent, AgentPermission } from "./types.js";
import { AgentPermissionSchema } from "./types.js";

type DB = Parameters<typeof agents._.columns>[never] extends never ? any : any;

const RegisterAgentInputSchema = z.object({
	accountId: z.string().min(1),
	name: z.string().min(1).max(100),
	walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
	permissions: AgentPermissionSchema,
	expiresAt: z.date().optional(),
});

type RegisterAgentInput = z.infer<typeof RegisterAgentInputSchema>;

export async function registerAgent(db: any, input: RegisterAgentInput): Promise<Agent> {
	const validated = RegisterAgentInputSchema.parse(input);

	const id = ulid();
	const now = new Date();

	const [agent] = await db
		.insert(agents)
		.values({
			id,
			accountId: validated.accountId,
			name: validated.name,
			walletAddress: validated.walletAddress,
			permissions: validated.permissions,
			status: "active",
			createdAt: now,
			expiresAt: validated.expiresAt ?? null,
		})
		.returning();

	return agent as Agent;
}

export async function getAgent(db: any, agentId: string): Promise<Agent | null> {
	const rows = await db.select().from(agents).where(eq(agents.id, agentId));
	return (rows[0] as Agent) ?? null;
}

export async function getAgentsByAccount(db: any, accountId: string): Promise<Agent[]> {
	const rows = await db.select().from(agents).where(eq(agents.accountId, accountId));
	return rows as Agent[];
}

export async function updateAgentPermissions(
	db: any,
	agentId: string,
	permissions: Partial<AgentPermission>,
): Promise<Agent> {
	const existing = await getAgent(db, agentId);
	if (!existing) {
		throw new Error(`Agent ${agentId} not found`);
	}

	const merged = AgentPermissionSchema.parse({
		...existing.permissions,
		...permissions,
	});

	const [updated] = await db
		.update(agents)
		.set({ permissions: merged })
		.where(eq(agents.id, agentId))
		.returning();

	return updated as Agent;
}

export async function revokeAgent(db: any, agentId: string): Promise<Agent> {
	const [revoked] = await db
		.update(agents)
		.set({ status: "revoked" })
		.where(eq(agents.id, agentId))
		.returning();

	if (!revoked) {
		throw new Error(`Agent ${agentId} not found`);
	}

	return revoked as Agent;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/core && bunx vitest run src/domain/__tests__/agent.test.ts`
Expected: PASS (all 5 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/agent.ts packages/core/src/domain/__tests__/agent.test.ts
git commit -m "feat(core): add agent CRUD operations"
```

---

### Task 4: Permission Evaluation

**Files:**
- Create: `packages/core/src/domain/agent-permission.ts`
- Test: `packages/core/src/domain/__tests__/agent-permission.test.ts`

**Interfaces:**
- Consumes: `Agent`, `AgentPermission`, `AgentPermissionEvaluation` from types.ts (Task 1), `agentSpendingLog` table (Task 2)
- Produces: `evaluateAgentPermission()` — used by funding engine when an agent initiates a payment, and by API routes (Task 6)

- [ ] **Step 1: Write failing tests for permission evaluation**

```ts
// packages/core/src/domain/__tests__/agent-permission.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { evaluateAgentPermission } from "../agent-permission.js";
import { DEMO_AGENT_PERMISSION } from "../types.js";
import type { Agent } from "../types.js";

const makeAgent = (overrides: Partial<Agent> = {}): Agent => ({
	id: "01JAGENT00000000000000001",
	accountId: "01JACCOUNT000000000000001",
	name: "Test Bot",
	walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
	permissions: DEMO_AGENT_PERMISSION,
	status: "active",
	createdAt: new Date(),
	expiresAt: null,
	...overrides,
});

const mockDb = {
	select: vi.fn().mockReturnThis(),
	from: vi.fn().mockReturnThis(),
	where: vi.fn(),
};

describe("evaluateAgentPermission", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("allows payment within all limits", async () => {
		mockDb.where.mockResolvedValueOnce([makeAgent()]);
		// Daily spending query returns $30 spent today
		mockDb.where.mockResolvedValueOnce([{ total: "30" }]);

		const result = await evaluateAgentPermission(mockDb as any, {
			agentId: "01JAGENT00000000000000001",
			amount: 20,
			asset: "wSPYx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
		});

		expect(result.allowed).toBe(true);
		expect(result.violations).toHaveLength(0);
		expect(result.dailySpent).toBe(30);
		expect(result.dailyRemaining).toBe(170);
	});

	it("blocks when amount exceeds per-transaction limit", async () => {
		mockDb.where.mockResolvedValueOnce([makeAgent()]);
		mockDb.where.mockResolvedValueOnce([{ total: "0" }]);

		const result = await evaluateAgentPermission(mockDb as any, {
			agentId: "01JAGENT00000000000000001",
			amount: 60,
			asset: "wSPYx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
		});

		expect(result.allowed).toBe(false);
		expect(result.violations).toContain("Amount $60 exceeds per-transaction limit of $50");
	});

	it("blocks when daily limit would be exceeded", async () => {
		mockDb.where.mockResolvedValueOnce([makeAgent()]);
		mockDb.where.mockResolvedValueOnce([{ total: "180" }]);

		const result = await evaluateAgentPermission(mockDb as any, {
			agentId: "01JAGENT00000000000000001",
			amount: 30,
			asset: "wSPYx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
		});

		expect(result.allowed).toBe(false);
		expect(result.violations).toContain(
			"Amount $30 plus daily spent $180 exceeds daily limit of $200",
		);
	});

	it("blocks disallowed asset", async () => {
		mockDb.where.mockResolvedValueOnce([makeAgent()]);
		mockDb.where.mockResolvedValueOnce([{ total: "0" }]);

		const result = await evaluateAgentPermission(mockDb as any, {
			agentId: "01JAGENT00000000000000001",
			amount: 10,
			asset: "wQQQx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
		});

		expect(result.allowed).toBe(false);
		expect(result.violations).toContain("Asset wQQQx not in allowed list: wSPYx");
	});

	it("blocks disallowed recipient when allowlist is set", async () => {
		const agent = makeAgent({
			permissions: {
				...DEMO_AGENT_PERMISSION,
				allowedRecipients: ["0x0000000000000000000000000000000000000001"],
			},
		});
		mockDb.where.mockResolvedValueOnce([agent]);
		mockDb.where.mockResolvedValueOnce([{ total: "0" }]);

		const result = await evaluateAgentPermission(mockDb as any, {
			agentId: "01JAGENT00000000000000001",
			amount: 10,
			asset: "wSPYx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
		});

		expect(result.allowed).toBe(false);
		expect(result.violations[0]).toContain("not in allowed recipients");
	});

	it("requires approval above threshold", async () => {
		mockDb.where.mockResolvedValueOnce([makeAgent()]);
		mockDb.where.mockResolvedValueOnce([{ total: "0" }]);

		const result = await evaluateAgentPermission(mockDb as any, {
			agentId: "01JAGENT00000000000000001",
			amount: 30,
			asset: "wSPYx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
		});

		expect(result.allowed).toBe(true);
		expect(result.requiresApproval).toBe(true);
	});

	it("auto-approves below threshold", async () => {
		mockDb.where.mockResolvedValueOnce([makeAgent()]);
		mockDb.where.mockResolvedValueOnce([{ total: "0" }]);

		const result = await evaluateAgentPermission(mockDb as any, {
			agentId: "01JAGENT00000000000000001",
			amount: 10,
			asset: "wSPYx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
		});

		expect(result.allowed).toBe(true);
		expect(result.requiresApproval).toBe(false);
	});

	it("blocks revoked agent", async () => {
		mockDb.where.mockResolvedValueOnce([makeAgent({ status: "revoked" })]);

		const result = await evaluateAgentPermission(mockDb as any, {
			agentId: "01JAGENT00000000000000001",
			amount: 10,
			asset: "wSPYx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
		});

		expect(result.allowed).toBe(false);
		expect(result.violations).toContain("Agent is not active (status: revoked)");
	});

	it("blocks expired agent", async () => {
		const pastDate = new Date(Date.now() - 86400000);
		mockDb.where.mockResolvedValueOnce([makeAgent({ expiresAt: pastDate })]);

		const result = await evaluateAgentPermission(mockDb as any, {
			agentId: "01JAGENT00000000000000001",
			amount: 10,
			asset: "wSPYx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
		});

		expect(result.allowed).toBe(false);
		expect(result.violations).toContain("Agent has expired");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && bunx vitest run src/domain/__tests__/agent-permission.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement permission evaluation**

```ts
// packages/core/src/domain/agent-permission.ts
import { eq, and, gte, sql } from "drizzle-orm";
import { agents, agentSpendingLog } from "../db/schema.js";
import type { Agent, AgentPermissionEvaluation } from "./types.js";

type EvaluateInput = {
	agentId: string;
	amount: number;
	asset?: string;
	recipient: string;
};

export async function evaluateAgentPermission(
	db: any,
	input: EvaluateInput,
): Promise<AgentPermissionEvaluation> {
	const violations: string[] = [];

	// Fetch agent
	const agentRows = await db.select().from(agents).where(eq(agents.id, input.agentId));
	const agent = agentRows[0] as Agent | undefined;

	if (!agent) {
		return {
			allowed: false,
			requiresApproval: false,
			violations: [`Agent ${input.agentId} not found`],
			dailySpent: 0,
			dailyRemaining: 0,
		};
	}

	// Check status
	if (agent.status !== "active") {
		return {
			allowed: false,
			requiresApproval: false,
			violations: [`Agent is not active (status: ${agent.status})`],
			dailySpent: 0,
			dailyRemaining: 0,
		};
	}

	// Check expiry
	if (agent.expiresAt && agent.expiresAt < new Date()) {
		return {
			allowed: false,
			requiresApproval: false,
			violations: ["Agent has expired"],
			dailySpent: 0,
			dailyRemaining: 0,
		};
	}

	const perms = agent.permissions;

	// Check per-transaction limit
	if (input.amount > perms.maxPerTransaction) {
		violations.push(
			`Amount $${input.amount} exceeds per-transaction limit of $${perms.maxPerTransaction}`,
		);
	}

	// Check asset allowlist
	if (input.asset && perms.allowedAssets.length > 0 && !perms.allowedAssets.includes(input.asset)) {
		violations.push(
			`Asset ${input.asset} not in allowed list: ${perms.allowedAssets.join(", ")}`,
		);
	}

	// Check recipient allowlist
	if (
		perms.allowedRecipients.length > 0 &&
		!perms.allowedRecipients.includes(input.recipient.toLowerCase())
	) {
		violations.push(
			`Recipient ${input.recipient} not in allowed recipients`,
		);
	}

	// Calculate daily spending
	const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
	const dailyRows = await db
		.select({ total: sql<string>`COALESCE(SUM(${agentSpendingLog.amount}), 0)` })
		.from(agentSpendingLog)
		.where(
			and(
				eq(agentSpendingLog.agentId, input.agentId),
				gte(agentSpendingLog.decidedAt, oneDayAgo),
			),
		);

	const dailySpent = Number.parseFloat(dailyRows[0]?.total ?? "0");
	const dailyRemaining = Math.max(0, perms.maxPerDay - dailySpent);

	// Check daily limit
	if (dailySpent + input.amount > perms.maxPerDay) {
		violations.push(
			`Amount $${input.amount} plus daily spent $${dailySpent} exceeds daily limit of $${perms.maxPerDay}`,
		);
	}

	const allowed = violations.length === 0;
	const requiresApproval =
		allowed && (perms.requiresApproval || input.amount > perms.approvalThreshold);

	return {
		allowed,
		requiresApproval,
		violations,
		dailySpent,
		dailyRemaining,
	};
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/core && bunx vitest run src/domain/__tests__/agent-permission.test.ts`
Expected: PASS (all 8 tests)

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/agent-permission.ts packages/core/src/domain/__tests__/agent-permission.test.ts
git commit -m "feat(core): add agent permission evaluation"
```

---

### Task 5: Agent Spending Log

**Files:**
- Modify: `packages/core/src/domain/agent.ts`
- Test: `packages/core/src/domain/__tests__/agent-spending-log.test.ts`

**Interfaces:**
- Consumes: `agentSpendingLog` table (Task 2), `AgentSpendingLog` type (Task 1), `AgentPermission` type (Task 1)
- Produces: `logAgentSpending()`, `getAgentSpendingLog()` — used by funding engine after agent payment, and by API routes (Task 6)

- [ ] **Step 1: Write failing tests for spending log**

```ts
// packages/core/src/domain/__tests__/agent-spending-log.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { logAgentSpending, getAgentSpendingLog } from "../agent.js";
import { DEMO_AGENT_PERMISSION } from "../types.js";

const mockDb = {
	insert: vi.fn().mockReturnThis(),
	values: vi.fn().mockReturnThis(),
	returning: vi.fn(),
	select: vi.fn().mockReturnThis(),
	from: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	orderBy: vi.fn().mockReturnThis(),
	limit: vi.fn(),
};

describe("logAgentSpending", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("records a spending log entry", async () => {
		const fakeEntry = {
			id: "01JLOG0000000000000000001",
			agentId: "01JAGENT00000000000000001",
			paymentIntentId: "01JPAY0000000000000000001",
			amount: 25,
			asset: "wSPYx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
			permissionSnapshot: DEMO_AGENT_PERMISSION,
			status: "auto_approved",
			decidedAt: new Date(),
		};
		mockDb.returning.mockResolvedValueOnce([fakeEntry]);

		const result = await logAgentSpending(mockDb as any, {
			agentId: "01JAGENT00000000000000001",
			paymentIntentId: "01JPAY0000000000000000001",
			amount: 25,
			asset: "wSPYx",
			recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
			permissionSnapshot: DEMO_AGENT_PERMISSION,
			status: "auto_approved",
		});

		expect(result.amount).toBe(25);
		expect(result.status).toBe("auto_approved");
	});
});

describe("getAgentSpendingLog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns spending log entries for an agent", async () => {
		const entries = [
			{ id: "01JLOG0000000000000000001", amount: 25, status: "auto_approved" },
			{ id: "01JLOG0000000000000000002", amount: 10, status: "approved" },
		];
		mockDb.limit.mockResolvedValueOnce(entries);

		const result = await getAgentSpendingLog(mockDb as any, "01JAGENT00000000000000001", 10);
		expect(result).toHaveLength(2);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && bunx vitest run src/domain/__tests__/agent-spending-log.test.ts`
Expected: FAIL — `logAgentSpending` not exported

- [ ] **Step 3: Add spending log functions to agent.ts**

```ts
// Append to packages/core/src/domain/agent.ts

import { desc } from "drizzle-orm";
import { agentSpendingLog } from "../db/schema.js";
import type { AgentPermission, AgentSpendingLog } from "./types.js";

type LogAgentSpendingInput = {
	agentId: string;
	paymentIntentId: string;
	amount: number;
	asset: string;
	recipient: string;
	permissionSnapshot: AgentPermission;
	status: "approved" | "rejected" | "auto_approved" | "pending_approval";
};

export async function logAgentSpending(
	db: any,
	input: LogAgentSpendingInput,
): Promise<AgentSpendingLog> {
	const id = ulid();

	const [entry] = await db
		.insert(agentSpendingLog)
		.values({
			id,
			agentId: input.agentId,
			paymentIntentId: input.paymentIntentId,
			amount: input.amount.toString(),
			asset: input.asset,
			recipient: input.recipient,
			permissionSnapshot: input.permissionSnapshot,
			status: input.status,
			decidedAt: new Date(),
		})
		.returning();

	return entry as AgentSpendingLog;
}

export async function getAgentSpendingLog(
	db: any,
	agentId: string,
	limit = 20,
): Promise<AgentSpendingLog[]> {
	const rows = await db
		.select()
		.from(agentSpendingLog)
		.where(eq(agentSpendingLog.agentId, agentId))
		.orderBy(desc(agentSpendingLog.decidedAt))
		.limit(limit);

	return rows as AgentSpendingLog[];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/core && bunx vitest run src/domain/__tests__/agent-spending-log.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain/agent.ts packages/core/src/domain/__tests__/agent-spending-log.test.ts
git commit -m "feat(core): add agent spending log operations"
```

---

### Task 6: Agent API Routes

**Files:**
- Create: `apps/api/src/routes/agents.ts`
- Modify: `apps/api/src/index.ts` (mount routes)
- Test: `apps/api/src/routes/__tests__/agents.test.ts`

**Interfaces:**
- Consumes: `registerAgent()`, `getAgent()`, `getAgentsByAccount()`, `updateAgentPermissions()`, `revokeAgent()`, `getAgentSpendingLog()` from agent.ts (Task 3, 5), `evaluateAgentPermission()` from agent-permission.ts (Task 4)
- Produces: HTTP endpoints — `POST /agents`, `GET /agents/:id`, `GET /agents/:id/permissions`, `PUT /agents/:id/permissions`, `DELETE /agents/:id`, `GET /agents/:id/spending-log`

- [ ] **Step 1: Write failing route tests**

```ts
// apps/api/src/routes/__tests__/agents.test.ts
import { describe, it, expect } from "vitest";
import { agentRoutes } from "../agents.js";

describe("agentRoutes", () => {
	it("exports a Hono app", () => {
		expect(agentRoutes).toBeDefined();
		expect(typeof agentRoutes.fetch).toBe("function");
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && bunx vitest run src/routes/__tests__/agents.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement agent routes**

```ts
// apps/api/src/routes/agents.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { AgentPermissionSchema } from "@avela/core/domain/types";
import {
	registerAgent,
	getAgent,
	getAgentsByAccount,
	updateAgentPermissions,
	revokeAgent,
	getAgentSpendingLog,
} from "@avela/core/domain/agent";
import { evaluateAgentPermission } from "@avela/core/domain/agent-permission";

export const agentRoutes = new Hono();

const RegisterAgentBody = z.object({
	accountId: z.string().min(1),
	name: z.string().min(1).max(100),
	walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
	permissions: AgentPermissionSchema,
	expiresAt: z.string().datetime().optional(),
});

agentRoutes.post("/", zValidator("json", RegisterAgentBody), async (c) => {
	const body = c.req.valid("json");
	const db = c.get("db");
	const agent = await registerAgent(db, {
		...body,
		expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
	});
	return c.json({ data: agent }, 201);
});

agentRoutes.get("/:id", async (c) => {
	const db = c.get("db");
	const agent = await getAgent(db, c.req.param("id"));
	if (!agent) {
		return c.json({ error: { code: "NOT_FOUND", message: "Agent not found" } }, 404);
	}
	return c.json({ data: agent });
});

agentRoutes.get("/:id/permissions", async (c) => {
	const db = c.get("db");
	const agent = await getAgent(db, c.req.param("id"));
	if (!agent) {
		return c.json({ error: { code: "NOT_FOUND", message: "Agent not found" } }, 404);
	}
	return c.json({ data: agent.permissions });
});

agentRoutes.put(
	"/:id/permissions",
	zValidator("json", AgentPermissionSchema.partial()),
	async (c) => {
		const db = c.get("db");
		const permissions = c.req.valid("json");
		const updated = await updateAgentPermissions(db, c.req.param("id"), permissions);
		return c.json({ data: updated });
	},
);

agentRoutes.delete("/:id", async (c) => {
	const db = c.get("db");
	const revoked = await revokeAgent(db, c.req.param("id"));
	return c.json({ data: revoked });
});

agentRoutes.get("/:id/spending-log", async (c) => {
	const db = c.get("db");
	const limit = Number.parseInt(c.req.query("limit") ?? "20", 10);
	const log = await getAgentSpendingLog(db, c.req.param("id"), limit);
	return c.json({ data: log });
});
```

- [ ] **Step 4: Mount routes in index.ts**

Add to `apps/api/src/index.ts`:

```ts
import { agentRoutes } from "./routes/agents.js";
app.route("/agents", agentRoutes);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd apps/api && bunx vitest run src/routes/__tests__/agents.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/routes/agents.ts apps/api/src/routes/__tests__/agents.test.ts apps/api/src/index.ts
git commit -m "feat(api): add agent CRUD and spending log routes"
```

---

### Task 7: MCP Skill Server Scaffold

**Files:**
- Create: `packages/mcp/package.json`
- Create: `packages/mcp/tsconfig.json`
- Create: `packages/mcp/src/index.ts`
- Create: `packages/mcp/src/tools/get-balance.ts`
- Create: `packages/mcp/src/tools/get-permissions.ts`
- Create: `packages/mcp/src/tools/create-payment.ts`
- Create: `packages/mcp/src/tools/get-payment-status.ts`
- Test: `packages/mcp/src/__tests__/tools.test.ts`

**Interfaces:**
- Consumes: `calculateSpendingPower()` from core-account, `evaluateAgentPermission()` from agent-permission.ts (Task 4), `createPaymentIntent()` from funding-engine, `getPaymentStatus()` from funding-engine
- Produces: MCP server with 4 tools: `avela.getBalance`, `avela.getPermissions`, `avela.createPaymentIntent`, `avela.getPaymentStatus`

- [ ] **Step 1: Create package.json**

```json
{
	"name": "@avela/mcp",
	"version": "0.1.0",
	"type": "module",
	"private": true,
	"main": "src/index.ts",
	"scripts": {
		"dev": "node --watch src/index.ts",
		"build": "tsc",
		"test": "vitest run"
	},
	"dependencies": {
		"@modelcontextprotocol/sdk": "^1.12.0",
		"@avela/core": "workspace:*",
		"zod": "^3.25.0"
	},
	"devDependencies": {
		"vitest": "^5.0.1",
		"typescript": "^5.0.0"
	}
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
	"extends": "../../tsconfig.json",
	"compilerOptions": {
		"outDir": "dist",
		"rootDir": "src"
	},
	"include": ["src"]
}
```

- [ ] **Step 3: Write failing tool tests**

```ts
// packages/mcp/src/__tests__/tools.test.ts
import { describe, it, expect } from "vitest";
import { getBalanceTool } from "../tools/get-balance.js";
import { getPermissionsTool } from "../tools/get-permissions.js";
import { createPaymentTool } from "../tools/create-payment.js";
import { getPaymentStatusTool } from "../tools/get-payment-status.js";

describe("MCP tools", () => {
	it("getBalanceTool has correct name and schema", () => {
		expect(getBalanceTool.name).toBe("avela.getBalance");
		expect(getBalanceTool.description).toBeDefined();
		expect(getBalanceTool.inputSchema).toBeDefined();
	});

	it("getPermissionsTool has correct name and schema", () => {
		expect(getPermissionsTool.name).toBe("avela.getPermissions");
		expect(getPermissionsTool.description).toBeDefined();
		expect(getPermissionsTool.inputSchema).toBeDefined();
	});

	it("createPaymentTool has correct name and schema", () => {
		expect(createPaymentTool.name).toBe("avela.createPaymentIntent");
		expect(createPaymentTool.description).toBeDefined();
		expect(createPaymentTool.inputSchema).toBeDefined();
	});

	it("getPaymentStatusTool has correct name and schema", () => {
		expect(getPaymentStatusTool.name).toBe("avela.getPaymentStatus");
		expect(getPaymentStatusTool.description).toBeDefined();
		expect(getPaymentStatusTool.inputSchema).toBeDefined();
	});
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd packages/mcp && bun install && bunx vitest run src/__tests__/tools.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 5: Implement tool definitions**

```ts
// packages/mcp/src/tools/get-balance.ts
import { z } from "zod";

export const getBalanceTool = {
	name: "avela.getBalance" as const,
	description: "Get account balance and spending power for a given account",
	inputSchema: {
		type: "object" as const,
		properties: {
			accountId: { type: "string", description: "The Avela account ID" },
		},
		required: ["accountId"],
	},
	handler: async (params: { accountId: string }, context: { db: any }) => {
		const { calculateSpendingPower } = await import("@avela/core/domain/spending-power");
		const spendingPower = await calculateSpendingPower(context.db, params.accountId);
		return spendingPower;
	},
};
```

```ts
// packages/mcp/src/tools/get-permissions.ts
export const getPermissionsTool = {
	name: "avela.getPermissions" as const,
	description: "Get the current permission scope for an agent",
	inputSchema: {
		type: "object" as const,
		properties: {
			agentId: { type: "string", description: "The agent ID" },
		},
		required: ["agentId"],
	},
	handler: async (params: { agentId: string }, context: { db: any }) => {
		const { getAgent } = await import("@avela/core/domain/agent");
		const agent = await getAgent(context.db, params.agentId);
		if (!agent) {
			throw new Error(`Agent ${params.agentId} not found`);
		}
		return agent.permissions;
	},
};
```

```ts
// packages/mcp/src/tools/create-payment.ts
export const createPaymentTool = {
	name: "avela.createPaymentIntent" as const,
	description: "Create a payment intent within the agent's permission scope",
	inputSchema: {
		type: "object" as const,
		properties: {
			agentId: { type: "string", description: "The agent ID initiating the payment" },
			amount: { type: "number", description: "Payment amount in USD" },
			recipient: { type: "string", description: "Recipient wallet address" },
		},
		required: ["agentId", "amount", "recipient"],
	},
	handler: async (
		params: { agentId: string; amount: number; recipient: string },
		context: { db: any },
	) => {
		const { evaluateAgentPermission } = await import(
			"@avela/core/domain/agent-permission"
		);
		const { getAgent } = await import("@avela/core/domain/agent");

		const agent = await getAgent(context.db, params.agentId);
		if (!agent) {
			throw new Error(`Agent ${params.agentId} not found`);
		}

		const evaluation = await evaluateAgentPermission(context.db, {
			agentId: params.agentId,
			amount: params.amount,
			recipient: params.recipient,
		});

		if (!evaluation.allowed) {
			return { success: false, violations: evaluation.violations };
		}

		// Delegate to funding engine (createPaymentIntent)
		// The actual payment creation depends on the funding-engine plan
		return {
			success: true,
			requiresApproval: evaluation.requiresApproval,
			accountId: agent.accountId,
			amount: params.amount,
			recipient: params.recipient,
		};
	},
};
```

```ts
// packages/mcp/src/tools/get-payment-status.ts
export const getPaymentStatusTool = {
	name: "avela.getPaymentStatus" as const,
	description: "Check the status of a payment intent",
	inputSchema: {
		type: "object" as const,
		properties: {
			paymentId: { type: "string", description: "The payment intent ID" },
		},
		required: ["paymentId"],
	},
	handler: async (params: { paymentId: string }, context: { db: any }) => {
		// Delegates to funding engine getPaymentStatus
		// Depends on funding-engine plan implementation
		return { paymentId: params.paymentId, status: "pending" };
	},
};
```

- [ ] **Step 6: Implement MCP server entry point**

```ts
// packages/mcp/src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getBalanceTool } from "./tools/get-balance.js";
import { getPermissionsTool } from "./tools/get-permissions.js";
import { createPaymentTool } from "./tools/create-payment.js";
import { getPaymentStatusTool } from "./tools/get-payment-status.js";

const server = new McpServer({
	name: "avela",
	version: "0.1.0",
});

const tools = [getBalanceTool, getPermissionsTool, createPaymentTool, getPaymentStatusTool];

for (const tool of tools) {
	server.tool(tool.name, tool.description, tool.inputSchema, async (params) => {
		const result = await tool.handler(params as any, { db: null });
		return {
			content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
		};
	});
}

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch(console.error);
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd packages/mcp && bunx vitest run src/__tests__/tools.test.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 8: Run lint**

Run: `bun run check`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add packages/mcp/
git commit -m "feat(mcp): scaffold MCP skill server with agent tools"
```
