import { and, eq, gte, sql } from "drizzle-orm";
import type { Database } from "../db/client.js";
import { agentSpendingLogTable, agentsTable } from "../db/schema.js";
import { AgentPermissionSchema } from "./types.js";
import type { AgentPermissionEvaluation } from "./types.js";

export type EvaluateAgentPermissionInput = {
	agentId: string;
	amount: number;
	asset?: string;
	recipient: string;
};

export async function evaluateAgentPermission(
	db: Database,
	input: EvaluateAgentPermissionInput,
): Promise<AgentPermissionEvaluation> {
	const violations: string[] = [];

	// Fetch agent
	const agentRows = await db.select().from(agentsTable).where(eq(agentsTable.id, input.agentId));
	const agentRow = agentRows[0];

	if (!agentRow) {
		return {
			allowed: false,
			requiresApproval: false,
			violations: [`Agent ${input.agentId} not found`],
			dailySpent: 0,
			dailyRemaining: 0,
		};
	}

	// Check status (early return)
	if (agentRow.status !== "active") {
		return {
			allowed: false,
			requiresApproval: false,
			violations: [`Agent is not active (status: ${agentRow.status})`],
			dailySpent: 0,
			dailyRemaining: 0,
		};
	}

	// Check expiry (early return)
	if (agentRow.expiresAt && agentRow.expiresAt < new Date()) {
		return {
			allowed: false,
			requiresApproval: false,
			violations: ["Agent has expired"],
			dailySpent: 0,
			dailyRemaining: 0,
		};
	}

	// Parse permissions via Zod (no unsafe casts)
	const perms = AgentPermissionSchema.parse(agentRow.permissions);

	// Check per-transaction limit
	if (input.amount > perms.maxPerTransaction) {
		violations.push(
			`Amount $${input.amount} exceeds per-transaction limit of $${perms.maxPerTransaction}`,
		);
	}

	// Check asset allowlist
	if (input.asset && perms.allowedAssets.length > 0 && !perms.allowedAssets.includes(input.asset)) {
		violations.push(`Asset ${input.asset} not in allowed list: ${perms.allowedAssets.join(", ")}`);
	}

	// Check recipient allowlist (only when non-empty)
	if (
		perms.allowedRecipients.length > 0 &&
		!perms.allowedRecipients.includes(input.recipient.toLowerCase())
	) {
		violations.push(`Recipient ${input.recipient} not in allowed recipients`);
	}

	// Calculate daily spending (last 24h)
	const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
	const [dailyRow] = await db
		.select({ total: sql<string>`COALESCE(SUM(${agentSpendingLogTable.amount}), 0)` })
		.from(agentSpendingLogTable)
		.where(
			and(
				eq(agentSpendingLogTable.agentId, input.agentId),
				gte(agentSpendingLogTable.decidedAt, oneDayAgo),
			),
		);

	const dailySpent = Number(dailyRow!.total);
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
