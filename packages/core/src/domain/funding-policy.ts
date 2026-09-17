import { PolicyViolationError } from "../errors.js";
import type { FundingPlan, FundingRuleResult } from "../types.js";
import { isAssetEligible } from "./asset-eligibility.js";
import { calculateSpendingPower } from "./spending-power.js";

export interface BuildFundingPlanParams {
	amount: string;
	stablecoinBalance: string;
	stablecoinLocked: string;
	stockBalance: string;
	stockLocked: string;
	stockAsset: string;
	stockPriceUsd: string | null;
	stockPriceTimestamp: Date | null;
	policy: {
		reserveMinimum: string;
		approvalThreshold: string;
		dailyCap: string;
		priceFloor: string;
		executionLimit: string;
	};
	dailySpentSoFar: string;
	isAgentInitiated: boolean;
	recipientApproved: boolean;
}

export function buildFundingPlan(params: BuildFundingPlanParams): FundingPlan {
	const rules: FundingRuleResult[] = [];
	const amount = Number.parseFloat(params.amount);

	// Step 1: Check daily cap
	const dailyRemaining =
		Number.parseFloat(params.policy.dailyCap) - Number.parseFloat(params.dailySpentSoFar);
	const dailyCapPassed = amount <= dailyRemaining;
	rules.push({
		rule: "daily_cap",
		passed: dailyCapPassed,
		reason: dailyCapPassed ? "within cap" : "exceeds daily cap",
	});
	if (!dailyCapPassed) {
		throw new PolicyViolationError(
			"daily_cap",
			`Payment ${params.amount} exceeds daily remaining ${dailyRemaining}`,
		);
	}

	// Step 2: Check recipient approval for agent-initiated payments
	if (params.isAgentInitiated) {
		rules.push({
			rule: "recipient_approval",
			passed: params.recipientApproved,
			reason: params.recipientApproved ? "approved" : "unapproved recipient",
		});
		if (!params.recipientApproved) {
			throw new PolicyViolationError(
				"recipient_approval",
				"Agent-initiated payment to unapproved recipient",
			);
		}
	}

	// Step 3: Calculate available stablecoin spending power
	const stablecoinAvailable = Number.parseFloat(
		calculateSpendingPower(
			params.stablecoinBalance,
			params.stablecoinLocked,
			params.policy.reserveMinimum,
		),
	);
	rules.push({
		rule: "stablecoin_balance",
		passed: true,
		reason: `available: ${stablecoinAvailable}`,
	});

	// Step 4: Stablecoin covers full amount — pure stablecoin path
	if (stablecoinAvailable >= amount) {
		const requiresApproval = amount > Number.parseFloat(params.policy.approvalThreshold);
		rules.push({
			rule: "approval_threshold",
			passed: !requiresApproval,
			reason: requiresApproval ? "exceeds threshold" : "under threshold",
		});
		return {
			stablecoinAmount: params.amount,
			conversionAmount: "0",
			conversionAsset: null,
			totalAmount: params.amount,
			requiresApproval,
			rulesChecked: rules,
		};
	}

	// Step 5: Check stock asset eligibility for conversion
	const eligible = isAssetEligible(
		params.stockAsset,
		params.stockPriceUsd !== null,
		Number.parseFloat(params.policy.executionLimit) > 0,
	);
	rules.push({ rule: "asset_eligibility", passed: eligible.eligible, reason: eligible.reason });
	if (!eligible.eligible) {
		throw new PolicyViolationError(
			"asset_eligibility",
			`Cannot fund shortfall: ${eligible.reason}`,
		);
	}

	// Step 6a: Check price floor
	// At this point isAssetEligible passed, which requires hasPrice === true
	const stockPrice = Number.parseFloat(params.stockPriceUsd ?? "0");
	const priceFloor = Number.parseFloat(params.policy.priceFloor);
	const priceFloorPassed = stockPrice >= priceFloor;
	rules.push({
		rule: "price_floor",
		passed: priceFloorPassed,
		reason: priceFloorPassed ? "above floor" : `price ${stockPrice} below floor ${priceFloor}`,
	});
	if (!priceFloorPassed) {
		throw new PolicyViolationError(
			"price_floor",
			`Stock price ${stockPrice} below floor ${priceFloor}`,
		);
	}

	// Step 6b: Check execution limit on conversion amount
	const conversionNeeded = amount - stablecoinAvailable;
	const executionLimit = Number.parseFloat(params.policy.executionLimit);
	const executionLimitPassed = conversionNeeded <= executionLimit;
	rules.push({
		rule: "execution_limit",
		passed: executionLimitPassed,
		reason: executionLimitPassed
			? "within limit"
			: `conversion ${conversionNeeded} exceeds limit ${executionLimit}`,
	});
	if (!executionLimitPassed) {
		throw new PolicyViolationError(
			"execution_limit",
			`Conversion ${conversionNeeded} exceeds execution limit ${executionLimit}`,
		);
	}

	// Step 7: Build mixed funding amounts
	const stablecoinAmount = stablecoinAvailable.toString();
	const conversionAmount = conversionNeeded.toString();

	// Step 8: Check approval threshold
	const requiresApproval = amount > Number.parseFloat(params.policy.approvalThreshold);
	rules.push({
		rule: "approval_threshold",
		passed: !requiresApproval,
		reason: requiresApproval ? "exceeds threshold" : "under threshold",
	});

	// Step 9: Return the funding plan
	return {
		stablecoinAmount,
		conversionAmount,
		conversionAsset: params.stockAsset,
		totalAmount: params.amount,
		requiresApproval,
		rulesChecked: rules,
	};
}
