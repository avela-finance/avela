"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { ActivityFeed } from "@/components/account/activity-feed";
import { PortfolioSummary } from "@/components/account/portfolio-summary";
import { SpendingPowerCard } from "@/components/account/spending-power-card";
import { api } from "@/lib/api";

interface Position {
	assetSymbol: string;
	assetName: string;
	positionValue: number;
	spendingPower: number;
	haircut: number;
}

interface ActivityItem {
	id: string;
	type: "payment_settled" | "payment_failed" | "deposit" | "alert";
	description: string;
	amount: number | null;
	timestamp: string;
}

interface AccountData {
	totalSpendingPower: number;
	portfolioValue: number;
	stablecoinBalance: number;
	positions: Position[];
}

interface PaymentData {
	items: ActivityItem[];
}

export default function DashboardPage() {
	const { getAccessToken } = usePrivy();

	const [loading, setLoading] = useState(true);
	const [spendingPower, setSpendingPower] = useState<AccountData | null>(null);
	const [activity, setActivity] = useState<ActivityItem[]>([]);

	useEffect(() => {
		async function fetchData() {
			try {
				setLoading(true);
				const token = await getAccessToken();

				const [accountRes, paymentsRes] = await Promise.all([
					api.get<AccountData>("/accounts/me/portfolio", { token }),
					api.get<PaymentData>("/payments", { token }),
				]);

				setSpendingPower(accountRes.data);
				setActivity(paymentsRes.data?.items ?? []);
			} catch (error) {
				console.error("Failed to fetch dashboard data:", error);
				// Set defaults on error
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
		}

		fetchData();
	}, [getAccessToken]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Dashboard</h1>
				<p className="text-muted-foreground mt-1">Manage your spending power and portfolio</p>
			</div>

			<SpendingPowerCard
				totalSpendingPower={spendingPower?.totalSpendingPower ?? 0}
				portfolioValue={spendingPower?.portfolioValue ?? 0}
				stablecoinBalance={spendingPower?.stablecoinBalance ?? 0}
				loading={loading}
			/>

			<div className="grid gap-6 lg:grid-cols-2">
				<PortfolioSummary positions={spendingPower?.positions ?? []} loading={loading} />
				<ActivityFeed items={activity} loading={loading} />
			</div>
		</div>
	);
}
