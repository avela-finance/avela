"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SettlementProof } from "@/components/checkout/settlement-proof";
import type { SettlementProofData } from "@/components/checkout/settlement-proof";

export default function ReceiptPage() {
	const params = useParams<{ paymentId: string }>();
	const [data, setData] = useState<SettlementProofData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchReceipt() {
			try {
				const response = await fetch(`/api/payments/${params.paymentId}`);
				if (!response.ok) {
					throw new Error("Payment not found");
				}
				const { data: payment } = await response.json();
				setData({
					paymentId: payment.id,
					amount: payment.amount,
					sourceAsset: payment.fundingDecision?.asset ?? "Unknown",
					sourceAmount: payment.fundingDecision?.amountIn ?? "0",
					settlementCurrency: payment.fundingDecision?.stablecoin ?? "USDG",
					txHash: payment.settlement?.txHash ?? "",
					blockNumber: payment.settlement?.blockNumber ?? 0,
					poolUsed: payment.fundingDecision?.pool ?? "",
					recipientAddress: payment.recipientAddress,
					timestamp: payment.settlement?.settledAt ?? payment.createdAt,
				});
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load receipt");
			} finally {
				setLoading(false);
			}
		}
		fetchReceipt();
	}, [params.paymentId]);

	if (loading) {
		return (
			<div className="mx-auto max-w-md py-12 text-center">
				<p className="text-muted-foreground">Loading receipt...</p>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="mx-auto max-w-md py-12 text-center">
				<p className="text-destructive">{error ?? "Receipt not found"}</p>
				<a href="/checkout" className="mt-4 inline-block text-primary hover:underline">
					Back to store
				</a>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-md">
			<SettlementProof data={data} />
		</div>
	);
}
