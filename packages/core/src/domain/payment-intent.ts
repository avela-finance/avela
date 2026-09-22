import { desc, eq } from "drizzle-orm";
import { ulid } from "ulidx";
import type { Database } from "../db/client.js";
import { paymentIntentsTable } from "../db/schema.js";

export const PAYMENT_STATUSES = [
	"created",
	"policy_check",
	"awaiting_approval",
	"collateral_verify",
	"settling",
	"settled",
	"failed",
	"rejected",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type FundingDecision = {
	source: "spending_power" | "stablecoin_balance";
	collateralAsset: string | null;
	collateralVerified: boolean;
	collateralAmount: bigint | null;
	settlementToken: "USDG" | "USDC";
	paymentId: string;
	spendingPowerAtDecision: number;
	decidedAt: Date;
};

export type Settlement = {
	paymentId: string;
	txHash: string;
	blockNumber: number;
	amountSettled: bigint;
	settlementToken: "USDG" | "USDC";
	gasUsed: bigint;
	settledAt: Date;
};

export type PaymentIntent = {
	id: string;
	accountId: string;
	amount: number;
	recipientAddress: string;
	recipientUsername: string | null;
	status: PaymentStatus;
	fundingDecision: FundingDecision | null;
	settlement: Settlement | null;
	createdAt: Date;
	updatedAt: Date;
};

export type Receipt = {
	paymentId: string;
	accountId: string;
	amount: number;
	collateralAsset: string;
	settlementToken: string;
	settlementTxHash: string;
	recipientAddress: string;
	timestamp: Date;
};

const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
	created: ["policy_check", "failed"],
	policy_check: ["awaiting_approval", "collateral_verify", "failed"],
	awaiting_approval: ["collateral_verify", "rejected", "failed"],
	collateral_verify: ["settling", "failed"],
	settling: ["settled", "failed"],
	settled: [],
	failed: [],
	rejected: [],
};

export function transitionStatus(current: PaymentStatus, next: PaymentStatus): PaymentStatus {
	const allowed = VALID_TRANSITIONS[current];
	if (!allowed.includes(next)) {
		throw new Error(`Invalid transition: ${current} → ${next}`);
	}
	return next;
}

export function isTerminalStatus(status: PaymentStatus): boolean {
	return status === "settled" || status === "failed" || status === "rejected";
}

export async function createPaymentIntent(
	db: Database,
	params: {
		accountId: string;
		amount: number;
		recipientAddress: string;
		recipientUsername?: string;
	},
) {
	const id = ulid();
	const [row] = await db
		.insert(paymentIntentsTable)
		.values({
			id,
			accountId: params.accountId,
			amount: params.amount.toFixed(6),
			recipientAddress: params.recipientAddress,
			recipientUsername: params.recipientUsername ?? null,
			status: "created",
		})
		.returning();

	return row!;
}

export async function getPaymentIntent(db: Database, id: string) {
	const [row] = await db.select().from(paymentIntentsTable).where(eq(paymentIntentsTable.id, id));
	return row ?? null;
}

export async function getPaymentHistory(db: Database, accountId: string, limit = 20) {
	return db
		.select()
		.from(paymentIntentsTable)
		.where(eq(paymentIntentsTable.accountId, accountId))
		.orderBy(desc(paymentIntentsTable.createdAt))
		.limit(limit);
}

export async function updatePaymentStatus(
	db: Database,
	id: string,
	nextStatus: PaymentStatus,
	fundingDecision?: FundingDecision,
) {
	const [current] = await db
		.select({ status: paymentIntentsTable.status })
		.from(paymentIntentsTable)
		.where(eq(paymentIntentsTable.id, id));

	if (!current) {
		throw new Error(`Payment intent not found: ${id}`);
	}

	transitionStatus(current.status as PaymentStatus, nextStatus);

	const updates: Record<string, unknown> = {
		status: nextStatus,
		updatedAt: new Date(),
	};
	if (fundingDecision) {
		updates.fundingDecision = fundingDecision;
	}

	const [row] = await db
		.update(paymentIntentsTable)
		.set(updates)
		.where(eq(paymentIntentsTable.id, id))
		.returning();

	return row!;
}
