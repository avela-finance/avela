import type { Database, PriceFeedAdapter } from "@avela/core";

export type GetBalanceContext = {
	db: Database;
	priceFeed: PriceFeedAdapter;
};

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
	handler: async (params: { accountId: string }, context: GetBalanceContext) => {
		const { calculateSpendingPower } = await import("@avela/core");
		return calculateSpendingPower(context.db, context.priceFeed, params.accountId);
	},
};
