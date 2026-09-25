"use client";

import { Warning } from "@phosphor-icons/react";
import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useState } from "react";
import { ActivityFeed } from "@/components/account/activity-feed";
import { PortfolioSummary } from "@/components/account/portfolio-summary";
import { SpendingPowerCard } from "@/components/account/spending-power-card";
import { api } from "@/lib/api";
import { type AccountView, toAccountView } from "@/lib/portfolio";

interface ActivityItem {
	id: string;
	type: "payment_settled" | "payment_failed" | "deposit" | "alert";
	description: string;
	amount: number | null;
	timestamp: string;
}

interface PaymentData {
	items: ActivityItem[];
}

export default function DashboardPage() {
	const { getAccessToken } = usePrivy();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [spendingPower, setSpendingPower] = useState<AccountView | null>(null);
	const [activity, setActivity] = useState<ActivityItem[]>([]);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			setError(false);
			const token = await getAccessToken();

			const [accountRes, paymentsRes] = await Promise.all([
				api.get("/accounts/me/portfolio", { token }),
				api.get<PaymentData>("/payments", { token }),
			]);

			setSpendingPower(toAccountView(accountRes.data));
			const items = paymentsRes.data?.items;
			setActivity(Array.isArray(items) ? items : []);
		} catch {
			setError(true);
			setSpendingPower({
				totalSpendingPower: 0,
				portfolioValue: 0,
				stablecoinBalance: 0,
				positions: [],
			});
			setActivity([]);
		} finally {
			setLoading(false);
		}
	}, [getAccessToken]);

	useEffect(() => {
		load();
	}, [load]);

	return (
		<div className="space-y-5">
			<div>
				<p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
					Avela · X Layer
				</p>
				<h1 className="mt-1.5 text-3xl font-bold tracking-tight text-balance text-foreground">
					Overview
				</h1>
			</div>

			{error && !loading && (
				<div
					role="alert"
					className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4"
				>
					<Warning size={20} weight="duotone" className="shrink-0 text-destructive" aria-hidden />
					<p className="flex-1 text-sm font-medium">Couldn&apos;t load your account</p>
					<button
						type="button"
						onClick={load}
						className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-all duration-150 ease-out hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					>
						Retry
					</button>
				</div>
			)}

			<SpendingPowerCard
				totalSpendingPower={spendingPower?.totalSpendingPower ?? 0}
				portfolioValue={spendingPower?.portfolioValue ?? 0}
				stablecoinBalance={spendingPower?.stablecoinBalance ?? 0}
				loading={loading}
			/>

			<div className="grid gap-5 lg:grid-cols-2">
				<PortfolioSummary
					positions={Array.isArray(spendingPower?.positions) ? spendingPower.positions : []}
					loading={loading}
				/>
				<ActivityFeed items={activity} loading={loading} />
			</div>
		</div>
	);
}
