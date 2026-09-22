import { and, eq, gte } from "drizzle-orm";
import { ulid } from "ulidx";
import type { Database } from "../db/client.js";
import { dailySpendingLogTable, spendingPoliciesTable } from "../db/schema.js";
import { DEFAULT_POLICY } from "./policy-defaults.js";

export type FundingSource = "spending_power" | "stablecoin_balance";

export type PriceFloor = {
	assetSymbol: string;
	floorPrice: number;
};

export type MinimumBalance = {
	assetSymbol: string;
	minimumAmount: string;
};

export type SpendingPolicy = {
	id: string;
	accountId: string;
	dailyLimit: number | null;
	approvalThreshold: number | null;
	priceFloors: PriceFloor[];
	minimumBalances: MinimumBalance[];
	fundingPriority: FundingSource[];
	enabled: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export type PolicyViolation = {
	rule: string;
	message: string;
	currentValue: number;
	threshold: number;
};

export type PolicyCheckResult = {
	passed: boolean;
	requiresApproval: boolean;
	violations: PolicyViolation[];
};

export async function createDefaultPolicy(db: Database, accountId: string) {
	const [row] = await db
		.insert(spendingPoliciesTable)
		.values({
			id: ulid(),
			accountId,
			dailyLimit: DEFAULT_POLICY.dailyLimit.toFixed(6),
			approvalThreshold: DEFAULT_POLICY.approvalThreshold.toFixed(6),
			priceFloors: DEFAULT_POLICY.priceFloors,
			minimumBalances: DEFAULT_POLICY.minimumBalances,
			fundingPriority: DEFAULT_POLICY.fundingPriority,
			enabled: DEFAULT_POLICY.enabled,
		})
		.returning();

	return row!;
}

export async function getPolicy(db: Database, accountId: string) {
	const [row] = await db
		.select()
		.from(spendingPoliciesTable)
		.where(eq(spendingPoliciesTable.accountId, accountId));
	return row ?? null;
}

export async function updatePolicy(
	db: Database,
	accountId: string,
	updates: {
		dailyLimit?: number | null;
		approvalThreshold?: number | null;
		priceFloors?: PriceFloor[];
		minimumBalances?: MinimumBalance[];
		fundingPriority?: FundingSource[];
		enabled?: boolean;
	},
) {
	const setValues: Record<string, unknown> = { updatedAt: new Date() };

	if (updates.dailyLimit !== undefined) {
		setValues.dailyLimit = updates.dailyLimit?.toFixed(6) ?? null;
	}
	if (updates.approvalThreshold !== undefined) {
		setValues.approvalThreshold = updates.approvalThreshold?.toFixed(6) ?? null;
	}
	if (updates.priceFloors !== undefined) {
		setValues.priceFloors = updates.priceFloors;
	}
	if (updates.minimumBalances !== undefined) {
		setValues.minimumBalances = updates.minimumBalances;
	}
	if (updates.fundingPriority !== undefined) {
		setValues.fundingPriority = updates.fundingPriority;
	}
	if (updates.enabled !== undefined) {
		setValues.enabled = updates.enabled;
	}

	const [row] = await db
		.update(spendingPoliciesTable)
		.set(setValues)
		.where(eq(spendingPoliciesTable.accountId, accountId))
		.returning();

	if (!row) throw new Error(`Policy not found for account: ${accountId}`);
	return row;
}

export function evaluatePolicyRules(params: {
	amount: number;
	dailyLimit: number | null;
	dailySpent: number;
	approvalThreshold: number | null;
	priceFloors: PriceFloor[];
	minimumBalances: MinimumBalance[];
	currentPrices: Record<string, number>;
	currentPositions: Record<string, bigint>;
}): PolicyCheckResult {
	const violations: PolicyViolation[] = [];

	if (params.dailyLimit !== null) {
		const projectedTotal = params.dailySpent + params.amount;
		if (projectedTotal > params.dailyLimit) {
			violations.push({
				rule: "daily_limit",
				message: `Payment of $${params.amount} would exceed daily limit of $${params.dailyLimit} (already spent $${params.dailySpent} today)`,
				currentValue: projectedTotal,
				threshold: params.dailyLimit,
			});
		}
	}

	for (const floor of params.priceFloors) {
		const currentPrice = params.currentPrices[floor.assetSymbol];
		if (currentPrice !== undefined && currentPrice < floor.floorPrice) {
			violations.push({
				rule: "price_floor",
				message: `${floor.assetSymbol} price ($${currentPrice}) is below floor ($${floor.floorPrice})`,
				currentValue: currentPrice,
				threshold: floor.floorPrice,
			});
		}
	}

	for (const min of params.minimumBalances) {
		const currentPosition = params.currentPositions[min.assetSymbol];
		if (currentPosition !== undefined && currentPosition < BigInt(min.minimumAmount)) {
			violations.push({
				rule: "minimum_balance",
				message: `${min.assetSymbol} balance would drop below minimum`,
				currentValue: Number(currentPosition),
				threshold: Number(min.minimumAmount),
			});
		}
	}

	const passed = violations.length === 0;

	const requiresApproval =
		passed &&
		params.approvalThreshold !== null &&
		params.amount > params.approvalThreshold;

	return { passed, requiresApproval, violations };
}

export async function recordSpending(
	db: Database,
	accountId: string,
	amount: number,
	paymentIntentId?: string,
) {
	await db.insert(dailySpendingLogTable).values({
		id: ulid(),
		accountId,
		amount: amount.toFixed(6),
		paymentIntentId: paymentIntentId ?? null,
	});
}

export async function getDailySpending(
	db: Database,
	accountId: string,
	policy: { dailyLimit: string | null },
) {
	const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

	const rows = await db
		.select({ amount: dailySpendingLogTable.amount })
		.from(dailySpendingLogTable)
		.where(
			and(
				eq(dailySpendingLogTable.accountId, accountId),
				gte(dailySpendingLogTable.spentAt, twentyFourHoursAgo),
			),
		);

	const total = rows.reduce((sum, row) => sum + Number(row.amount), 0);
	const limit = policy.dailyLimit ? Number(policy.dailyLimit) : null;
	const remaining = limit !== null ? Math.max(0, limit - total) : null;

	return { total, limit, remaining };
}
