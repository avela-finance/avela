import { describe, expect, it } from "vitest";
import { createPaymentTool } from "../tools/create-payment.js";
import { getBalanceTool } from "../tools/get-balance.js";
import { getPaymentStatusTool } from "../tools/get-payment-status.js";
import { getPermissionsTool } from "../tools/get-permissions.js";

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

	it("tool input schemas have required fields defined", () => {
		expect(getBalanceTool.inputSchema.required).toContain("accountId");
		expect(getPermissionsTool.inputSchema.required).toContain("agentId");
		expect(createPaymentTool.inputSchema.required).toContain("agentId");
		expect(createPaymentTool.inputSchema.required).toContain("amount");
		expect(createPaymentTool.inputSchema.required).toContain("recipient");
		expect(getPaymentStatusTool.inputSchema.required).toContain("paymentId");
	});
});
