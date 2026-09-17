import { describe, expect, it } from "vitest";
import { isTerminalState, transitionPayment } from "../../src/domain/payment-intent.js";
import { PaymentTransitionError } from "../../src/errors.js";
import { PaymentState } from "../../src/types.js";
import { makePaymentIntentId } from "../helpers/fixtures.js";

describe("transitionPayment", () => {
	const intentId = makePaymentIntentId();
	const actor = "user:test";

	describe("valid transitions", () => {
		it("draft → awaiting_approval", () => {
			const event = transitionPayment(
				intentId,
				PaymentState.draft,
				PaymentState.awaiting_approval,
				"exceeds threshold",
				actor,
			);
			expect(event.fromState).toBe("draft");
			expect(event.toState).toBe("awaiting_approval");
			expect(event.reason).toBe("exceeds threshold");
			expect(event.actor).toBe(actor);
			expect(event.paymentIntentId).toBe(intentId);
			expect(event.timestamp).toBeInstanceOf(Date);
		});

		it("draft → funding", () => {
			const event = transitionPayment(
				intentId,
				PaymentState.draft,
				PaymentState.funding,
				"funded",
				actor,
			);
			expect(event.toState).toBe("funding");
		});

		it("draft → cancelled", () => {
			const event = transitionPayment(
				intentId,
				PaymentState.draft,
				PaymentState.cancelled,
				"user cancelled",
				actor,
			);
			expect(event.toState).toBe("cancelled");
		});

		it("awaiting_approval → funding", () => {
			const event = transitionPayment(
				intentId,
				PaymentState.awaiting_approval,
				PaymentState.funding,
				"approved",
				actor,
			);
			expect(event.toState).toBe("funding");
		});

		it("awaiting_approval → cancelled", () => {
			const event = transitionPayment(
				intentId,
				PaymentState.awaiting_approval,
				PaymentState.cancelled,
				"cancelled",
				actor,
			);
			expect(event.toState).toBe("cancelled");
		});

		it("funding → settling", () => {
			const event = transitionPayment(
				intentId,
				PaymentState.funding,
				PaymentState.settling,
				"funded",
				actor,
			);
			expect(event.toState).toBe("settling");
		});

		it("funding → failed", () => {
			const event = transitionPayment(
				intentId,
				PaymentState.funding,
				PaymentState.failed,
				"adapter error",
				actor,
			);
			expect(event.toState).toBe("failed");
		});

		it("settling → completed", () => {
			const event = transitionPayment(
				intentId,
				PaymentState.settling,
				PaymentState.completed,
				"settled",
				actor,
			);
			expect(event.toState).toBe("completed");
		});

		it("settling → failed", () => {
			const event = transitionPayment(
				intentId,
				PaymentState.settling,
				PaymentState.failed,
				"settlement failed",
				actor,
			);
			expect(event.toState).toBe("failed");
		});
	});

	describe("invalid transitions", () => {
		it("draft → completed throws", () => {
			expect(() =>
				transitionPayment(intentId, PaymentState.draft, PaymentState.completed, "skip", actor),
			).toThrow(PaymentTransitionError);
		});

		it("completed → anything throws", () => {
			expect(() =>
				transitionPayment(intentId, PaymentState.completed, PaymentState.draft, "reopen", actor),
			).toThrow(PaymentTransitionError);
		});

		it("failed → anything throws", () => {
			expect(() =>
				transitionPayment(intentId, PaymentState.failed, PaymentState.funding, "retry", actor),
			).toThrow(PaymentTransitionError);
		});

		it("cancelled → anything throws", () => {
			expect(() =>
				transitionPayment(intentId, PaymentState.cancelled, PaymentState.draft, "reopen", actor),
			).toThrow(PaymentTransitionError);
		});

		it("funding → draft throws", () => {
			expect(() =>
				transitionPayment(intentId, PaymentState.funding, PaymentState.draft, "back", actor),
			).toThrow(PaymentTransitionError);
		});
	});

	describe("isTerminalState", () => {
		it("completed is terminal", () => {
			expect(isTerminalState(PaymentState.completed)).toBe(true);
		});

		it("failed is terminal", () => {
			expect(isTerminalState(PaymentState.failed)).toBe(true);
		});

		it("cancelled is terminal", () => {
			expect(isTerminalState(PaymentState.cancelled)).toBe(true);
		});

		it("draft is not terminal", () => {
			expect(isTerminalState(PaymentState.draft)).toBe(false);
		});

		it("funding is not terminal", () => {
			expect(isTerminalState(PaymentState.funding)).toBe(false);
		});
	});
});
