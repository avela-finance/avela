import type { Database } from "@avela/core";

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
	handler: async (params: { paymentId: string }, _context: { db: Database }) => {
		// TODO: wire to funding-engine getPaymentStatus once Phase 6 lands
		return { paymentId: params.paymentId, status: "pending" };
	},
};
