import { describe, expect, it } from "vitest";
import { checkAgentPermission } from "../../src/domain/agent-permission.js";
import { AgentPermissionDeniedError } from "../../src/errors.js";

const basePermission = {
	allowedAssets: ["USDC", "xAAPL"],
	maxTransaction: "1000",
	dailyLimit: "5000",
	approvedRecipients: ["0xabc", "0xdef"],
	requireApproval: false,
	expiresAt: new Date(Date.now() + 86400000),
	revokedAt: null as Date | null,
};

const baseAction = {
	asset: "USDC",
	amount: "100",
	dailySpentSoFar: "0",
	recipient: "0xabc",
};

describe("checkAgentPermission", () => {
	it("allows action within all limits", () => {
		expect(() => checkAgentPermission(basePermission, baseAction)).not.toThrow();
	});

	it("rejects when amount exceeds maxTransaction", () => {
		expect(() => checkAgentPermission(basePermission, { ...baseAction, amount: "1500" })).toThrow(
			AgentPermissionDeniedError,
		);
	});

	it("rejects when daily limit exceeded", () => {
		expect(() =>
			checkAgentPermission(basePermission, {
				...baseAction,
				dailySpentSoFar: "4500",
				amount: "600",
			}),
		).toThrow(AgentPermissionDeniedError);
	});

	it("rejects unapproved recipient", () => {
		expect(() =>
			checkAgentPermission(basePermission, { ...baseAction, recipient: "0xunknown" }),
		).toThrow(AgentPermissionDeniedError);
	});

	it("allows any recipient with wildcard", () => {
		const perm = { ...basePermission, approvedRecipients: ["*"] };
		expect(() =>
			checkAgentPermission(perm, { ...baseAction, recipient: "0xanyone" }),
		).not.toThrow();
	});

	it("rejects expired permission", () => {
		const perm = { ...basePermission, expiresAt: new Date(Date.now() - 1000) };
		expect(() => checkAgentPermission(perm, baseAction)).toThrow(AgentPermissionDeniedError);
	});

	it("rejects revoked permission", () => {
		const perm = { ...basePermission, revokedAt: new Date() };
		expect(() => checkAgentPermission(perm, baseAction)).toThrow(AgentPermissionDeniedError);
	});

	it("rejects disallowed asset", () => {
		expect(() => checkAgentPermission(basePermission, { ...baseAction, asset: "xTSLA" })).toThrow(
			AgentPermissionDeniedError,
		);
	});
});
