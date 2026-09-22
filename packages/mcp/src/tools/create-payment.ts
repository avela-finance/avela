import type { Database } from "@avela/core";

export const createPaymentTool = {
	name: "avela.createPaymentIntent" as const,
	description: "Create a payment intent within the agent's permission scope",
	inputSchema: {
		type: "object" as const,
		properties: {
			agentId: {
				type: "string",
				description: "The agent ID initiating the payment",
			},
			amount: { type: "number", description: "Payment amount in USD" },
			recipient: {
				type: "string",
				description: "Recipient wallet address",
			},
		},
		required: ["agentId", "amount", "recipient"],
	},
	handler: async (
		params: { agentId: string; amount: number; recipient: string },
		context: { db: Database },
	) => {
		const { evaluateAgentPermission, getAgent } = await import("@avela/core");

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

		// TODO: wire to funding-engine createPaymentIntent once Phase 6 lands
		return {
			success: true,
			requiresApproval: evaluation.requiresApproval,
			accountId: agent.accountId,
			amount: params.amount,
			recipient: params.recipient,
		};
	},
};
