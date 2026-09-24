import { ulid } from "ulidx";
import { keccak256, toHex } from "viem";
import type { RouterAdapter } from "../adapters/router-adapter.js";
import type { VaultAdapter } from "../adapters/vault-adapter.js";
import type { Database } from "../db/client.js";
import { getAsset, STABLECOIN_DECIMALS, STABLECOINS } from "./asset.js";
import type { FundingDecision, PaymentStatus } from "./payment-intent.js";
import type { SpendingPower } from "./types.js";

export function generatePaymentId(): string {
	return keccak256(toHex(ulid()));
}

export function selectFundingSource(params: {
	amount: number;
	spendingPower: SpendingPower;
}): FundingDecision {
	const { amount, spendingPower } = params;
	const paymentId = generatePaymentId();

	const eligible = spendingPower.perAsset
		.filter((a) => a.spendingPower >= amount)
		.filter((a) => getAsset(a.assetSymbol) !== undefined);

	if (eligible.length > 0) {
		const [selected] = eligible.sort((a, b) => b.spendingPower - a.spendingPower);
		if (!selected) throw new Error("No eligible funding source");
		const asset = getAsset(selected.assetSymbol);
		if (!asset) throw new Error(`Unknown asset: ${selected.assetSymbol}`);

		return {
			source: "spending_power",
			collateralAsset: selected.assetSymbol,
			collateralVerified: false,
			collateralAmount: null,
			settlementToken: asset.settlementStablecoin,
			paymentId,
			spendingPowerAtDecision: spendingPower.totalSpendingPower,
			decidedAt: new Date(),
		};
	}

	if (spendingPower.stablecoinBalance >= amount) {
		return {
			source: "stablecoin_balance",
			collateralAsset: null,
			collateralVerified: false,
			collateralAmount: null,
			settlementToken: "USDG",
			paymentId,
			spendingPowerAtDecision: spendingPower.totalSpendingPower,
			decidedAt: new Date(),
		};
	}

	throw new Error(
		"Insufficient funds: neither spending power nor stablecoin balance covers the payment",
	);
}

export type ExecutePaymentDeps = {
	db: Database;
	getPaymentIntent: (
		db: Database,
		id: string,
	) => Promise<{
		id: string;
		accountId: string;
		amount: string | number;
		recipientAddress: string;
		status: string;
	} | null>;
	updatePaymentStatus: (
		db: Database,
		id: string,
		status: PaymentStatus,
		fundingDecision?: FundingDecision,
	) => Promise<{ status: PaymentStatus }>;
	evaluatePolicy: (params: {
		accountId: string;
		amount: number;
	}) => Promise<{ passed: boolean; requiresApproval: boolean; violations: unknown[] }>;
	calculateSpendingPower: (accountId: string) => Promise<SpendingPower>;
	vaultAdapter: VaultAdapter;
	routerAdapter: RouterAdapter;
	recordSettlement: (
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
	) => Promise<unknown>;
	getAccountWalletAddress: (accountId: string) => Promise<string>;
};

export async function executePayment(
	deps: ExecutePaymentDeps,
	intentId: string,
): Promise<{ status: PaymentStatus }> {
	const intent = await deps.getPaymentIntent(deps.db, intentId);
	if (!intent) throw new Error(`Payment intent not found: ${intentId}`);

	const intentAmount = Number(intent.amount);

	await deps.updatePaymentStatus(deps.db, intentId, "policy_check");
	const policyResult = await deps.evaluatePolicy({
		accountId: intent.accountId,
		amount: intentAmount,
	});

	if (!policyResult.passed) {
		return deps.updatePaymentStatus(deps.db, intentId, "failed");
	}

	if (policyResult.requiresApproval) {
		return deps.updatePaymentStatus(deps.db, intentId, "awaiting_approval");
	}

	const spendingPower = await deps.calculateSpendingPower(intent.accountId);
	const fundingDecision = selectFundingSource({
		amount: intentAmount,
		spendingPower,
	});

	if (fundingDecision.source === "spending_power" && fundingDecision.collateralAsset) {
		const collateralSymbol: string = fundingDecision.collateralAsset;
		const walletAddress = await deps.getAccountWalletAddress(intent.accountId);
		const asset = getAsset(collateralSymbol);
		if (!asset) throw new Error(`Unknown collateral asset: ${collateralSymbol}`);
		const lockedBalance = await deps.vaultAdapter.getLockedBalance(walletAddress, asset.address);

		const currentPower = await deps.calculateSpendingPower(intent.accountId);
		const assetPower = currentPower.perAsset.find((a) => a.assetSymbol === collateralSymbol);

		if (lockedBalance === 0n || !assetPower || assetPower.spendingPower < intentAmount) {
			return deps.updatePaymentStatus(deps.db, intentId, "failed");
		}

		fundingDecision.collateralVerified = true;
		fundingDecision.collateralAmount = lockedBalance.toString();
	}

	await deps.updatePaymentStatus(deps.db, intentId, "collateral_verify", fundingDecision);

	await deps.updatePaymentStatus(deps.db, intentId, "settling");
	const walletAddress = await deps.getAccountWalletAddress(intent.accountId);
	const stablecoinAddress = STABLECOINS[fundingDecision.settlementToken];
	const decimals = STABLECOIN_DECIMALS[fundingDecision.settlementToken];
	const settlementAmount = BigInt(Math.round(intentAmount * 10 ** decimals));

	try {
		const result = await deps.routerAdapter.executePayment({
			token: stablecoinAddress,
			merchant: intent.recipientAddress,
			amount: settlementAmount,
			paymentId: fundingDecision.paymentId,
			collateralOwner: walletAddress,
		});

		await deps.recordSettlement(deps.db, {
			paymentIntentId: intentId,
			paymentId: fundingDecision.paymentId,
			txHash: result.txHash,
			blockNumber: result.blockNumber,
			amountSettled: settlementAmount,
			settlementToken: fundingDecision.settlementToken,
			gasUsed: result.gasUsed,
		});

		return deps.updatePaymentStatus(deps.db, intentId, "settled");
	} catch {
		return deps.updatePaymentStatus(deps.db, intentId, "failed");
	}
}
