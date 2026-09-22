"use client";

export type PaymentPreviewData = {
	amount: number;
	fundingAsset: string;
	settlementCurrency: string;
	estimatedGas: string;
	recipientAddress: string;
};

export function PaymentPreview({ data }: { data: PaymentPreviewData }) {
	return (
		<div className="rounded-xl border border-border bg-card p-6">
			<h3 className="mb-4 text-sm font-medium text-muted-foreground">Payment Preview</h3>
			<div className="space-y-3">
				<div className="flex justify-between">
					<span className="text-muted-foreground">Amount</span>
					<span className="font-semibold">${data.amount.toFixed(2)}</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Funding source</span>
					<span className="font-medium">{data.fundingAsset} (spending power)</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Settlement</span>
					<span className="font-medium">{data.settlementCurrency}</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Estimated gas</span>
					<span className="text-sm text-muted-foreground">{data.estimatedGas}</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Merchant</span>
					<span className="font-mono text-sm">
						{data.recipientAddress.slice(0, 6)}...{data.recipientAddress.slice(-4)}
					</span>
				</div>
			</div>
		</div>
	);
}
