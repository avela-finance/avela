import { ulid } from "ulidx";
import type {
	AccountId,
	AgentPermissionId,
	ApprovalId,
	PaymentEventId,
	PaymentIntentId,
	ReceiptId,
} from "../../src/types.js";

export function makeAccountId(): AccountId {
	return ulid() as AccountId;
}

export function makePaymentIntentId(): PaymentIntentId {
	return ulid() as PaymentIntentId;
}

export function makeApprovalId(): ApprovalId {
	return ulid() as ApprovalId;
}

export function makeAgentPermissionId(): AgentPermissionId {
	return ulid() as AgentPermissionId;
}

export function makeReceiptId(): ReceiptId {
	return ulid() as ReceiptId;
}

export function makePaymentEventId(): PaymentEventId {
	return ulid() as PaymentEventId;
}
