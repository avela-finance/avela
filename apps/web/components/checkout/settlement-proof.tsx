"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const XLAYER_EXPLORER = "https://www.okx.com/web3/explorer/xlayer/tx";

export type SettlementProofData = {
	paymentId: string;
	amount: number;
	sourceAsset: string;
	sourceAmount: string;
	settlementCurrency: string;
	txHash: string;
	blockNumber: number;
	poolUsed: string;
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
						<span className="text-muted-foreground">Source</span>
						<span className="font-medium">
							{data.sourceAmount} {data.sourceAsset}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Settlement</span>
						<span className="font-medium">{data.settlementCurrency}</span>
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
						Onchain Proof — Market Order
					</CardTitle>
					<CardDescription>
						This payment generated a real Uniswap V3 swap on X Layer. Every &ldquo;Pay with
						Avela&rdquo; builds market volume for tokenized stock pools.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex justify-between">
						<span className="text-muted-foreground">Swap</span>
						<span className="font-mono text-sm">
							{data.sourceAsset} → {data.settlementCurrency}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Pool</span>
						<span className="font-mono text-sm">
							{data.poolUsed.slice(0, 6)}...{data.poolUsed.slice(-4)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Block</span>
						<span className="font-mono text-sm">{data.blockNumber}</span>
					</div>
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
				<Button variant="outline" className="flex-1" render={<a href={explorerUrl} target="_blank" rel="noopener noreferrer" />}>
					View on Explorer
				</Button>
				<Button className="flex-1" render={<a href="/checkout" />}>
					Back to Store
				</Button>
			</div>
		</div>
	);
}
