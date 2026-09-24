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

export function PositionCard({
	assetSymbol,
	assetName,
	amount,
	positionValue,
	haircut,
	spendingPower,
}: PositionCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.45, ease: APPLE_EASE }}
			className="rounded-lg border border-border bg-muted/50 p-4"
		>
			<div className="space-y-4">
				{/* Top Row: Symbol/Name and Value/Amount */}
				<div className="flex items-start justify-between">
					<div>
						<p className="text-sm font-semibold">{assetSymbol}</p>
						<p className="text-xs text-muted-foreground mt-0.5">{assetName}</p>
					</div>
					<div className="text-right">
						<p className="font-mono text-sm font-semibold tabular-nums">
							$
							{positionValue.toLocaleString("en-US", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</p>
						<p className="text-xs text-muted-foreground mt-0.5">{amount}</p>
					</div>
				</div>

				{/* Divider */}
				<div className="h-px bg-border/50" />

				{/* Bottom Row: Haircut and Spending Power */}
				<div className="flex items-center justify-between">
					<div>
						<p className="text-xs text-muted-foreground">Haircut</p>
						<p className="text-sm font-mono font-semibold mt-1 tabular-nums">
							{haircut.toLocaleString("en-US", {
								minimumFractionDigits: 1,
								maximumFractionDigits: 1,
							})}
							%
						</p>
					</div>
					<div className="text-right">
						<p className="text-xs text-muted-foreground">Spending Power</p>
						<p className={cn("text-sm font-mono font-semibold mt-1 tabular-nums", "text-primary")}>
							$
							{spendingPower.toLocaleString("en-US", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</p>
					</div>
				</div>
			</div>
		</motion.div>
	);
}
