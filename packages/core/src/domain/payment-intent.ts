import { ulid } from "ulidx";
import { PaymentTransitionError } from "../errors.js";
import type { PaymentEvent, PaymentEventId, PaymentIntentId } from "../types.js";
import { PaymentState } from "../types.js";

export const VALID_TRANSITIONS: Record<PaymentState, readonly PaymentState[]> = {
	draft: [PaymentState.awaiting_approval, PaymentState.funding, PaymentState.cancelled],
	awaiting_approval: [PaymentState.funding, PaymentState.cancelled],
	funding: [PaymentState.settling, PaymentState.failed],
	settling: [PaymentState.completed, PaymentState.failed],
	completed: [],
	failed: [],
	cancelled: [],
};

const TERMINAL_STATES: ReadonlySet<PaymentState> = new Set([
	PaymentState.completed,
	PaymentState.failed,
	PaymentState.cancelled,
]);

export function transitionPayment(
	intentId: PaymentIntentId,
	current: PaymentState,
	next: PaymentState,
	reason: string,
	actor: string,
): PaymentEvent {
	const allowed = VALID_TRANSITIONS[current];
	if (!allowed.includes(next)) {
		throw new PaymentTransitionError(current, next);
	}
	return {
		id: ulid() as PaymentEventId,
		paymentIntentId: intentId,
		fromState: current,
		toState: next,
		reason,
		actor,
		timestamp: new Date(),
	};
}

export function isTerminalState(state: PaymentState): boolean {
	return TERMINAL_STATES.has(state);
}
