"use client";

import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
	created: "bg-muted text-muted-foreground",
	policy_check: "bg-muted text-muted-foreground",
	awaiting_approval: "bg-amber-900/50 text-amber-300",
	funding: "bg-blue-900/50 text-blue-300",
	executing: "bg-blue-900/50 text-blue-300",
	settling: "bg-blue-900/50 text-blue-300",
	settled: "bg-emerald-900/50 text-emerald-300",
	failed: "bg-red-900/50 text-red-300",
	rejected: "bg-red-900/50 text-red-300",
};

export function PaymentStatusBadge({ status }: { status: string }) {
	return (
		<span
			className={cn(
				"inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
				statusStyles[status] ?? "bg-muted text-muted-foreground",
			)}
		>
			{status.replace(/_/g, " ")}
		</span>
	);
}
