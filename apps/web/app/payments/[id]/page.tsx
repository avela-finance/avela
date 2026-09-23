"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";
import { api } from "@/lib/api";
import { formatAddress, formatCurrency, formatDate } from "@/lib/format";

const XLAYER_EXPLORER = "https://www.okx.com/web3/explorer/xlayer/tx/";

type PaymentDetail = {
	id: string;
	amount: number;
	status: string;
	recipientAddress: string;
	recipientUsername: string | null;
	fundingDecision: {
		source: string;
		asset: string | null;
		stablecoin: string;
	} | null;
	settlement: {
		txHash: string;
		blockNumber: number;
		amountSettled: string;
		stablecoin: string;
		settledAt: string;
	} | null;
	createdAt: string;
};

export default function PaymentDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { getAccessToken } = usePrivy();
	const [loading, setLoading] = useState(true);
	const [payment, setPayment] = useState<PaymentDetail | null>(null);

	useEffect(() => {
		async function fetchPayment() {
			try {
				setLoading(true);
				const token = await getAccessToken();
				const response = await api.get<PaymentDetail>(`/payments/${id}`, {
					token,
				});
				setPayment(response.data);
			} catch (err: unknown) {
				console.error("Failed to fetch payment:", err);
			} finally {
				setLoading(false);
			}
		}

		if (id) fetchPayment();
	}, [id, getAccessToken]);

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="h-8 w-24 animate-pulse rounded bg-muted" />
				<div className="space-y-4 rounded-lg border border-border p-6">
					<div className="h-10 w-40 animate-pulse rounded bg-muted" />
					<div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
				</div>
			</div>
		);
	}

	if (!payment) {
		return (
			<div className="py-12 text-center">
				<p className="text-muted-foreground">Payment not found.</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Payment Receipt</h1>
				<p className="text-muted-foreground mt-1 font-mono text-xs">{payment.id}</p>
			</div>

			<div className="rounded-lg border border-border p-6 space-y-6">
				{/* Amount + status */}
				<div className="flex items-start justify-between">
					<div>
						<p className="text-muted-foreground text-sm">Amount</p>
						<p className="text-4xl font-bold">{formatCurrency(payment.amount)}</p>
					</div>
					<PaymentStatusBadge status={payment.status} />
				</div>

				<div className="h-px bg-border" />

				{/* Recipient */}
				<div className="space-y-1">
					<p className="text-muted-foreground text-sm">Recipient</p>
					{payment.recipientUsername && <p className="font-medium">{payment.recipientUsername}</p>}
					<p className="font-mono text-sm">{formatAddress(payment.recipientAddress)}</p>
				</div>

				{/* Date */}
				<div className="space-y-1">
					<p className="text-muted-foreground text-sm">Date</p>
					<p className="text-sm">{formatDate(payment.createdAt)}</p>
				</div>

				{/* Funding decision */}
				{payment.fundingDecision && (
					<>
						<div className="h-px bg-border" />
						<div className="space-y-2">
							<p className="text-sm font-medium">Funding Decision</p>
							<dl className="grid grid-cols-2 gap-2 text-sm">
								<dt className="text-muted-foreground">Source</dt>
								<dd>{payment.fundingDecision.source}</dd>
								{payment.fundingDecision.asset && (
									<>
										<dt className="text-muted-foreground">Asset</dt>
										<dd>{payment.fundingDecision.asset}</dd>
									</>
								)}
								<dt className="text-muted-foreground">Stablecoin</dt>
								<dd>{payment.fundingDecision.stablecoin}</dd>
							</dl>
						</div>
					</>
				)}

				{/* Settlement proof */}
				{payment.settlement && (
					<>
						<div className="h-px bg-border" />
						<div className="space-y-2">
							<p className="text-sm font-medium">Settlement Proof</p>
							<dl className="grid grid-cols-2 gap-2 text-sm">
								<dt className="text-muted-foreground">Amount settled</dt>
								<dd>
									{payment.settlement.amountSettled} {payment.settlement.stablecoin}
								</dd>
								<dt className="text-muted-foreground">Block</dt>
								<dd>{payment.settlement.blockNumber.toLocaleString()}</dd>
								<dt className="text-muted-foreground">Settled at</dt>
								<dd>{formatDate(payment.settlement.settledAt)}</dd>
								<dt className="text-muted-foreground">Transaction</dt>
								<dd className="truncate">
									<a
										href={`${XLAYER_EXPLORER}${payment.settlement.txHash}`}
										target="_blank"
										rel="noopener noreferrer"
										className="text-secondary-foreground underline hover:text-secondary-foreground/80"
									>
										{formatAddress(payment.settlement.txHash)}
									</a>
								</dd>
							</dl>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
