import { desc, eq } from "drizzle-orm";
import { ulid } from "ulidx";
import { z } from "zod";
import type { Database } from "../db/client.js";
import { agentSpendingLogTable, agentsTable } from "../db/schema.js";
import type { Agent, AgentPermission, AgentSpendingLog } from "./types.js";
import { AgentPermissionSchema } from "./types.js";

const RegisterAgentInputSchema = z.object({
	accountId: z.string().min(1),
	name: z.string().min(1).max(100),
	walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
	permissions: AgentPermissionSchema,
	expiresAt: z.date().optional(),
});

type RegisterAgentInput = z.infer<typeof RegisterAgentInputSchema>;

export async function registerAgent(db: Database, input: RegisterAgentInput): Promise<Agent> {
	const validated = RegisterAgentInputSchema.parse(input);

	const [agent] = await db
		.insert(agentsTable)
		.values({
			id: ulid(),
			accountId: validated.accountId,
			name: validated.name,
			walletAddress: validated.walletAddress,
			permissions: validated.permissions,
			status: "active",
			expiresAt: validated.expiresAt ?? null,
		})
		.returning();

	return agent as Agent;
}

export async function getAgent(db: Database, agentId: string): Promise<Agent | null> {
	const rows = await db.select().from(agentsTable).where(eq(agentsTable.id, agentId));
	return (rows[0] as Agent) ?? null;
}

export async function getAgentsByAccount(db: Database, accountId: string): Promise<Agent[]> {
	const rows = await db
		.select()
		.from(agentsTable)
		.where(eq(agentsTable.accountId, accountId));
	return rows as Agent[];
}

export async function updateAgentPermissions(
	db: Database,
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
		.update(agentsTable)
		.set({ permissions: merged, updatedAt: new Date() })
		.where(eq(agentsTable.id, agentId))
		.returning();

	return updated as Agent;
}

export async function revokeAgent(db: Database, agentId: string): Promise<Agent> {
	const [revoked] = await db
		.update(agentsTable)
		.set({ status: "revoked", updatedAt: new Date() })
		.where(eq(agentsTable.id, agentId))
		.returning();

	if (!revoked) {
		throw new Error(`Agent ${agentId} not found`);
	}

	return revoked as Agent;
}

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
	db: Database,
	input: LogAgentSpendingInput,
): Promise<AgentSpendingLog> {
	const [entry] = await db
		.insert(agentSpendingLogTable)
		.values({
			id: ulid(),
			agentId: input.agentId,
			paymentIntentId: input.paymentIntentId,
			amount: input.amount.toFixed(6),
			asset: input.asset,
			recipient: input.recipient,
			permissionSnapshot: input.permissionSnapshot,
			status: input.status,
			decidedAt: new Date(),
		})
		.returning();

	if (!entry) {
		throw new Error("Failed to insert agent spending log entry");
	}

	return {
		...entry,
		amount: Number(entry.amount),
	} as AgentSpendingLog;
}

export async function getAgentSpendingLog(
	db: Database,
	agentId: string,
	limit = 20,
): Promise<AgentSpendingLog[]> {
	const rows = await db
		.select()
		.from(agentSpendingLogTable)
		.where(eq(agentSpendingLogTable.agentId, agentId))
		.orderBy(desc(agentSpendingLogTable.decidedAt))
		.limit(limit);

	return rows.map((row) => ({
		...row,
		amount: Number(row.amount),
	})) as AgentSpendingLog[];
}
