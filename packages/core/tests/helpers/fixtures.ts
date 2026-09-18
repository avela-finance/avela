import { ulid } from "ulidx";
import type {
	AccountId,
	AgentPermissionId,
	ApprovalId,
	PaymentEventId,
	PaymentIntentId,
	ReceiptId,
} from "../../src/types.js";

export function makeAccount(
	overrides: Partial<{
		id: AccountId;
		externalUserId: string;
		name: string;
		type: string;
		walletAddress: string;
	}> = {},
) {
	return {
		id: overrides.id ?? makeAccountId(),
		externalUserId: overrides.externalUserId ?? `privy-${ulid()}`,
		name: overrides.name ?? "Test Business",
		type: overrides.type ?? "business",
		walletAddress: overrides.walletAddress ?? `0x${ulid().slice(0, 40)}`,
	};
}

export function makePosition(
	accountId: AccountId,
	overrides: Partial<{
		asset: string;
		balance: string;
		lockedBalance: string;
		lastPriceUsd: string | null;
		lastPriceAt: Date | null;
	}> = {},
) {
	return {
		id: ulid(),
		accountId,
		asset: overrides.asset ?? "USDC",
		balance: overrides.balance ?? "1000",
		lockedBalance: overrides.lockedBalance ?? "0",
		lastPriceUsd: overrides.lastPriceUsd ?? null,
		lastPriceAt: overrides.lastPriceAt ?? null,
	};
}

export function makePolicy(
	accountId: AccountId,
	overrides: Partial<{
		reserveMinimum: string;
		approvalThreshold: string;
		dailyCap: string;
		priceFloor: string;
		executionLimit: string;
	}> = {},
) {
	return {
		id: ulid(),
		accountId,
		reserveMinimum: overrides.reserveMinimum ?? "0",
		approvalThreshold: overrides.approvalThreshold ?? "1000",
		dailyCap: overrides.dailyCap ?? "10000",
		priceFloor: overrides.priceFloor ?? "0",
		executionLimit: overrides.executionLimit ?? "5000",
	};
}

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
