import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import type { Database } from "../db/client.js";
import { paymentIntentsTable, settlementsTable } from "../db/schema.js";
import type { FundingDecision, Receipt } from "./payment-intent.js";

export async function recordSettlement(
	db: Database,
	params: {
		paymentIntentId: string;
		paymentId: string;
		txHash: string;
		blockNumber: number;
		amountSettled: bigint;
		settlementToken: string;
		gasUsed: bigint;
	},
) {
	const [row] = await db
		.insert(settlementsTable)
		.values({
			id: ulid(),
			paymentIntentId: params.paymentIntentId,
			paymentId: params.paymentId,
			txHash: params.txHash,
			blockNumber: params.blockNumber,
			amountSettled: params.amountSettled.toString(),
			settlementToken: params.settlementToken,
			gasUsed: params.gasUsed.toString(),
		})
		.returning();

	if (!row) throw new Error("Insert did not return a row");
	return row;
}

export async function getSettlement(db: Database, paymentIntentId: string) {
	const [row] = await db
		.select()
		.from(settlementsTable)
		.where(eq(settlementsTable.paymentIntentId, paymentIntentId));
	return row ?? null;
}

export function buildReceipt(params: {
	intent: {
		id: string;
		accountId: string;
		amount: number;
		recipientAddress: string;
		fundingDecision: FundingDecision | null;
	};
	settlement: {
		paymentId: string;
		txHash: string;
		blockNumber: number;
		amountSettled: bigint;
		settlementToken: string;
		gasUsed: bigint;
		settledAt: Date;
	};
}): Receipt {
	const { intent, settlement } = params;
	const fd = intent.fundingDecision;

	return {
		paymentId: settlement.paymentId,
		accountId: intent.accountId,
		amount: intent.amount,
		collateralAsset: fd?.collateralAsset ?? "stablecoin",
		settlementToken: settlement.settlementToken,
		settlementTxHash: settlement.txHash,
		recipientAddress: intent.recipientAddress,
		timestamp: settlement.settledAt,
	};
}

export async function getReceipt(db: Database, paymentIntentId: string): Promise<Receipt | null> {
	const [intent] = await db
		.select()
		.from(paymentIntentsTable)
		.where(eq(paymentIntentsTable.id, paymentIntentId));

	if (!intent) return null;

	const settlement = await getSettlement(db, paymentIntentId);
	if (!settlement) return null;

	return buildReceipt({
		intent: {
			id: intent.id,
			accountId: intent.accountId,
			amount: Number(intent.amount),
			recipientAddress: intent.recipientAddress,
			fundingDecision: intent.fundingDecision as FundingDecision | null,
		},
		settlement: {
			paymentId: settlement.paymentId,
			txHash: settlement.txHash,
			blockNumber: settlement.blockNumber,
			amountSettled: BigInt(settlement.amountSettled),
			settlementToken: settlement.settlementToken,
			gasUsed: BigInt(settlement.gasUsed),
			settledAt: settlement.settledAt,
		},
	});
}
