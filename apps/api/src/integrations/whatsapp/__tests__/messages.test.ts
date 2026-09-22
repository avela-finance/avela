import { describe, expect, it } from "vitest";
import { matchIntent } from "../messages.js";

describe("message intent matching", () => {
	it("matches 'balance' to balance intent", () => {
		expect(matchIntent("balance")).toBe("balance");
	});

	it("matches 'how much' to balance intent", () => {
		expect(matchIntent("how much do I have")).toBe("balance");
	});

	it("matches 'spending' to spending_power intent", () => {
		expect(matchIntent("spending")).toBe("spending_power");
	});

	it("matches 'how much can I spend' to spending_power intent", () => {
		expect(matchIntent("how much can I spend")).toBe("spending_power");
	});

	it("matches 'payments' to payments intent", () => {
		expect(matchIntent("payments")).toBe("payments");
	});

	it("matches 'history' to payments intent", () => {
		expect(matchIntent("history")).toBe("payments");
	});

	it("matches 'help' to help intent", () => {
		expect(matchIntent("help")).toBe("help");
	});

	it("returns unknown for unrecognized messages", () => {
		expect(matchIntent("what is the meaning of life")).toBe("unknown");
	});

	it("is case-insensitive", () => {
		expect(matchIntent("BALANCE")).toBe("balance");
		expect(matchIntent("Spending Power")).toBe("spending_power");
	});
});
