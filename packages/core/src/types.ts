import { z } from "zod";

// Branded IDs
export type AccountId = string & { readonly __brand: "AccountId" };
export type PaymentIntentId = string & { readonly __brand: "PaymentIntentId" };
export type ApprovalId = string & { readonly __brand: "ApprovalId" };
export type AgentPermissionId = string & { readonly __brand: "AgentPermissionId" };
export type ReceiptId = string & { readonly __brand: "ReceiptId" };
export type PaymentEventId = string & { readonly __brand: "PaymentEventId" };

// Enums
export const PaymentState = {
	draft: "draft",
	awaiting_approval: "awaiting_approval",
	funding: "funding",
	settling: "settling",
	completed: "completed",
	failed: "failed",
	cancelled: "cancelled",
} as const;
export type PaymentState = (typeof PaymentState)[keyof typeof PaymentState];

export const ApprovalStatus = {
	pending: "pending",
	approved: "approved",
	rejected: "rejected",
	expired: "expired",
} as const;
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

export const AccountType = {
	business: "business",
	operator: "operator",
	agent: "agent",
} as const;
export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export const FundingSource = {
	stablecoin: "stablecoin",
	stock_conversion: "stock_conversion",
	mixed: "mixed",
} as const;
export type FundingSource = (typeof FundingSource)[keyof typeof FundingSource];

export const AssetType = {
	stablecoin: "stablecoin",
	xstock: "xstock",
} as const;
export type AssetType = (typeof AssetType)[keyof typeof AssetType];

// Zod input schemas
export const CreateAccountInput = z.object({
	externalUserId: z.string().min(1),
	name: z.string().min(1).max(100),
	type: z.enum(["business", "operator", "agent"]),
	walletAddress: z.string().min(1),
});
export type CreateAccountInput = z.infer<typeof CreateAccountInput>;

export const CreatePaymentIntentInput = z.object({
	accountId: z.string().min(1),
	recipientAddress: z.string().min(1),
	amount: z.string().regex(/^\d+(\.\d+)?$/),
	currency: z.literal("USDC"),
	memo: z.string().max(256).optional(),
	idempotencyKey: z.string().min(1),
});
export type CreatePaymentIntentInput = z.infer<typeof CreatePaymentIntentInput>;

export const UpdateFundingPolicyInput = z.object({
	accountId: z.string().min(1),
	reserveMinimum: z.string().regex(/^\d+(\.\d+)?$/),
	approvalThreshold: z.string().regex(/^\d+(\.\d+)?$/),
	dailyCap: z.string().regex(/^\d+(\.\d+)?$/),
	priceFloor: z.string().regex(/^\d+(\.\d+)?$/),
	executionLimit: z.string().regex(/^\d+(\.\d+)?$/),
});
export type UpdateFundingPolicyInput = z.infer<typeof UpdateFundingPolicyInput>;

// Domain data types
export interface FundingPlan {
	stablecoinAmount: string;
	conversionAmount: string;
	conversionAsset: string | null;
	totalAmount: string;
	requiresApproval: boolean;
	rulesChecked: FundingRuleResult[];
}

export interface FundingRuleResult {
	rule: string;
	passed: boolean;
	reason: string;
}

export interface PaymentEvent {
	id: PaymentEventId;
	paymentIntentId: PaymentIntentId;
	fromState: PaymentState;
	toState: PaymentState;
	reason: string;
	actor: string;
	timestamp: Date;
}
