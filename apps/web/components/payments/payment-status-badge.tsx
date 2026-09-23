"use client";

import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
	created: "bg-muted text-muted-foreground",
	policy_check: "bg-muted text-muted-foreground",
	awaiting_approval: "bg-accent/10 text-accent-foreground",
	funding: "bg-secondary/10 text-secondary-foreground",
	executing: "bg-secondary/10 text-secondary-foreground",
	settling: "bg-secondary/10 text-secondary-foreground",
	settled: "bg-primary/10 text-primary",
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
