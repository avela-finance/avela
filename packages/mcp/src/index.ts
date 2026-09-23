import type { PriceFeedAdapter } from "@avela/core";
import { createDb } from "@avela/core";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createPaymentTool } from "./tools/create-payment.js";
import { getBalanceTool } from "./tools/get-balance.js";
import { getPaymentStatusTool } from "./tools/get-payment-status.js";
import { getPermissionsTool } from "./tools/get-permissions.js";

const db = createDb(process.env.DATABASE_URL!);

// TODO: inject poolMap from config (pool addresses from SPEC.md xStock assets)
// createUniswapTwapAdapter requires a viem PublicClient + poolMap
const priceFeed: PriceFeedAdapter = {
	getPrice: async () => {
		throw new Error("priceFeed not configured — inject via env/config");
	},
};

const server = new McpServer({
	name: "avela",
	version: "0.1.0",
});

// avela.getBalance
server.registerTool(
	getBalanceTool.name,
	{
		description: getBalanceTool.description,
		inputSchema: { accountId: z.string().describe("The Avela account ID") },
	},
	async ({ accountId }) => {
		const result = await getBalanceTool.handler({ accountId }, { db, priceFeed });
		return {
			content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
		};
	},
);

// avela.getPermissions
server.registerTool(
	getPermissionsTool.name,
	{
		description: getPermissionsTool.description,
		inputSchema: { agentId: z.string().describe("The agent ID") },
	},
	async ({ agentId }) => {
		const result = await getPermissionsTool.handler({ agentId }, { db });
		return {
			content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
		};
	},
);

// avela.createPaymentIntent
server.registerTool(
	createPaymentTool.name,
	{
		description: createPaymentTool.description,
		inputSchema: {
			agentId: z.string().describe("The agent ID initiating the payment"),
			amount: z.number().describe("Payment amount in USD"),
			recipient: z.string().describe("Recipient wallet address"),
		},
	},
	async ({ agentId, amount, recipient }) => {
		const result = await createPaymentTool.handler({ agentId, amount, recipient }, { db });
		return {
			content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
		};
	},
);

// avela.getPaymentStatus
server.registerTool(
	getPaymentStatusTool.name,
	{
		description: getPaymentStatusTool.description,
		inputSchema: { paymentId: z.string().describe("The payment intent ID") },
	},
	async ({ paymentId }) => {
		const result = await getPaymentStatusTool.handler({ paymentId }, { db });
		return {
			content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
		};
	},
);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch(console.error);
