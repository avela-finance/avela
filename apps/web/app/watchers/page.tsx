"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

type Watcher = {
	id: string;
	type: string;
	config: { threshold: number };
	status: "active" | "triggered" | "paused" | "disabled";
	lastTriggeredAt: string | null;
};

export default function WatchersPage() {
	const { getAccessToken } = usePrivy();

	const [loading, setLoading] = useState(true);
	const [watchers, setWatchers] = useState<Watcher[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [thresholdValue, setThresholdValue] = useState("");
	const [creating, setCreating] = useState(false);

	useEffect(() => {
		async function fetchWatchers() {
			try {
				setLoading(true);
				setError(null);
				const token = await getAccessToken();

				const response = await api.get<Watcher[]>("/accounts/me/watchers", { token });
				setWatchers(response.data);
			} catch (err) {
				console.error("Failed to fetch watchers:", err);
				setError(err instanceof Error ? err.message : "Failed to load watchers");
			} finally {
				setLoading(false);
			}
		}

		fetchWatchers();
	}, [getAccessToken]);

	async function handleCreate() {
		if (!thresholdValue || Number(thresholdValue) <= 0) {
			setError("Threshold must be greater than 0");
			return;
		}

		try {
			setCreating(true);
			setError(null);
			const token = await getAccessToken();

			await api.post("/accounts/me/watchers", {
				token,
				body: { threshold: Number(thresholdValue) },
			});

			setThresholdValue("");

			// Re-fetch watchers list
			const response = await api.get<Watcher[]>("/accounts/me/watchers", { token });
			setWatchers(response.data);
		} catch (err) {
			console.error("Failed to create watcher:", err);
			setError(err instanceof Error ? err.message : "Failed to create watcher");
		} finally {
			setCreating(false);
		}
	}

	const getStatusColor = (status: Watcher["status"]) => {
		switch (status) {
			case "active":
				return "bg-primary/10 text-primary";
			case "triggered":
				return "bg-accent/10 text-accent-foreground";
			case "paused":
				return "bg-muted text-muted-foreground";
			case "disabled":
				return "bg-muted text-muted-foreground/60";
			default:
				return "bg-muted text-muted-foreground";
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Watchers</h1>
				<p className="text-muted-foreground mt-1">Monitor spending thresholds and get alerts</p>
			</div>

			{error && (
				<div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
					<p className="text-sm text-destructive">{error}</p>
				</div>
			)}

			{/* Create Watcher Form */}
			<div className="max-w-2xl rounded-md bg-muted/50 p-5">
				<div className="flex gap-3 items-end">
					<div className="flex-1">
						<label htmlFor="threshold" className="block text-sm font-medium text-foreground mb-2">
							Spending Threshold (USD)
						</label>
						<input
							id="threshold"
							type="number"
							min="0"
							step="0.01"
							placeholder="Enter threshold amount"
							value={thresholdValue}
							onChange={(e) => setThresholdValue(e.target.value)}
							className="rounded-sm border border-border bg-muted px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none w-full"
						/>
					</div>
					<button
						type="button"
						onClick={handleCreate}
						disabled={creating || !thresholdValue}
						className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
					>
						{creating ? "Creating…" : "Create"}
					</button>
				</div>
			</div>

			{/* Watchers List */}
			{loading ? (
				<div className="space-y-3">
					<div className="rounded-md bg-muted/50 p-4">
						<div className="space-y-3">
							<div className="h-4 w-48 animate-pulse rounded bg-muted" />
							<div className="flex justify-between">
								<div className="h-4 w-32 animate-pulse rounded bg-muted" />
								<div className="h-4 w-24 animate-pulse rounded bg-muted" />
							</div>
						</div>
					</div>
					<div className="rounded-md bg-muted/50 p-4">
						<div className="space-y-3">
							<div className="h-4 w-48 animate-pulse rounded bg-muted" />
							<div className="flex justify-between">
								<div className="h-4 w-32 animate-pulse rounded bg-muted" />
								<div className="h-4 w-24 animate-pulse rounded bg-muted" />
							</div>
						</div>
					</div>
				</div>
			) : watchers.length === 0 ? (
				<div className="rounded-md border border-dashed border-border bg-muted/30 px-5 py-8 text-center">
					<p className="text-sm text-muted-foreground">No watchers configured.</p>
				</div>
			) : (
				<div className="space-y-3">
					{watchers.map((watcher) => (
						<div key={watcher.id} className="rounded-md bg-muted/50 p-4">
							<div className="flex items-start justify-between">
								<div className="flex-1 space-y-1">
									<p className="text-sm font-medium text-foreground">
										Alert when spending exceeds ${watcher.config.threshold.toFixed(2)}
									</p>
									{watcher.lastTriggeredAt && (
										<p className="text-xs text-muted-foreground">
											Last triggered: {formatDate(watcher.lastTriggeredAt)}
										</p>
									)}
									{!watcher.lastTriggeredAt && (
										<p className="text-xs text-muted-foreground">Never triggered</p>
									)}
								</div>
								<div className="flex items-center gap-2 ml-4">
									<span
										className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(watcher.status)}`}
									>
										{watcher.status.charAt(0).toUpperCase() + watcher.status.slice(1)}
									</span>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
