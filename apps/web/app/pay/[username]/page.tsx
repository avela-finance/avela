"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ResolvedIdentity = {
	accountId: string;
	walletAddress: string;
};

export default function PaymentLinkPage() {
	const params = useParams<{ username: string }>();
	const searchParams = useSearchParams();
	const router = useRouter();

	const prefillAmount = searchParams.get("amount");
	const [resolved, setResolved] = useState<ResolvedIdentity | null>(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [amount, setAmount] = useState(prefillAmount ?? "");
	const [status, setStatus] = useState<"idle" | "paying" | "error">("idle");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		async function resolve() {
			try {
				const response = await fetch(`/api/identity/resolve/${params.username}`);
				if (!response.ok) {
					setNotFound(true);
					return;
				}
				const { data } = (await response.json()) as { data: ResolvedIdentity };
				setResolved(data);
			} catch {
				setNotFound(true);
			} finally {
				setLoading(false);
			}
		}
		resolve();
	}, [params.username]);

	async function handlePay() {
		if (!resolved || !amount) return;
		setStatus("paying");
		setErrorMessage(null);
		try {
			const response = await fetch("/api/payments/intent", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amount: Number.parseFloat(amount),
					recipientAddress: resolved.walletAddress,
					recipientUsername: params.username,
				}),
			});
			if (!response.ok) {
				const errorBody = (await response.json()) as { error?: { message?: string } };
				throw new Error(errorBody.error?.message ?? "Payment failed");
			}
			const { data } = (await response.json()) as { data: { id: string } };
			router.push(`/checkout/receipt/${data.id}`);
		} catch (err) {
			setStatus("error");
			setErrorMessage(err instanceof Error ? err.message : "Payment failed");
		}
	}

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	if (notFound) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-4">
				<h1 className="text-2xl font-bold">User not found</h1>
				<p className="text-muted-foreground">
					No Avela account with username &ldquo;{params.username}&rdquo;
				</p>
				<a href="/" className="text-sm text-primary hover:underline">
					Back to home
				</a>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold">Pay @{params.username}</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Send payment via Avela — stocks stay, they get stablecoins.
					</p>
				</div>

				<Card>
					<CardContent className="space-y-4 pt-6">
						<div>
							<label htmlFor="amount" className="mb-1 block text-sm font-medium">
								Amount (USD)
							</label>
							<input
								id="amount"
								type="number"
								min="0.01"
								step="0.01"
								placeholder="0.00"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								className="w-full rounded-lg border border-border bg-background px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
							/>
						</div>

						{status === "error" && (
							<div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
								{errorMessage ?? "Payment failed. Please try again."}
							</div>
						)}

						<Button
							className="w-full"
							size="lg"
							onClick={handlePay}
							disabled={!amount || Number.parseFloat(amount) <= 0 || status === "paying"}
						>
							{status === "paying" ? "Processing..." : "Pay with Avela"}
						</Button>
					</CardContent>
				</Card>

				<p className="text-center text-xs text-muted-foreground">
					Recipient:{" "}
					<span className="font-mono">
						{resolved?.walletAddress.slice(0, 6)}...{resolved?.walletAddress.slice(-4)}
					</span>
				</p>

				<p className="text-center text-xs text-muted-foreground">
					Your stock positions stay in the market. The recipient receives stablecoins.
				</p>
			</div>
		</div>
	);
}
