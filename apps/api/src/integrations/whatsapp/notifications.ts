function truncateAddress(address: string): string {
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatUsd(amount: number): string {
	return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatUsdFixed(amount: number): string {
	return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatApprovalMessage(params: {
	agentName: string;
	amount: number;
	sourceAsset: string;
	settlementCurrency: string;
	recipientAddress: string;
}): string {
	return [
		"🔔 *Approval Request*",
		`Agent "${params.agentName}" wants to spend ${formatUsdFixed(params.amount)}`,
		`Source: ${params.sourceAsset} → ${params.settlementCurrency}`,
		`Recipient: ${truncateAddress(params.recipientAddress)}`,
	].join("\n");
}

export function formatReceiptMessage(params: {
	amount: number;
	recipientAddress: string;
	sourceAsset: string;
	sourceAmount: string;
	settlementCurrency: string;
	txHash: string;
}): string {
	return [
		"✅ *Payment Settled*",
		`${formatUsdFixed(params.amount)} paid to ${truncateAddress(params.recipientAddress)}`,
		`Source: ${params.sourceAsset} (${params.sourceAmount} shares)`,
		`Settlement: ${params.settlementCurrency}`,
		`Tx: ${truncateAddress(params.txHash)}`,
	].join("\n");
}

export function formatSpendingAlertMessage(params: {
	currentSpendingPower: number;
	previousSpendingPower: number;
	threshold: number;
}): string {
	const change = params.currentSpendingPower - params.previousSpendingPower;
	const direction = change < 0 ? "dropped" : "changed";
	return [
		"⚠️ *Spending Power Alert*",
		`Your spending power ${direction} to ${formatUsd(params.currentSpendingPower)} (threshold: ${formatUsd(params.threshold)})`,
		`Was: ${formatUsd(params.previousSpendingPower)}`,
	].join("\n");
}

export function formatBalanceMessage(params: {
	totalValue: number;
	positions: Array<{ symbol: string; amount: string; valueUsd: number }>;
	totalSpendingPower: number;
}): string {
	const positionLines = params.positions.map(
		(p) => `├ ${p.symbol}: ${p.amount} shares (${formatUsd(p.valueUsd)})`,
	);
	const lastIdx = positionLines.length - 1;
	if (lastIdx >= 0) {
		const last = positionLines[lastIdx];
		if (last !== undefined) positionLines[lastIdx] = last.replace("├", "└");
	}
	return [
		"📊 *Your Avela Balance*",
		`Portfolio: ${formatUsd(params.totalValue)} across ${params.positions.length} assets`,
		...positionLines,
		`Spending power: ${formatUsd(params.totalSpendingPower)}`,
	].join("\n");
}

export function formatSpendingPowerMessage(params: {
	perAsset: Array<{ symbol: string; value: number; haircut: number; spendingPower: number }>;
	stablecoinBalance: number;
	totalSpendingPower: number;
}): string {
	const assetLines = params.perAsset.map(
		(a) =>
			`├ ${a.symbol}: ${formatUsd(a.value)} × ${Math.round((1 - a.haircut) * 100)}% = ${formatUsd(a.spendingPower)}`,
	);
	const lastIdx = assetLines.length - 1;
	if (lastIdx >= 0) {
		const last = assetLines[lastIdx];
		if (last !== undefined) assetLines[lastIdx] = last.replace("├", "└");
	}
	return [
		"💰 *Spending Power*",
		...assetLines,
		...(params.stablecoinBalance > 0
			? [`Stablecoin balance: ${formatUsd(params.stablecoinBalance)}`]
			: []),
		`*Total: ${formatUsd(params.totalSpendingPower)}*`,
	].join("\n");
}
