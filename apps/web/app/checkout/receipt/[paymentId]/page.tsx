"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { SettlementProofData } from "@/components/checkout/settlement-proof";
import { SettlementProof } from "@/components/checkout/settlement-proof";
import { api } from "@/lib/api";

type ReceiptResponse = {
	paymentId: string;
	accountId: string;
	amount: number;
	collateralAsset: string;
	settlementToken: string;
	settlementTxHash: string;
	recipientAddress: string;
	timestamp: string;
};

export default function ReceiptPage() {
	const params = useParams<{ paymentId: string }>();
	const { getAccessToken } = usePrivy();
	const [data, setData] = useState<SettlementProofData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchReceipt() {
			try {
				const token = await getAccessToken();
				const { data: receipt } = await api.get<ReceiptResponse>(
					`/payments/${params.paymentId}/receipt`,
					{ token },
				);
				setData({
					paymentId: receipt.paymentId,
					amount: Number(receipt.amount),
					collateralAsset: receipt.collateralAsset,
					settlementToken: receipt.settlementToken,
					txHash: receipt.settlementTxHash,
					recipientAddress: receipt.recipientAddress,
					timestamp:
						typeof receipt.timestamp === "string"
							? receipt.timestamp
							: new Date(receipt.timestamp).toISOString(),
				});
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load receipt");
			} finally {
				setLoading(false);
			}
		}
		fetchReceipt();
	}, [params.paymentId, getAccessToken]);

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
