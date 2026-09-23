"use client";

type ActivityType = "payment_settled" | "payment_failed" | "deposit" | "alert";

interface ActivityItem {
	id: string;
	type: ActivityType;
	description: string;
	amount: number | null;
	timestamp: string;
}

interface ActivityFeedProps {
	items: ActivityItem[];
	loading?: boolean;
}

const TYPE_LABELS: Record<ActivityType, string> = {
	payment_settled: "Paid",
	payment_failed: "Failed",
	deposit: "Deposited",
	alert: "Alert",
};

const TYPE_COLORS: Record<ActivityType, string> = {
	payment_settled: "text-primary bg-primary/10",
	payment_failed: "text-destructive bg-destructive/10",
	deposit: "text-secondary-foreground bg-secondary/10",
	alert: "text-accent-foreground bg-accent/10",
};

function formatTime(timestamp: string): string {
	try {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return "just now";
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;

		return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
	} catch {
		return timestamp;
	}
}

export function ActivityFeed({ items, loading = false }: ActivityFeedProps) {
	if (loading) {
		const skeletonIds = ["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4"];
		return (
			<div className="rounded-lg border border-border bg-muted/50 p-6">
				<h3 className="text-lg font-semibold mb-4">Activity</h3>
				<div className="space-y-3">
					{skeletonIds.map((id) => (
						<div
							key={id}
							className="flex items-start gap-3 pb-3 border-b border-border last:border-0"
						>
							<div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
							<div className="flex-1 space-y-2">
								<div className="h-4 w-32 animate-pulse rounded bg-muted" />
								<div className="h-3 w-48 animate-pulse rounded bg-muted" />
							</div>
							<div className="h-4 w-16 animate-pulse rounded bg-muted" />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<div className="rounded-lg border border-border bg-muted/50 p-6">
				<h3 className="text-lg font-semibold mb-4">Activity</h3>
				<p className="text-muted-foreground text-sm">No activity yet</p>
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-border bg-muted/50 p-6">
			<h3 className="text-lg font-semibold mb-4">Activity</h3>
			<div className="space-y-0">
				{items.map((item) => (
					<div
						key={item.id}
						className="flex items-start gap-3 py-3 border-b border-border last:border-0"
					>
						<div
							className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${TYPE_COLORS[item.type].split(" ")[0]}`}
						/>
						<div className="flex-1 min-w-0">
							<div className="flex items-start justify-between gap-2">
								<div>
									<p className="font-medium text-sm">{TYPE_LABELS[item.type]}</p>
									<p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
								</div>
								<div className="flex-shrink-0 text-right">
									{item.amount !== null && (
										<p className="font-mono text-sm font-semibold">
											$
											{item.amount.toLocaleString("en-US", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</p>
									)}
									<p className="text-xs text-muted-foreground mt-0.5">
										{formatTime(item.timestamp)}
									</p>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
