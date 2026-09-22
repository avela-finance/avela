"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type PaymentPreviewData = {
	amount: number;
	fundingAsset: string;
	settlementCurrency: string;
	estimatedGas: string;
	recipientAddress: string;
};

export function PaymentPreview({ data }: { data: PaymentPreviewData }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm text-muted-foreground">Payment Preview</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
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
			</CardContent>
		</Card>
	);
}
