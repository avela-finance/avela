export function formatCurrency(amount: number | null | undefined): string {
	const n = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(n);
}

export function formatAddress(address: string): string {
	if (address.length < 10) return address;
	return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatDate(iso: string): string {
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(iso));
}
