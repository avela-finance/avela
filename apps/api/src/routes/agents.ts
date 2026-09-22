import { Hono } from "hono";
import { z } from "zod";
import { AgentPermissionSchema } from "@avela/core";
import type { Agent, AgentPermission, AgentSpendingLog } from "@avela/core";

const registerAgentSchema = z.object({
	accountId: z.string().min(1),
	name: z.string().min(1).max(100),
	walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
	permissions: AgentPermissionSchema,
	expiresAt: z.string().datetime().optional(),
});

const updatePermissionsSchema = z.object({
	maxPerTransaction: z.number().nonnegative().optional(),
	maxPerDay: z.number().nonnegative().optional(),
	allowedAssets: z.array(z.string()).optional(),
	allowedRecipients: z.array(z.string()).optional(),
	requiresApproval: z.boolean().optional(),
	approvalThreshold: z.number().nonnegative().optional(),
});

type AgentDeps = {
	registerAgent: (params: {
		accountId: string;
		name: string;
		walletAddress: string;
		permissions: AgentPermission;
		expiresAt?: Date;
	}) => Promise<Agent>;
	getAgent: (agentId: string) => Promise<Agent | null>;
	updateAgentPermissions: (
		agentId: string,
		permissions: Partial<AgentPermission>,
	) => Promise<Agent>;
	revokeAgent: (agentId: string) => Promise<Agent>;
	getAgentSpendingLog: (agentId: string, limit?: number) => Promise<AgentSpendingLog[]>;
};

export function agentsRoutes(deps: AgentDeps) {
	const app = new Hono();

	app.post("/", async (c) => {
		const body = await c.req.json();
		const parsed = registerAgentSchema.safeParse(body);

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

		const { expiresAt, ...rest } = parsed.data;
		const agent = await deps.registerAgent({
			...rest,
			expiresAt: expiresAt ? new Date(expiresAt) : undefined,
		});

		return c.json({ data: agent }, 201);
	});

	app.get("/:id", async (c) => {
		const id = c.req.param("id");
		const agent = await deps.getAgent(id);

		if (!agent) {
			return c.json({ error: { code: "NOT_FOUND", message: `Agent ${id} not found` } }, 404);
		}

		return c.json({ data: agent });
	});

	app.get("/:id/permissions", async (c) => {
		const id = c.req.param("id");
		const agent = await deps.getAgent(id);

		if (!agent) {
			return c.json({ error: { code: "NOT_FOUND", message: `Agent ${id} not found` } }, 404);
		}

		return c.json({ data: agent.permissions });
	});

	app.put("/:id/permissions", async (c) => {
		const id = c.req.param("id");
		const body = await c.req.json();
		const parsed = updatePermissionsSchema.safeParse(body);

		if (!parsed.success) {
			return c.json(
				{
					error: {
						code: "VALIDATION_ERROR",
						message: "Invalid permissions update",
						details: parsed.error.flatten(),
					},
				},
				400,
			);
		}

		try {
			const updated = await deps.updateAgentPermissions(id, parsed.data);
			return c.json({ data: updated });
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error";
			if (message.includes("not found")) {
				return c.json({ error: { code: "NOT_FOUND", message: `Agent ${id} not found` } }, 404);
			}
			throw err;
		}
	});

	app.delete("/:id", async (c) => {
		const id = c.req.param("id");

		try {
			const revoked = await deps.revokeAgent(id);
			return c.json({ data: revoked });
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error";
			if (message.includes("not found")) {
				return c.json({ error: { code: "NOT_FOUND", message: `Agent ${id} not found` } }, 404);
			}
			throw err;
		}
	});

	app.get("/:id/spending-log", async (c) => {
		const id = c.req.param("id");
		const limitParam = c.req.query("limit");
		const limit = limitParam ? Number.parseInt(limitParam, 10) : 20;

		const log = await deps.getAgentSpendingLog(id, limit);
		return c.json({ data: log });
	});

	return app;
}
