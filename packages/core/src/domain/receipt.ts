// packages/core/src/domain/receipt.ts
import { ulid } from "ulidx";
import type { ReceiptId, PaymentIntentId, FundingPlan } from "../types.js";
import { FundingSource } from "../types.js";

export interface GenerateReceiptParams {
	paymentIntentId: PaymentIntentId;
	payer: string;
	recipient: string;
	amount: string;
	currency: string;
	fundingPlan: FundingPlan;
	approvalRecord: Record<string, unknown> | null;
	executionRefs: Record<string, unknown> | null;
	fundedAt: Date | null;
	settledAt: Date | null;
}

export interface ReceiptData {
	id: ReceiptId;
	paymentIntentId: PaymentIntentId;
	payer: string;
	recipient: string;
	amount: string;
	currency: string;
	fundingSource: string;
	policyDecision: Record<string, unknown>;
	approvalRecord: Record<string, unknown> | null;
	executionRefs: Record<string, unknown> | null;
	createdAt: Date;
	fundedAt: Date | null;
	settledAt: Date | null;
	completedAt: Date;
}

export function generateReceipt(params: GenerateReceiptParams): ReceiptData {
	const hasConversion = Number.parseFloat(params.fundingPlan.conversionAmount) > 0;
	const hasStablecoin = Number.parseFloat(params.fundingPlan.stablecoinAmount) > 0;

	let fundingSource: string;
	if (hasConversion && hasStablecoin) {
		fundingSource = FundingSource.mixed;
	} else if (hasConversion) {
		fundingSource = FundingSource.stock_conversion;
	} else {
		fundingSource = FundingSource.stablecoin;
	}

	return {
		id: ulid() as ReceiptId,
		paymentIntentId: params.paymentIntentId,
		payer: params.payer,
		recipient: params.recipient,
		amount: params.amount,
		currency: params.currency,
		fundingSource,
		policyDecision: {
			rulesChecked: params.fundingPlan.rulesChecked,
			plan: {
				stablecoinAmount: params.fundingPlan.stablecoinAmount,
				conversionAmount: params.fundingPlan.conversionAmount,
				conversionAsset: params.fundingPlan.conversionAsset,
			},
		},
		approvalRecord: params.approvalRecord,
		executionRefs: params.executionRefs,
		createdAt: new Date(),
		fundedAt: params.fundedAt,
		settledAt: params.settledAt,
		completedAt: new Date(),
	};
}
