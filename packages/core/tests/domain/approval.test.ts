// packages/core/tests/domain/approval.test.ts
import { describe, expect, it } from "vitest";
import { createApproval, decideApproval } from "../../src/domain/approval.js";
import { ApprovalSnapshotMismatchError } from "../../src/errors.js";
import { makeAccountId, makePaymentIntentId } from "../helpers/fixtures.js";

describe("approval", () => {
	const intentId = makePaymentIntentId();
	const approverId = makeAccountId();
	const snapshot = {
		amount: "500",
		recipient: "0xabc",
		fundingPlan: { stablecoinAmount: "500", conversionAmount: "0" },
	};

	describe("createApproval", () => {
		it("creates approval with pending status and snapshot", () => {
			const approval = createApproval({
				paymentIntentId: intentId,
				approverAccountId: approverId,
				snapshot,
				expiresInMs: 3600000,
			});
			expect(approval.status).toBe("pending");
			expect(approval.snapshotAmount).toBe("500");
			expect(approval.snapshotRecipient).toBe("0xabc");
			expect(approval.expiresAt.getTime()).toBeGreaterThan(Date.now());
		});
	});

	describe("decideApproval", () => {
		it("approves when snapshot matches", () => {
			const approval = createApproval({
				paymentIntentId: intentId,
				approverAccountId: approverId,
				snapshot,
				expiresInMs: 3600000,
			});
			const decided = decideApproval(approval, "approved", snapshot);
			expect(decided.status).toBe("approved");
			expect(decided.decidedAt).toBeInstanceOf(Date);
		});

		it("rejects when snapshot matches", () => {
			const approval = createApproval({
				paymentIntentId: intentId,
				approverAccountId: approverId,
				snapshot,
				expiresInMs: 3600000,
			});
			const decided = decideApproval(approval, "rejected", snapshot);
			expect(decided.status).toBe("rejected");
		});

		it("throws when amount changed since approval created", () => {
			const approval = createApproval({
				paymentIntentId: intentId,
				approverAccountId: approverId,
				snapshot,
				expiresInMs: 3600000,
			});
			expect(() => decideApproval(approval, "approved", { ...snapshot, amount: "999" })).toThrow(
				ApprovalSnapshotMismatchError,
			);
		});

		it("throws when recipient changed since approval created", () => {
			const approval = createApproval({
				paymentIntentId: intentId,
				approverAccountId: approverId,
				snapshot,
				expiresInMs: 3600000,
			});
			expect(() =>
				decideApproval(approval, "approved", { ...snapshot, recipient: "0xdifferent" }),
			).toThrow(ApprovalSnapshotMismatchError);
		});

		it("throws when approval expired", () => {
			const approval = createApproval({
				paymentIntentId: intentId,
				approverAccountId: approverId,
				snapshot,
				expiresInMs: -1000,
			});
			expect(() => decideApproval(approval, "approved", snapshot)).toThrow("expired");
		});
	});
});
