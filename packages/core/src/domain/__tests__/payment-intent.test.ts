import { describe, expect, it } from "vitest";
import { isTerminalStatus, transitionStatus } from "../payment-intent.js";

describe("payment intent state machine", () => {
	it("transitions from created to policy_check", () => {
		expect(transitionStatus("created", "policy_check")).toBe("policy_check");
	});

	it("transitions from policy_check to awaiting_approval", () => {
		expect(transitionStatus("policy_check", "awaiting_approval")).toBe("awaiting_approval");
	});

	it("transitions from policy_check to collateral_verify (auto-approved)", () => {
		expect(transitionStatus("policy_check", "collateral_verify")).toBe("collateral_verify");
	});

	it("transitions from awaiting_approval to collateral_verify", () => {
		expect(transitionStatus("awaiting_approval", "collateral_verify")).toBe("collateral_verify");
	});

	it("transitions from awaiting_approval to rejected", () => {
		expect(transitionStatus("awaiting_approval", "rejected")).toBe("rejected");
	});

	it("transitions from collateral_verify to settling", () => {
		expect(transitionStatus("collateral_verify", "settling")).toBe("settling");
	});

	it("transitions from settling to settled", () => {
		expect(transitionStatus("settling", "settled")).toBe("settled");
	});

	it("transitions to failed from any non-terminal state", () => {
		expect(transitionStatus("collateral_verify", "failed")).toBe("failed");
		expect(transitionStatus("settling", "failed")).toBe("failed");
	});

	it("rejects invalid transitions", () => {
		expect(() => transitionStatus("created", "settled")).toThrow("Invalid transition");
		expect(() => transitionStatus("settled", "created")).toThrow("Invalid transition");
	});

	it("identifies terminal statuses", () => {
		expect(isTerminalStatus("settled")).toBe(true);
		expect(isTerminalStatus("failed")).toBe(true);
		expect(isTerminalStatus("rejected")).toBe(true);
		expect(isTerminalStatus("created")).toBe(false);
		expect(isTerminalStatus("collateral_verify")).toBe(false);
	});
});
