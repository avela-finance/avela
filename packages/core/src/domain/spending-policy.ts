import { eq } from "drizzle-orm";
import { ulid } from "ulidx";
import type { Database } from "../db/client.js";
import { spendingPoliciesTable } from "../db/schema.js";
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
