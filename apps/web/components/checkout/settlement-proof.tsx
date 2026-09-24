"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const XLAYER_EXPLORER = "https://www.okx.com/web3/explorer/xlayer/tx";

export type SettlementProofData = {
	paymentId: string;
	amount: number;
	collateralAsset: string;
	settlementToken: string;
	txHash: string;
	blockNumber?: number;
	recipientAddress: string;
	timestamp: string;
};

export function SettlementProof({ data }: { data: SettlementProofData }) {
	const explorerUrl = `${XLAYER_EXPLORER}/${data.txHash}`;

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Badge variant="secondary">Settled</Badge>
						<CardTitle>Payment Settled</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Amount</span>
						<span className="font-semibold">${data.amount.toFixed(2)}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Merchant received</span>
						<span className="font-medium">{data.settlementToken}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Merchant</span>
						<span className="font-mono text-sm">
							{data.recipientAddress.slice(0, 6)}...{data.recipientAddress.slice(-4)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Time</span>
						<span className="text-sm">{new Date(data.timestamp).toLocaleString()}</span>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
						Onchain Proof — Reserve Settlement
					</CardTitle>
					<CardDescription>
						Your {data.collateralAsset} position stayed locked in AvelaVault. The merchant was
						paid from the stablecoin reserve — no sale, no swap. Both events share one
						paymentId.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Collateral</span>
						<span className="font-medium">{data.collateralAsset} (locked, untouched)</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Payment ID</span>
						<span className="font-mono text-sm">
							{data.paymentId.slice(0, 10)}...{data.paymentId.slice(-8)}
						</span>
					</div>
					{data.blockNumber ? (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Block</span>
							<span className="font-mono text-sm">{data.blockNumber}</span>
						</div>
					) : null}
					<div className="flex justify-between">
						<span className="text-muted-foreground">Transaction</span>
						<a
							href={explorerUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="font-mono text-sm text-primary hover:underline"
						>
							{data.txHash.slice(0, 10)}...{data.txHash.slice(-8)} ↗
						</a>
					</div>
				</CardContent>
			</Card>

			<div className="flex gap-3">
				<Button
					variant="outline"
					className="flex-1"
					render={<a href={explorerUrl} target="_blank" rel="noopener noreferrer" />}
				>
					View on Explorer
				</Button>
				<Button className="flex-1" render={<a href="/checkout" />}>
					Back to Store
				</Button>
			</div>
		</div>
	);
}
