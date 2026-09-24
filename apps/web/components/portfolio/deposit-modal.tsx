"use client";

import { useSendTransaction, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

type AssetOption = {
	symbol: string;
	name: string;
	address: string;
	decimals: number;
};

type DepositPlan = {
	accountId: string;
	assetSymbol: string;
	token: string;
	vault: string;
	amountRaw: string;
	amountDecimals: number;
	whitelisted: boolean;
	approve: { to: string; data: string };
	deposit: { to: string; data: string };
};

type Status = "idle" | "planning" | "approving" | "depositing" | "confirming" | "done" | "error";

function toRaw(human: string, decimals: number): string {
	// String-only decimal shift — no BigInt (web target is below ES2020).
	const [whole = "0", frac = ""] = human.split(".");
	const paddedFrac = (frac + "0".repeat(decimals)).slice(0, decimals);
	const combined = `${whole === "" ? "0" : whole}${paddedFrac}`.replace(/^0+(?=\d)/, "");
	return combined === "" ? "0" : combined;
}

export function DepositModal({
	open,
	token,
	onClose,
	onDeposited,
}: {
	open: boolean;
	token: string | null;
	onClose: () => void;
	onDeposited: () => void;
}) {
	const { wallets } = useWallets();
	const { sendTransaction } = useSendTransaction();
	const [assets, setAssets] = useState<AssetOption[]>([]);
	const [symbol, setSymbol] = useState("");
	const [amount, setAmount] = useState("");
	const [status, setStatus] = useState<Status>("idle");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) return;
		setStatus("idle");
		setError(null);
		api
			.get<{ symbol: string; name: string; address: string; decimals: number }[]>("/assets")
			.then((res) => {
				setAssets(res.data);
				setSymbol((current) => current || res.data[0]?.symbol || "");
			})
			.catch((err) => setError(err instanceof Error ? err.message : "Failed to load assets"));
	}, [open]);

	if (!open) return null;

	async function handleDeposit() {
		try {
			setError(null);
			const asset = assets.find((a) => a.symbol === symbol);
			if (!asset) throw new Error("Select an asset");
			if (!amount || Number(amount) <= 0) throw new Error("Enter an amount");
			if (!token) throw new Error("Sign in first");

			const wallet = wallets[0];
			if (!wallet) throw new Error("No wallet connected");
			await wallet.switchChain(196);

			setStatus("planning");
			const amountRaw = toRaw(amount, asset.decimals);
			const planRes = await api.post<DepositPlan>(`/accounts/me/deposit`, {
				token,
				body: { assetSymbol: symbol, amountRaw },
			});
			const plan = planRes.data;
			if (!plan.whitelisted) throw new Error(`${symbol} is not whitelisted in the vault`);

			setStatus("approving");
			await sendTransaction({
				to: plan.approve.to as `0x${string}`,
				data: plan.approve.data as `0x${string}`,
			});

			setStatus("depositing");
			const { hash } = await sendTransaction({
				to: plan.deposit.to as `0x${string}`,
				data: plan.deposit.data as `0x${string}`,
			});

			setStatus("confirming");
			await api.post(`/accounts/me/deposit/confirm`, {
				token,
				body: { assetSymbol: symbol, amountRaw, txHash: hash },
			});

			setStatus("done");
			onDeposited();
		} catch (err) {
			setStatus("error");
			setError(err instanceof Error ? err.message : "Deposit failed");
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Deposit wrapped xStocks</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<label htmlFor="deposit-asset" className="text-sm font-medium">
							Asset
						</label>
						<select
							id="deposit-asset"
							className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
							value={symbol}
							onChange={(e) => setSymbol(e.target.value)}
						>
							{assets.map((a) => (
								<option key={a.symbol} value={a.symbol}>
									{a.symbol} — {a.name}
								</option>
							))}
						</select>
					</div>

					<div className="space-y-2">
						<label htmlFor="deposit-amount" className="text-sm font-medium">
							Amount
						</label>
						<input
							id="deposit-amount"
							type="number"
							min="0"
							step="any"
							placeholder="0.01"
							className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
						/>
					</div>

					{error && (
						<div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
					)}
					{status === "done" && (
						<div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-600">
							Deposit confirmed. Positions locked in AvelaVault.
						</div>
					)}

					<div className="flex gap-3">
						<Button variant="outline" className="flex-1" onClick={onClose}>
							{status === "done" ? "Close" : "Cancel"}
						</Button>
						<Button
							className="flex-1"
							onClick={handleDeposit}
							disabled={status !== "idle" && status !== "error" && status !== "done"}
						>
							{status === "idle" && "Approve & Deposit"}
							{status === "planning" && "Preparing…"}
							{status === "approving" && "Approving…"}
							{status === "depositing" && "Depositing…"}
							{status === "confirming" && "Confirming…"}
							{status === "done" && "Done"}
							{status === "error" && "Try Again"}
						</Button>
					</div>

					<p className="text-center text-xs text-muted-foreground">
						Two signatures: token approval, then vault deposit. Positions stay locked as collateral.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
