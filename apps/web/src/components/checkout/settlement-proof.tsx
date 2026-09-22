"use client";

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
			<div className="rounded-xl border border-border bg-card p-6">
				<div className="mb-4 flex items-center gap-2">
					<span className="text-2xl">✅</span>
					<h2 className="text-xl font-bold">Payment Settled</h2>
				</div>

				<div className="space-y-3">
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
				</div>
			</div>

			{/* Build a Market: Uniswap V3 swap proof */}
			<div className="rounded-xl border border-border bg-card p-6">
				<h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
					Onchain Proof — Market Order
				</h3>
				<p className="mb-4 text-sm text-muted-foreground">
					This payment generated a real Uniswap V3 swap on X Layer. Every &ldquo;Pay with
					Avela&rdquo; builds market volume for tokenized stock pools.
				</p>
				<div className="space-y-3">
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
				</div>
			</div>

			<div className="flex gap-3">
				<a
					href={explorerUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="flex-1 rounded-lg border border-border py-2 text-center text-sm font-medium hover:bg-muted"
				>
					View on Explorer
				</a>
				<a
					href="/checkout"
					className="flex-1 rounded-lg bg-primary py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Back to Store
				</a>
			</div>
		</div>
	);
}
