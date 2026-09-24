"use client";

import { Wallet } from "@phosphor-icons/react";
import Link from "next/link";

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

export function PortfolioSummary({ positions, loading = false }: PortfolioSummaryProps) {
	if (loading) {
		const skeletonIds = ["skeleton-1", "skeleton-2", "skeleton-3"];
		return (
			<div className="rounded-lg border border-border bg-muted/50 p-6">
				<h3 className="text-lg font-semibold mb-4">Portfolio</h3>
				<div className="space-y-3">
					{skeletonIds.map((id) => (
						<div key={id} className="flex items-center justify-between p-3 bg-background rounded">
							<div className="space-y-1 flex-1">
								<div className="h-4 w-16 animate-pulse rounded bg-muted" />
								<div className="h-3 w-24 animate-pulse rounded bg-muted" />
							</div>
							<div className="space-y-1 text-right">
								<div className="h-4 w-20 animate-pulse rounded bg-muted" />
								<div className="h-3 w-20 animate-pulse rounded bg-muted" />
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (positions.length === 0) {
		// TODO: show live AvelaVault address with copy affordance once deployed (docs/specs/contracts.md lists vault as "To deploy").
		return (
			<div className="rounded-lg border border-border bg-muted/50 p-6">
				<h3 className="text-lg font-semibold mb-4">Portfolio</h3>
				<div role="status" className="flex flex-col items-center py-8 text-center">
					<Wallet size={32} weight="duotone" className="text-muted-foreground" aria-hidden />
					<p className="mt-3 text-sm font-semibold">No positions yet</p>
					<p className="mt-1 max-w-xs text-sm text-muted-foreground">
						Deposit wrapped xStocks to your vault to unlock spending power
					</p>
					<Link
						href="/portfolio"
						className="mt-4 rounded-sm text-sm font-medium text-primary transition-transform duration-150 hover:underline active:scale-[0.98]"
					>
						View portfolio
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-border bg-muted/50 p-6">
			<h3 className="text-lg font-semibold mb-4">Portfolio</h3>
			<div className="space-y-3">
				{positions.map((position) => (
					<div
						key={position.assetSymbol}
						className="flex items-center justify-between rounded bg-background p-3"
					>
						<div>
							<p className="font-semibold">{position.assetSymbol}</p>
							<p className="text-xs text-muted-foreground">{position.assetName}</p>
						</div>
						<div className="text-right">
							<p className="font-mono font-semibold tabular-nums">
								$
								{position.positionValue.toLocaleString("en-US", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</p>
							<p className="text-xs text-primary tabular-nums">
								SP: $
								{position.spendingPower.toLocaleString("en-US", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
