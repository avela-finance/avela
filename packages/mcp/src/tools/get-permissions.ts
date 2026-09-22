import type { Database } from "@avela/core";

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
	handler: async (params: { agentId: string }, context: { db: Database }) => {
		const { getAgent } = await import("@avela/core");
		const agent = await getAgent(context.db, params.agentId);
		if (!agent) {
			throw new Error(`Agent ${params.agentId} not found`);
		}
		return agent.permissions;
	},
};
