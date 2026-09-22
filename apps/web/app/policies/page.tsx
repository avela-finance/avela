"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface SpendingPolicy {
	dailyLimit: number | null;
	approvalThreshold: number | null;
	fundingPriority: string[];
}

export default function PoliciesPage() {
	const { getAccessToken } = usePrivy();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [policy, setPolicy] = useState<SpendingPolicy>({
		dailyLimit: null,
		approvalThreshold: null,
		fundingPriority: [],
	});

	useEffect(() => {
		async function fetchPolicies() {
			try {
				setLoading(true);
				setError(null);
				const token = await getAccessToken();

				const response = await api.get<SpendingPolicy>("/accounts/me/policies", { token });
				setPolicy(response.data);
			} catch (err) {
				console.error("Failed to fetch policies:", err);
				setError(err instanceof Error ? err.message : "Failed to load policies");
			} finally {
				setLoading(false);
			}
		}

		fetchPolicies();
	}, [getAccessToken]);

	async function handleSave() {
		try {
			setSaving(true);
			setError(null);
			const token = await getAccessToken();

			await api.put("/accounts/me/policies", { token, body: policy });
			// Optionally show success message or toast
		} catch (err) {
			console.error("Failed to save policies:", err);
			setError(err instanceof Error ? err.message : "Failed to save policies");
		} finally {
			setSaving(false);
		}
	}

	const handleDailyLimitChange = (value: string) => {
		setPolicy({
			...policy,
			dailyLimit: value === "" ? null : Number(value),
		});
	};

	const handleApprovalThresholdChange = (value: string) => {
		setPolicy({
			...policy,
			approvalThreshold: value === "" ? null : Number(value),
		});
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Spending Policies</h1>
				<p className="text-muted-foreground mt-1">
					Configure your spending limits and approval rules
				</p>
			</div>

			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
					<p className="text-sm text-red-700 dark:text-red-300">{error}</p>
				</div>
			)}

			{loading ? (
				<div className="space-y-6">
					<div className="rounded-md bg-muted/50 p-5 space-y-5">
						<div className="space-y-2">
							<div className="h-4 w-32 animate-pulse rounded bg-muted" />
							<div className="h-10 animate-pulse rounded bg-muted" />
						</div>
						<div className="space-y-2">
							<div className="h-4 w-48 animate-pulse rounded bg-muted" />
							<div className="h-10 animate-pulse rounded bg-muted" />
						</div>
						<div className="space-y-2">
							<div className="h-4 w-40 animate-pulse rounded bg-muted" />
							<div className="h-20 animate-pulse rounded bg-muted" />
						</div>
					</div>
					<div className="h-10 w-32 animate-pulse rounded bg-muted" />
				</div>
			) : (
				<div className="max-w-2xl space-y-6">
					<div className="rounded-md bg-muted/50 p-5 space-y-5">
						{/* Daily Spending Limit */}
						<div className="space-y-2">
							<label htmlFor="dailyLimit" className="block text-sm font-medium text-foreground">
								Daily Spending Limit (USD)
							</label>
							<input
								id="dailyLimit"
								type="number"
								min="0"
								step="0.01"
								placeholder="No limit"
								value={policy.dailyLimit ?? ""}
								onChange={(e) => handleDailyLimitChange(e.target.value)}
								className="rounded-sm border border-border bg-muted px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none w-full"
							/>
						</div>

						{/* Approval Threshold */}
						<div className="space-y-2">
							<label
								htmlFor="approvalThreshold"
								className="block text-sm font-medium text-foreground"
							>
								Approval Threshold (USD)
							</label>
							<input
								id="approvalThreshold"
								type="number"
								min="0"
								step="0.01"
								placeholder="No threshold"
								value={policy.approvalThreshold ?? ""}
								onChange={(e) => handleApprovalThresholdChange(e.target.value)}
								className="rounded-sm border border-border bg-muted px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none w-full"
							/>
							<p className="text-xs text-muted-foreground">
								Payments above this amount require manual approval
							</p>
						</div>

						{/* Funding Priority */}
						<div className="space-y-2">
							<div className="block text-sm font-medium text-foreground">Funding Priority</div>
							{policy.fundingPriority && policy.fundingPriority.length > 0 ? (
								<div className="space-y-2">
									{policy.fundingPriority.map((source, index) => (
										<div
											key={source}
											className="flex items-center rounded-sm border border-border bg-muted px-3 py-2"
										>
											<span className="text-sm font-mono text-muted-foreground">{index + 1}.</span>
											<span className="ml-3 text-sm text-foreground">{source}</span>
										</div>
									))}
								</div>
							) : (
								<div className="rounded-sm border border-dashed border-border bg-muted/30 px-3 py-2 text-center">
									<p className="text-sm text-muted-foreground">No funding priority configured</p>
								</div>
							)}
						</div>
					</div>

					{/* Save Button */}
					<button
						type="button"
						onClick={handleSave}
						disabled={saving}
						className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
					>
						{saving ? "Saving…" : "Save Policies"}
					</button>
				</div>
			)}
		</div>
	);
}
