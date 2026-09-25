"use client";

import { Vault } from "@phosphor-icons/react";
import { motion } from "motion/react";
import Link from "next/link";
import { APPLE_EASE } from "@/lib/motion";

interface Position {
	assetSymbol: string;
	assetName: string;
	positionValue: number;
	spendingPower: number;
	haircut: number;
}

interface PortfolioSummaryProps {
	positions: Position[];
	loading?: boolean;
}

function money(n: number) {
	return n.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

function glyph(symbol: string) {
	const clean = symbol.replace(/^w/i, "");
	return clean.slice(0, 2).toUpperCase();
}

export function PortfolioSummary({ positions, loading = false }: PortfolioSummaryProps) {
	if (loading) {
		return (
			<section aria-label="Portfolio" className="rounded-2xl border border-border bg-card p-6">
				<p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
					Portfolio
				</p>
				<div className="mt-5 space-y-4">
					{["skeleton-1", "skeleton-2", "skeleton-3"].map((id) => (
						<div key={id} className="flex items-center gap-3">
							<div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
							<div className="flex-1 space-y-2">
								<div className="h-4 w-24 animate-pulse rounded bg-muted" />
								<div className="h-2 w-full animate-pulse rounded-full bg-muted" />
							</div>
							<div className="h-4 w-20 animate-pulse rounded bg-muted" />
						</div>
					))}
				</div>
			</section>
		);
	}

	return (
		<motion.section
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.08, ease: APPLE_EASE }}
			aria-label="Portfolio"
			className="rounded-2xl border border-border bg-card p-6"
		>
			<div className="flex items-baseline justify-between gap-3">
				<p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
					Portfolio
				</p>
				<Link
					href="/portfolio"
					className="rounded-sm text-xs font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					View all
				</Link>
			</div>

			{positions.length === 0 ? (
				<div role="status" className="flex flex-col items-center py-10 text-center">
					<span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
						<Vault size={24} weight="duotone" className="text-primary" aria-hidden />
					</span>
					<p className="mt-4 text-sm font-semibold text-foreground">No positions yet</p>
					<p className="mt-1 max-w-xs text-sm text-muted-foreground">
						Deposit wrapped xStocks to your vault to unlock spending power
					</p>
					<Link
						href="/portfolio"
						className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-[0.98]"
					>
						Deposit
					</Link>
				</div>
			) : (
				<ul className="mt-5 space-y-5">
					{positions.map((position) => {
						const ratio =
							position.positionValue > 0
								? Math.min(1, Math.max(0, position.spendingPower / position.positionValue))
								: 0;
						return (
							<li key={position.assetSymbol}>
								<div className="flex items-center gap-3">
									<span
										aria-hidden="true"
										className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-mono text-xs font-bold tracking-wide text-primary"
									>
										{glyph(position.assetSymbol)}
									</span>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-semibold text-foreground">
											{position.assetSymbol}
										</p>
										<p className="truncate text-xs text-muted-foreground">{position.assetName}</p>
									</div>
									<div className="shrink-0 text-right">
										<p className="font-mono text-sm font-semibold tabular-nums text-foreground">
											${money(position.positionValue)}
										</p>
										<p className="mt-0.5 font-mono text-xs tabular-nums text-primary">
											${money(position.spendingPower)} unlocked
										</p>
									</div>
								</div>
								<div
									className="mt-2.5 ml-[52px] h-1 overflow-hidden rounded-full bg-muted"
									role="img"
									aria-label={`${position.assetSymbol} ${Math.round(ratio * 100)} percent unlocked`}
								>
									<div
										className="h-full rounded-full bg-primary"
										style={{ width: `${ratio * 100}%` }}
									/>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</motion.section>
	);
}
