"use client";

import { motion } from "motion/react";
import { APPLE_EASE } from "@/lib/motion";

interface SpendingPowerCardProps {
	totalSpendingPower: number;
	portfolioValue: number;
	stablecoinBalance: number;
	loading?: boolean;
}

export function SpendingPowerCard({
	totalSpendingPower,
	portfolioValue,
	stablecoinBalance,
	loading = false,
}: SpendingPowerCardProps) {
	if (loading) {
		return (
			<div className="rounded-lg border border-border bg-gradient-to-br from-primary/10 to-muted p-6 space-y-4">
				<div className="h-4 w-32 animate-pulse rounded bg-muted" />
				<div className="h-12 w-48 animate-pulse rounded bg-muted" />
				<div className="grid grid-cols-2 gap-4">
					<div className="h-6 w-24 animate-pulse rounded bg-muted" />
					<div className="h-6 w-24 animate-pulse rounded bg-muted" />
				</div>
			</div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.45, ease: APPLE_EASE }}
			className="rounded-lg border border-border bg-gradient-to-br from-primary/10 to-muted p-6"
		>
			<div className="space-y-2">
				<p className="text-sm font-medium text-muted-foreground">Spending Power</p>
				<p className="font-mono text-4xl font-bold text-primary tabular-nums">
					$
					{totalSpendingPower.toLocaleString("en-US", {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					})}
				</p>
			</div>

			<div className="mt-6 grid grid-cols-2 gap-4">
				<div>
					<p className="text-xs text-muted-foreground">Portfolio Value</p>
					<p className="mt-1 font-mono text-lg font-semibold tabular-nums">
						$
						{portfolioValue.toLocaleString("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</p>
				</div>
				<div>
					<p className="text-xs text-muted-foreground">Stablecoin Balance</p>
					<p className="mt-1 font-mono text-lg font-semibold tabular-nums">
						$
						{stablecoinBalance.toLocaleString("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</p>
				</div>
			</div>
		</motion.div>
	);
}
