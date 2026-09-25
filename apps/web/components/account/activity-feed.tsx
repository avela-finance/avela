"use client";

import { Receipt } from "@phosphor-icons/react";
import { motion } from "motion/react";
import Link from "next/link";
import { APPLE_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

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

const TYPE_DOT: Record<ActivityType, string> = {
	payment_settled: "bg-primary",
	payment_failed: "bg-destructive",
	deposit: "bg-foreground",
	alert: "bg-accent-foreground",
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
		return (
			<section aria-label="Activity" className="rounded-2xl border border-border bg-card p-6">
				<p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
					Activity
				</p>
				<div className="mt-5 space-y-4">
					{["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4"].map((id) => (
						<div key={id} className="flex items-center gap-3">
							<div className="h-2 w-2 animate-pulse rounded-full bg-muted" />
							<div className="h-4 flex-1 animate-pulse rounded bg-muted" />
							<div className="h-4 w-16 animate-pulse rounded bg-muted" />
						</div>
					))}
				</div>
			</section>
		);
	}

	return (
		<motion.section
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.16, ease: APPLE_EASE }}
			aria-label="Activity"
			className="rounded-2xl border border-border bg-card p-6"
		>
			<div className="flex items-baseline justify-between gap-3">
				<p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
					Activity
				</p>
				<Link
					href="/payments"
					className="rounded-sm text-xs font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					View all
				</Link>
			</div>

			{items.length === 0 ? (
				<div role="status" className="flex flex-col items-center py-10 text-center">
					<span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
						<Receipt size={24} weight="duotone" className="text-muted-foreground" aria-hidden />
					</span>
					<p className="mt-4 text-sm font-semibold text-foreground">No activity yet</p>
					<p className="mt-1 max-w-xs text-sm text-muted-foreground">
						Payments and alerts will appear here
					</p>
				</div>
			) : (
				<ol className="mt-2">
					{items.map((item) => (
						<li
							key={item.id}
							className="flex items-start gap-3 border-b border-border py-3.5 last:border-0 last:pb-0"
						>
							<span
								aria-hidden="true"
								className={cn("mt-[7px] h-2 w-2 shrink-0 rounded-full", TYPE_DOT[item.type])}
							/>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-semibold text-foreground">{TYPE_LABELS[item.type]}</p>
								<p className="mt-0.5 truncate text-xs text-muted-foreground">{item.description}</p>
							</div>
							<div className="shrink-0 text-right">
								{item.amount !== null && item.amount !== undefined && (
									<p className="font-mono text-sm font-semibold tabular-nums text-foreground">
										$
										{Number.isFinite(item.amount)
											? item.amount.toLocaleString("en-US", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})
											: "0.00"}
									</p>
								)}
								<p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
									{formatTime(item.timestamp)}
								</p>
							</div>
						</li>
					))}
				</ol>
			)}
		</motion.section>
	);
}
