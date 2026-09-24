"use client";

import Link from "next/link";
import { formatAddress, formatCurrency, formatDate } from "@/lib/format";
import { PaymentStatusBadge } from "./payment-status-badge";

type Payment = {
	id: string;
	amount: number;
	status: string;
	recipientAddress: string;
	createdAt: string;
};

export function PaymentList({ payments }: { payments: Payment[] }) {
	if (payments.length === 0) {
		return <p className="text-muted-foreground py-8 text-center text-sm">No payments yet.</p>;
	}

	return (
		<ul className="divide-border divide-y">
			{payments.map((payment) => (
				<li key={payment.id}>
					<Link
						href={`/payments/${payment.id}`}
						className="hover:bg-muted/50 flex items-center justify-between px-4 py-3 transition-colors active:scale-[0.98]"
					>
						<div className="min-w-0 flex-1">
							<p className="text-sm font-medium">{formatAddress(payment.recipientAddress)}</p>
							<p className="text-muted-foreground text-xs">{formatDate(payment.createdAt)}</p>
						</div>
						<div className="ml-4 flex flex-shrink-0 flex-col items-end gap-1">
							<span className="text-sm font-semibold">{formatCurrency(payment.amount)}</span>
							<PaymentStatusBadge status={payment.status} />
						</div>
					</Link>
				</li>
			))}
		</ul>
	);
}
