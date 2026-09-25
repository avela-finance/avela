"use client";

import { motion } from "motion/react";
import { APPLE_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

type PositionCardProps = {
	assetSymbol: string;
	assetName: string;
	amount: string;
	positionValue: number;
	haircut: number;
	spendingPower: number;
};

function money(n: number | null | undefined, digits = 2) {
	const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
	return v.toLocaleString("en-US", {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	});
}

function num(n: number | null | undefined) {
	return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

function glyph(symbol: string | null | undefined) {
	const clean = (symbol ?? "").replace(/^w/i, "");
	return (clean.slice(0, 2) || "?").toUpperCase();
}

export function PositionCard({
	assetSymbol,
	assetName,
	amount,
	positionValue,
	haircut,
	spendingPower,
}: PositionCardProps) {
	const value = num(positionValue);
	const unlocked = num(spendingPower);
	const ratio = value > 0 ? Math.min(1, Math.max(0, unlocked / value)) : 0;

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.45, ease: APPLE_EASE }}
			className="rounded-2xl border border-border bg-card p-5"
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-3">
					<span
						aria-hidden="true"
						className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-mono text-xs font-bold tracking-wide text-primary"
					>
						{glyph(assetSymbol)}
					</span>
					<div>
						<p className="text-sm font-semibold text-foreground">{assetSymbol}</p>
						<p className="mt-0.5 text-xs text-muted-foreground">{assetName}</p>
					</div>
				</div>
				<div className="text-right">
					<p className="font-mono text-base font-semibold tabular-nums text-foreground">
						${money(positionValue)}
					</p>
					<p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">{amount}</p>
				</div>
			</div>

			<div
				className="mt-4 h-1 overflow-hidden rounded-full bg-muted"
				role="img"
				aria-label={`${assetSymbol} ${Math.round(ratio * 100)} percent unlocked`}
			>
				<div className="h-full rounded-full bg-primary" style={{ width: `${ratio * 100}%` }} />
			</div>

			<div className="mt-4 flex items-center justify-between border-t border-border pt-4">
				<div>
					<p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
						Haircut
					</p>
					<p className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
						{money(haircut, 1)}%
					</p>
				</div>
				<div className="text-right">
					<p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
						Unlocked
					</p>
					<p className={cn("mt-1 font-mono text-sm font-semibold tabular-nums", "text-primary")}>
						${money(spendingPower)}
					</p>
				</div>
			</div>
		</motion.div>
	);
}
