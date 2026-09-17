// packages/core/src/domain/approval.ts
import { ulid } from "ulidx";
import { ApprovalSnapshotMismatchError, DomainError } from "../errors.js";
import type { AccountId, ApprovalId, ApprovalStatus, FundingPlan, PaymentIntentId } from "../types.js";

export interface ApprovalSnapshot {
	amount: string;
	recipient: string;
	fundingPlan: FundingPlan;
}

export interface ApprovalRecord {
	id: ApprovalId;
	paymentIntentId: PaymentIntentId;
	approverAccountId: AccountId;
	status: ApprovalStatus;
	expiresAt: Date;
	decidedAt: Date | null;
	snapshotAmount: string;
	snapshotRecipient: string;
	snapshotFundingPlan: FundingPlan;
}

export interface CreateApprovalParams {
	paymentIntentId: PaymentIntentId;
	approverAccountId: AccountId;
	snapshot: ApprovalSnapshot;
	expiresInMs: number;
}

export function createApproval(params: CreateApprovalParams): ApprovalRecord {
	return {
		id: ulid() as ApprovalId,
		paymentIntentId: params.paymentIntentId,
		approverAccountId: params.approverAccountId,
		status: "pending",
		expiresAt: new Date(Date.now() + params.expiresInMs),
		decidedAt: null,
		snapshotAmount: params.snapshot.amount,
		snapshotRecipient: params.snapshot.recipient,
		snapshotFundingPlan: params.snapshot.fundingPlan,
	};
}

export function decideApproval(
	approval: ApprovalRecord,
	decision: "approved" | "rejected",
	currentSnapshot: ApprovalSnapshot,
): ApprovalRecord {
	if (approval.expiresAt.getTime() < Date.now()) {
		throw new DomainError("Approval has expired", "APPROVAL_EXPIRED");
	}

	if (approval.snapshotAmount !== currentSnapshot.amount) {
		throw new ApprovalSnapshotMismatchError("amount");
	}

	if (approval.snapshotRecipient !== currentSnapshot.recipient) {
		throw new ApprovalSnapshotMismatchError("recipient");
	}

	return {
		...approval,
		status: decision,
		decidedAt: new Date(),
	};
}
