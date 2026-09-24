"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { PaymentPreviewData } from "@/components/checkout/payment-preview";
import { PaymentPreview } from "@/components/checkout/payment-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { getProduct } from "@/lib/demo-products";

const DEMO_MERCHANT_ADDRESS = "0x000000000000000000000000000000000000dEaD";

export default function PayPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { getAccessToken } = usePrivy();
	const [status, setStatus] = useState<"idle" | "executing" | "error">("idle");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const productIds = searchParams.get("products")?.split(",") ?? [];
	const products = productIds.map(getProduct).filter(Boolean);
	const totalAmount = products.reduce((sum, p) => sum + (p?.price ?? 0), 0);

	const previewData: PaymentPreviewData = useMemo(
		() => ({
			amount: totalAmount,
			fundingAsset: "wSPYx",
			settlementCurrency: "USDG",
			estimatedGas: "~$0.01",
			recipientAddress: DEMO_MERCHANT_ADDRESS,
		}),
		[totalAmount],
	);

	async function handlePay() {
		try {
			setStatus("executing");
			setErrorMessage(null);
			const token = await getAccessToken();

			const intentRes = await api.post<{ id: string }>("/payments/intent", {
				token,
				body: { amount: totalAmount, recipientAddress: DEMO_MERCHANT_ADDRESS },
			});
			const intentId = intentRes.data.id;

			const authRes = await api.post<{ status: string }>(`/payments/${intentId}/authorize`, {
				token,
			});
			if (authRes.data.status !== "settled" && authRes.data.status !== "settling") {
				throw new Error(
					authRes.data.status === "awaiting_approval"
						? "Payment needs approval — check WhatsApp or your email"
						: `Payment ${authRes.data.status}`,
				);
			}

			router.push(`/checkout/receipt/${intentId}`);
		} catch (err) {
			setStatus("error");
			setErrorMessage(err instanceof Error ? err.message : "Payment failed");
		}
	}

	if (products.length === 0) {
		return (
			<div className="py-12 text-center">
				<p className="text-muted-foreground">No products selected.</p>
				<a href="/checkout" className="mt-4 inline-block text-primary hover:underline">
					Back to store
				</a>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-md">
			<h1 className="mb-6 text-2xl font-bold">Pay with Avela</h1>

			<Card className="mb-6">
				<CardContent className="space-y-2">
					{products.map((p) => (
						<div key={p?.id} className="flex justify-between text-sm">
							<span>{p?.name}</span>
							<span className="font-medium">${p?.price}</span>
						</div>
					))}
					<div className="border-t border-border pt-2">
						<div className="flex justify-between font-semibold">
							<span>Total</span>
							<span>${totalAmount}</span>
						</div>
					</div>
				</CardContent>
			</Card>

			<PaymentPreview data={previewData} />

			<div className="mt-6">
				{status === "error" && (
					<div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
						{errorMessage}
					</div>
				)}

				<Button className="w-full" size="lg" onClick={handlePay} disabled={status === "executing"}>
					{status === "idle" && "Pay with Avela"}
					{status === "executing" && "Executing payment..."}
					{status === "error" && "Try Again"}
				</Button>

				<p className="mt-3 text-center text-xs text-muted-foreground">
					Your stock positions stay in the market. The merchant receives stablecoins.
				</p>
			</div>
		</div>
	);
}
