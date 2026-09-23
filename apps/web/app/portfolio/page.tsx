"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { PositionCard } from "@/components/portfolio/position-card";
import { api } from "@/lib/api";

interface Position {
	assetSymbol: string;
	assetName: string;
	amount: string;
	positionValue: number;
	haircut: number;
	spendingPower: number;
}

interface PortfolioData {
	positions: Position[];
}

export default function PortfolioPage() {
	const { getAccessToken } = usePrivy();

	const [loading, setLoading] = useState(true);
	const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchPortfolio() {
			try {
				setLoading(true);
				setError(null);
				const token = await getAccessToken();

				const response = await api.get<PortfolioData>("/accounts/me/portfolio", { token });
				setPortfolio(response.data);
			} catch (err) {
				console.error("Failed to fetch portfolio:", err);
				setError(err instanceof Error ? err.message : "Failed to load portfolio");
				setPortfolio({ positions: [] });
			} finally {
				setLoading(false);
			}
		}

		fetchPortfolio();
	}, [getAccessToken]);

	const positions = portfolio?.positions ?? [];
	const isEmpty = !loading && positions.length === 0;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Portfolio</h1>
				<p className="text-muted-foreground mt-1">Your locked positions and spending power</p>
			</div>

			{error && (
				<div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
					<p className="text-sm text-destructive">{error}</p>
				</div>
			)}

			{loading ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton keys are stable
							key={`skeleton-${i}`}
							className="rounded-lg border border-border bg-muted/50 p-4 space-y-4"
						>
							<div className="space-y-2">
								<div className="h-4 w-16 animate-pulse rounded bg-muted" />
								<div className="h-3 w-24 animate-pulse rounded bg-muted" />
							</div>
							<div className="h-px bg-border/50" />
							<div className="flex justify-between">
								<div className="space-y-2">
									<div className="h-3 w-12 animate-pulse rounded bg-muted" />
									<div className="h-4 w-16 animate-pulse rounded bg-muted" />
								</div>
								<div className="space-y-2">
									<div className="h-3 w-12 animate-pulse rounded bg-muted" />
									<div className="h-4 w-16 animate-pulse rounded bg-muted" />
								</div>
							</div>
						</div>
					))}
				</div>
			) : isEmpty ? (
				<div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
					<p className="text-sm text-muted-foreground">
						No positions yet. Deposit wrapped xStocks to get started.
					</p>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{positions.map((position) => (
						<PositionCard
							key={position.assetSymbol}
							assetSymbol={position.assetSymbol}
							assetName={position.assetName}
							amount={position.amount}
							positionValue={position.positionValue}
							haircut={position.haircut}
							spendingPower={position.spendingPower}
						/>
					))}
				</div>
			)}
		</div>
	);
}
