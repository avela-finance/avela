import type { PaymentState } from "./types.js";

export class DomainError extends Error {
	constructor(
		message: string,
		public readonly code: string,
	) {
		super(message);
		this.name = "DomainError";
	}
}

export class PaymentTransitionError extends DomainError {
	constructor(
		public readonly from: PaymentState,
		public readonly to: PaymentState,
	) {
		super(
			`Invalid transition from "${from}" to "${to}"`,
			"INVALID_TRANSITION",
		);
		this.name = "PaymentTransitionError";
	}
}

export class PolicyViolationError extends DomainError {
	constructor(
		public readonly rule: string,
		reason: string,
	) {
		super(reason, "POLICY_VIOLATION");
		this.name = "PolicyViolationError";
	}
}

export class InsufficientFundsError extends DomainError {
	constructor(
		public readonly required: string,
		public readonly available: string,
	) {
		super(
			`Insufficient funds: required ${required}, available ${available}`,
			"INSUFFICIENT_FUNDS",
		);
		this.name = "InsufficientFundsError";
	}
}

export class ApprovalRequiredError extends DomainError {
	constructor(
		public readonly amount: string,
		public readonly threshold: string,
	) {
		super(
			`Approval required: amount ${amount} exceeds threshold ${threshold}`,
			"APPROVAL_REQUIRED",
		);
		this.name = "ApprovalRequiredError";
	}
}

export class ApprovalSnapshotMismatchError extends DomainError {
	constructor(public readonly field: string) {
		super(
			`Approval snapshot mismatch on field "${field}"`,
			"APPROVAL_SNAPSHOT_MISMATCH",
		);
		this.name = "ApprovalSnapshotMismatchError";
	}
}

export class AgentPermissionDeniedError extends DomainError {
	constructor(reason: string) {
		super(reason, "AGENT_PERMISSION_DENIED");
		this.name = "AgentPermissionDeniedError";
	}
}

export class StaleDataError extends DomainError {
	constructor(
		public readonly dataType: string,
		public readonly age: number,
	) {
		super(
			`Stale ${dataType} data: ${age}ms old`,
			"STALE_DATA",
		);
		this.name = "StaleDataError";
	}
}
