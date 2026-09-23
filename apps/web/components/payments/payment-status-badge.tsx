"use client";

import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
	created: "bg-muted text-muted-foreground",
	policy_check: "bg-muted text-muted-foreground",
	awaiting_approval: "bg-warning/10 text-warning",
	funding: "bg-info/10 text-info",
	executing: "bg-info/10 text-info",
	settling: "bg-info/10 text-info",
	settled: "bg-success/10 text-success",
	failed: "bg-destructive/10 text-destructive",
	rejected: "bg-destructive/10 text-destructive",
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
