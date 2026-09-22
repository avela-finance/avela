import { z } from "zod";

export type AccountStatus = "active" | "frozen" | "closed";

export type Account = {
	id: string;
	walletAddress: string;
	username: string | null;
	status: AccountStatus;
	createdAt: Date;
	updatedAt: Date;
};

export type AssetType = "index" | "single_stock";
export type SettlementStablecoin = "USDG" | "USDC";

export type Asset = {
	symbol: string;
	name: string;
	address: string;
	decimals: number;
	assetType: AssetType;
	haircut: number;
	settlementStablecoin: SettlementStablecoin;
	poolAddress: string;
	enabled: boolean;
};

export type Position = {
	id: string;
	accountId: string;
	assetSymbol: string;
	amount: bigint;
	depositTxHash: string;
	createdAt: Date;
	updatedAt: Date;
};

export type StablecoinBalance = {
	id: string;
	accountId: string;
	stablecoin: SettlementStablecoin;
	amount: bigint;
	updatedAt: Date;
};

export type SpendingPowerBreakdown = {
	assetSymbol: string;
	positionValue: number;
	haircut: number;
	spendingPower: number;
};

export type SpendingPower = {
	accountId: string;
	perAsset: SpendingPowerBreakdown[];
	stablecoinBalance: number;
	totalSpendingPower: number;
	calculatedAt: Date;
};

export type PriceResult = {
	price: number;
	source: string;
	confidence: number;
	timestamp: Date;
};

// --- Agent Permission ---

export const AgentPermissionSchema = z
	.object({
		maxPerTransaction: z.number().nonnegative(),
		maxPerDay: z.number().nonnegative(),
		allowedAssets: z.array(z.string()),
		allowedRecipients: z.array(z.string()),
		requiresApproval: z.boolean(),
		approvalThreshold: z.number().nonnegative(),
	})
	.refine((data) => data.maxPerTransaction <= data.maxPerDay, {
		message: "maxPerTransaction must not exceed maxPerDay",
	});

export type AgentPermission = z.infer<typeof AgentPermissionSchema>;

export const DEMO_AGENT_PERMISSION: AgentPermission = {
	maxPerTransaction: 50,
	maxPerDay: 200,
	allowedAssets: ["wSPYx"],
	allowedRecipients: [],
	requiresApproval: false,
	approvalThreshold: 25,
};

// --- Agent ---

export const AgentStatusEnum = z.enum(["active", "suspended", "expired", "revoked"]);
export type AgentStatus = z.infer<typeof AgentStatusEnum>;

export const AgentSchema = z.object({
	id: z.string(),
	accountId: z.string(),
	name: z.string().min(1).max(100),
	walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
	permissions: AgentPermissionSchema,
	status: AgentStatusEnum,
	createdAt: z.date(),
	expiresAt: z.date().nullable(),
});

export type Agent = z.infer<typeof AgentSchema>;

// --- Agent Spending Log ---

export const AgentSpendingLogStatusEnum = z.enum([
	"approved",
	"rejected",
	"auto_approved",
	"pending_approval",
]);

export const AgentSpendingLogSchema = z.object({
	id: z.string(),
	agentId: z.string(),
	paymentIntentId: z.string(),
	amount: z.number().nonnegative(),
	asset: z.string(),
	recipient: z.string(),
	permissionSnapshot: AgentPermissionSchema,
	status: AgentSpendingLogStatusEnum,
	decidedAt: z.date(),
});

export type AgentSpendingLog = z.infer<typeof AgentSpendingLogSchema>;

// --- Permission Evaluation Result ---

export type AgentPermissionEvaluation = {
	allowed: boolean;
	requiresApproval: boolean;
	violations: string[];
	dailySpent: number;
	dailyRemaining: number;
};

// --- Watcher ---

export const WatcherStatusEnum = z.enum(["active", "triggered", "paused", "disabled"]);
export type WatcherStatus = z.infer<typeof WatcherStatusEnum>;

export const SpendingPowerThresholdConfigSchema = z.object({
	threshold: z.number().nonnegative(),
	direction: z.literal("below"),
});
export type SpendingPowerThresholdConfig = z.infer<typeof SpendingPowerThresholdConfigSchema>;

export const WatcherSchema = z.object({
	id: z.string(),
	accountId: z.string(),
	type: z.literal("spending_power_threshold"),
	config: SpendingPowerThresholdConfigSchema,
	status: WatcherStatusEnum,
	lastEvaluatedAt: z.date().nullable(),
	lastTriggeredAt: z.date().nullable(),
	cooldownMinutes: z.number().int().positive(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
export type Watcher = z.infer<typeof WatcherSchema>;

export const WatcherEvaluationSchema = z.object({
	watcherId: z.string(),
	currentValue: z.number(),
	threshold: z.number(),
	triggered: z.boolean(),
	evaluatedAt: z.date(),
});
export type WatcherEvaluation = z.infer<typeof WatcherEvaluationSchema>;

export type WatcherCyclePhase = "watch" | "evaluate" | "decide" | "authorize" | "execute";

export const CreateWatcherInputSchema = z.object({
	accountId: z.string().min(1),
	threshold: z.number().nonnegative(),
	cooldownMinutes: z.number().int().positive().default(60),
});
export type CreateWatcherInput = z.infer<typeof CreateWatcherInputSchema>;
