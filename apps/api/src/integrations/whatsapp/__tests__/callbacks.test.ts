import { describe, expect, it } from "vitest";
import { parseCallbackAction } from "../callbacks.js";

describe("parseCallbackAction", () => {
	it("parses approve action", () => {
		const result = parseCallbackAction("approve:01JTEST000000000000000003");
		expect(result).toEqual({ action: "approve", paymentIntentId: "01JTEST000000000000000003" });
	});

	it("parses reject action", () => {
		const result = parseCallbackAction("reject:01JTEST000000000000000003");
		expect(result).toEqual({ action: "reject", paymentIntentId: "01JTEST000000000000000003" });
	});

	it("returns null for invalid format", () => {
		expect(parseCallbackAction("invalid")).toBeNull();
		expect(parseCallbackAction("approve:")).toBeNull();
		expect(parseCallbackAction("")).toBeNull();
	});
});
