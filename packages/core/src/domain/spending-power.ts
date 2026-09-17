// packages/core/src/domain/spending-power.ts
export function calculateSpendingPower(
	balance: string,
	lockedBalance: string,
	reserveMinimum: string,
): string {
	const available =
		Number.parseFloat(balance) -
		Number.parseFloat(lockedBalance) -
		Number.parseFloat(reserveMinimum);
	if (available <= 0) return "0";
	return parseFloat(available.toFixed(10)).toString();
}
