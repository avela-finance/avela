"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { getProduct } from "@/lib/demo-products";
import { PaymentPreview } from "@/components/checkout/payment-preview";
import type { PaymentPreviewData } from "@/components/checkout/payment-preview";

const DEMO_MERCHANT_ADDRESS = "0x000000000000000000000000000000000000dEaD";

export default function PayPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [status, setStatus] = useState<"idle" | "confirming" | "executing" | "error">("idle");
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
		setStatus("confirming");
		try {
			setStatus("executing");
			const response = await fetch("/api/payments/intent", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amount: totalAmount,
					recipientAddress: DEMO_MERCHANT_ADDRESS,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error?.message ?? "Payment failed");
			}

			const { data } = await response.json();
			router.push(`/checkout/receipt/${data.id}`);
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

			<div className="mb-6 space-y-2">
				{products.map((p) => (
					<div key={p!.id} className="flex justify-between text-sm">
						<span>{p!.name}</span>
						<span className="font-medium">${p!.price}</span>
					</div>
				))}
				<div className="border-t border-border pt-2">
					<div className="flex justify-between font-semibold">
						<span>Total</span>
						<span>${totalAmount}</span>
					</div>
				</div>
			</div>

			<PaymentPreview data={previewData} />

			<div className="mt-6">
				{status === "error" && (
					<div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
						{errorMessage}
					</div>
				)}

				<button
					type="button"
					onClick={handlePay}
					disabled={status === "confirming" || status === "executing"}
					className="w-full rounded-xl bg-primary py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
				>
					{status === "idle" && "Pay with Avela"}
					{status === "confirming" && "Confirming..."}
					{status === "executing" && "Executing payment..."}
					{status === "error" && "Try Again"}
				</button>

				<p className="mt-3 text-center text-xs text-muted-foreground">
					Your stock positions stay in the market. The merchant receives stablecoins.
				</p>
			</div>
		</div>
	);
}
