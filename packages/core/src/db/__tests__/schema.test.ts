import { describe, expect, it } from "vitest";
import {
	dailySpendingLogTable,
	paymentIntentsTable,
	settlementsTable,
	spendingPoliciesTable,
} from "../schema.js";

describe("payment intent schema", () => {
	it("exports paymentIntentsTable with required columns", () => {
		expect(paymentIntentsTable).toBeDefined();
		const columns = Object.keys(paymentIntentsTable);
		expect(columns).toContain("id");
		expect(columns).toContain("accountId");
		expect(columns).toContain("amount");
		expect(columns).toContain("recipientAddress");
		expect(columns).toContain("status");
	});

	it("exports settlementsTable with required columns", () => {
		expect(settlementsTable).toBeDefined();
		const columns = Object.keys(settlementsTable);
		expect(columns).toContain("paymentIntentId");
		expect(columns).toContain("txHash");
		expect(columns).toContain("blockNumber");
		expect(columns).toContain("paymentId");
	});
});

describe("spending policy schema", () => {
	it("exports spendingPoliciesTable with required columns", () => {
		expect(spendingPoliciesTable).toBeDefined();
		const columns = Object.keys(spendingPoliciesTable);
		expect(columns).toContain("id");
		expect(columns).toContain("accountId");
		expect(columns).toContain("dailyLimit");
		expect(columns).toContain("approvalThreshold");
		expect(columns).toContain("enabled");
	});

	it("exports dailySpendingLogTable with required columns", () => {
		expect(dailySpendingLogTable).toBeDefined();
		const columns = Object.keys(dailySpendingLogTable);
		expect(columns).toContain("id");
		expect(columns).toContain("accountId");
		expect(columns).toContain("amount");
		expect(columns).toContain("spentAt");
	});
});
