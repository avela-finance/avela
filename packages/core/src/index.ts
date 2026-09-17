// Types and enums

// Adapters
export type {
	AuthAdapter,
	AuthUser,
	LiquidityAdapter,
	PriceAdapter,
	PriceData,
	Quote,
	QuoteParams,
	SettlementAdapter,
	SignTransactionParams,
	SwapResult,
	TransferConfirmation,
	TransferParams,
	TransferResult,
	WalletAdapter,
} from "./adapters/index.js";
export type { Database } from "./db/client.js";
// Database
export { createDb } from "./db/client.js";
export type { AgentAction, AgentPermissionData } from "./domain/agent-permission.js";
export { checkAgentPermission } from "./domain/agent-permission.js";
export type { ApprovalRecord, ApprovalSnapshot, CreateApprovalParams } from "./domain/approval.js";
export { createApproval, decideApproval } from "./domain/approval.js";
export { isAssetEligible } from "./domain/asset-eligibility.js";
export type { BuildFundingPlanParams } from "./domain/funding-policy.js";
export { buildFundingPlan } from "./domain/funding-policy.js";
// Domain
export { isTerminalState, transitionPayment, VALID_TRANSITIONS } from "./domain/payment-intent.js";
export type { GenerateReceiptParams, ReceiptData } from "./domain/receipt.js";
export { generateReceipt } from "./domain/receipt.js";
export { calculateSpendingPower } from "./domain/spending-power.js";
// Errors
export {
	AgentPermissionDeniedError,
	ApprovalRequiredError,
	ApprovalSnapshotMismatchError,
	DomainError,
	InsufficientFundsError,
	PaymentTransitionError,
	PolicyViolationError,
	StaleDataError,
} from "./errors.js";

// Schema
export * from "./schema/index.js";
export type {
	AccountId,
	AgentPermissionId,
	ApprovalId,
	FundingPlan,
	FundingRuleResult,
	PaymentEvent,
	PaymentEventId,
	PaymentIntentId,
	ReceiptId,
} from "./types.js";
export {
	AccountType,
	ApprovalStatus,
	CreateAccountInput,
	CreatePaymentIntentInput,
	FundingSource,
	PaymentState,
	UpdateFundingPolicyInput,
} from "./types.js";
