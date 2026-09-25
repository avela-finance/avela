/**
 * Adapt the `/accounts/me/portfolio` response into view-ready data.
 *
 * API shape (nested):
 *   { accountId, positions: [{ assetSymbol, amount (bigint-as-string), ... }],
 *     spendingPower: { perAsset: [{ assetSymbol, positionValue, haircut, spendingPower }],
 *                      stablecoinBalance, totalSpendingPower } }
 *
 * View shape (flat, null-safe): totals + enriched position rows.
 */

export interface PositionView {
	assetSymbol: string;
	assetName: string;
	/** Human-readable token amount, e.g. "0.0026 wSPYx". */
	amount: string;
	positionValue: number;
	haircut: number;
	spendingPower: number;
}

export interface AccountView {
	totalSpendingPower: number;
	portfolioValue: number;
	stablecoinBalance: number;
	positions: PositionView[];
}

const ASSET_META: Record<string, { name: string; decimals: number }> = {
	wSPYx: { name: "S&P 500", decimals: 18 },
	wQQQx: { name: "Nasdaq 100", decimals: 18 },
	wNVDAx: { name: "Nvidia", decimals: 18 },
	wGOOGLx: { name: "Alphabet", decimals: 18 },
	wAAPLx: { name: "Apple", decimals: 18 },
};

function num(n: unknown): number {
	return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

function humanAmount(raw: string | null | undefined, decimals: number): string {
	if (!raw) return "0";
	try {
		const ten = BigInt(10);
		const zero = BigInt(0);
		const base = ten ** BigInt(decimals);
		const value = BigInt(raw);
		const whole = value / base;
		const frac = value % base;
		if (frac === zero) return whole.toString();
		const fracStr = frac.toString().padStart(decimals, "0").slice(0, 4).replace(/0+$/, "");
		return fracStr ? `${whole}.${fracStr}` : whole.toString();
	} catch {
		return "0";
	}
}

interface RawPosition {
	assetSymbol?: string;
	amount?: string;
}

interface Breakdown {
	assetSymbol?: string;
	positionValue?: number;
	haircut?: number;
	spendingPower?: number;
}

interface ApiPortfolio {
	positions?: RawPosition[];
	spendingPower?: {
		perAsset?: Breakdown[];
		stablecoinBalance?: number;
		totalSpendingPower?: number;
	} | null;
}

export function toAccountView(data: unknown): AccountView {
	const empty: AccountView = {
		totalSpendingPower: 0,
		portfolioValue: 0,
		stablecoinBalance: 0,
		positions: [],
	};
	if (!data || typeof data !== "object") return empty;
	const d = data as ApiPortfolio;

	const rawPositions = Array.isArray(d.positions) ? d.positions : [];
	const perAsset = Array.isArray(d.spendingPower?.perAsset)
		? (d.spendingPower?.perAsset as Breakdown[])
		: [];
	const bySymbol = new Map(perAsset.map((b) => [(b.assetSymbol ?? "").toLowerCase(), b] as const));

	const positions: PositionView[] = rawPositions.map((p) => {
		const symbol = p.assetSymbol ?? "?";
		const meta = ASSET_META[symbol] ?? { name: symbol, decimals: 18 };
		const breakdown = bySymbol.get(symbol.toLowerCase());
		return {
			assetSymbol: symbol,
			assetName: meta.name,
			amount: `${humanAmount(p.amount, meta.decimals)} ${symbol}`,
			positionValue: num(breakdown?.positionValue),
			// Core haircut is a fraction (0.5); views display percent.
			haircut: num(breakdown?.haircut) * 100,
			spendingPower: num(breakdown?.spendingPower),
		};
	});

	const portfolioValue = positions.reduce((sum, p) => sum + p.positionValue, 0);

	return {
		totalSpendingPower: num(d.spendingPower?.totalSpendingPower),
		portfolioValue,
		stablecoinBalance: num(d.spendingPower?.stablecoinBalance),
		positions,
	};
}
