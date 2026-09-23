"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type AgentCardProps = {
	id: string;
	name: string;
	status: "active" | "suspended" | "expired" | "revoked";
	maxPerTransaction: number;
	maxPerDay: number;
	dailySpent: number;
};

const statusConfig = {
	active: {
		label: "Active",
		className: "text-primary bg-primary/10",
	},
	suspended: {
		label: "Suspended",
		className: "text-accent-foreground bg-accent/10",
	},
	expired: { label: "Expired", className: "text-muted-foreground bg-muted" },
	revoked: {
		label: "Revoked",
		className: "text-destructive bg-destructive/10",
	},
};

export function AgentCard({
	id,
	name,
	status,
	maxPerTransaction,
	maxPerDay,
	dailySpent,
}: AgentCardProps) {
	const { label, className } = statusConfig[status];

	return (
		<Link
			href={`/agents/${id}`}
			className="hover:bg-muted/50 flex flex-col gap-4 rounded-lg border border-border p-4 transition-colors"
		>
			<div className="flex items-center justify-between gap-2">
				<p className="truncate text-sm font-semibold">{name}</p>
				<span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", className)}>
					{label}
				</span>
			</div>

			<div className="grid grid-cols-3 gap-2 text-center">
				<div>
					<p className="text-muted-foreground text-xs">Per Tx</p>
					<p className="text-sm font-medium">{formatCurrency(maxPerTransaction)}</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">Daily Max</p>
					<p className="text-sm font-medium">{formatCurrency(maxPerDay)}</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">Today</p>
					<p className="text-sm font-medium">{formatCurrency(dailySpent)}</p>
				</div>
			</div>
		</Link>
	);
}
