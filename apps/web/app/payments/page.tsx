"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { PaymentList } from "@/components/payments/payment-list";
import { api } from "@/lib/api";

type Payment = {
	id: string;
	amount: number;
	status: string;
	recipientAddress: string;
	createdAt: string;
};

type PaymentsResponse = {
	payments: Payment[];
};

export default function PaymentsPage() {
	const { getAccessToken } = usePrivy();
	const [loading, setLoading] = useState(true);
	const [payments, setPayments] = useState<Payment[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchPayments() {
			try {
				setLoading(true);
				setError(null);
				const token = await getAccessToken();
				const response = await api.get<PaymentsResponse>("/payments", { token });
				setPayments(response.data.payments ?? []);
			} catch (err) {
				console.error("Failed to fetch payments:", err);
				setError(err instanceof Error ? err.message : "Failed to load payments");
			} finally {
				setLoading(false);
			}
		}

		fetchPayments();
	}, [getAccessToken]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Payments</h1>
				<p className="text-muted-foreground mt-1">Your payment history</p>
			</div>

			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
					<p className="text-sm text-red-700 dark:text-red-300">{error}</p>
				</div>
			)}

			<div className="rounded-lg border border-border">
				{loading ? (
					<ul className="divide-border divide-y">
						{Array.from({ length: 3 }).map((_, i) => (
							<li
								// biome-ignore lint/suspicious/noArrayIndexKey: skeleton keys are stable
								key={`skeleton-${i}`}
								className="flex items-center justify-between px-4 py-3"
							>
								<div className="space-y-2">
									<div className="h-4 w-32 animate-pulse rounded bg-muted" />
									<div className="h-3 w-24 animate-pulse rounded bg-muted" />
								</div>
								<div className="flex flex-col items-end gap-1">
									<div className="h-4 w-16 animate-pulse rounded bg-muted" />
									<div className="h-4 w-12 animate-pulse rounded-full bg-muted" />
								</div>
							</li>
						))}
					</ul>
				) : (
					<PaymentList payments={payments} />
				)}
			</div>
		</div>
	);
}
