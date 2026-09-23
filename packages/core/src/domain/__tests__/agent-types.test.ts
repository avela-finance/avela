import { describe, expect, it } from "vitest";
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
