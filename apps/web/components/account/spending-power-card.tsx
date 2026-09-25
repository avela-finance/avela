"use client";

import { ArrowUpRight, Plus } from "@phosphor-icons/react";
import { motion } from "motion/react";
import Link from "next/link";
import { APPLE_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface SpendingPowerCardProps {
	totalSpendingPower: number;
	portfolioValue: number;
	stablecoinBalance: number;
	loading?: boolean;
}

function money(n: number) {
	return n.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

export function SpendingPowerCard({
	totalSpendingPower,
	portfolioValue,
	stablecoinBalance,
	loading = false,
}: SpendingPowerCardProps) {
	if (loading) {
		return (
			<div className="rounded-2xl border border-border bg-card p-6 md:p-8">
				<div className="h-3 w-32 animate-pulse rounded bg-muted" />
				<div className="mt-4 h-14 w-64 animate-pulse rounded bg-muted" />
				<div className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-6">
					<div className="h-10 animate-pulse rounded bg-muted" />
					<div className="h-10 animate-pulse rounded bg-muted" />
				</div>
			</div>
		);
	}

	return (
		<motion.section
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, ease: APPLE_EASE }}
			aria-label="Spending power"
			className="rounded-2xl border border-border bg-card p-6 md:p-8"
		>
			<div className="flex items-center justify-between gap-3">
				<p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
					Spending power
				</p>
				<span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
					<span className="relative flex h-1.5 w-1.5">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
						<span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
					</span>
					Live
				</span>
			</div>

			<p className="mt-3 font-mono text-5xl font-bold tracking-tight tabular-nums text-foreground md:text-6xl">
				${money(totalSpendingPower)}
			</p>
			<p className="mt-2 text-sm text-muted-foreground">
				Ready to spend — your stocks stay locked in the vault.
			</p>

			<div className="mt-6 grid grid-cols-2 divide-x divide-border border-t border-border pt-6">
				<div className="pr-4">
					<p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
						Portfolio value
					</p>
					<p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-foreground">
						${money(portfolioValue)}
					</p>
				</div>
				<div className="pl-4">
					<p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
						Reserve balance
					</p>
					<p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-foreground">
						${money(stablecoinBalance)}
					</p>
				</div>
			</div>

			<div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
				<Link
					href="/payments"
					className={cn(
						"inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-6 py-3.5",
						"text-[15px] font-semibold text-primary-foreground transition-all duration-150 ease-out",
						"hover:bg-primary/90 active:scale-[0.99]",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
					)}
				>
					Pay
					<ArrowUpRight size={18} weight="bold" aria-hidden />
				</Link>
				<Link
					href="/portfolio"
					className={cn(
						"inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-transparent px-6 py-3.5",
						"text-[15px] font-semibold text-foreground transition-all duration-150 ease-out",
						"hover:bg-muted active:scale-[0.99]",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
					)}
				>
					<Plus size={18} weight="bold" aria-hidden />
					Deposit
				</Link>
			</div>
		</motion.section>
	);
}
