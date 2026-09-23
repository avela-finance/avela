"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatAddress, formatCurrency, formatDate } from "@/lib/format";

type AgentDetail = {
	id: string;
	name: string;
	status: string;
	walletAddress: string;
	permissions: {
		maxPerTransaction: number;
		maxPerDay: number;
		allowedAssets: string[];
		allowedRecipients: string[];
		requiresApproval: boolean;
		approvalThreshold: number;
	};
	expiresAt: string | null;
};

type SpendingLogEntry = {
	id: string;
	amount: number;
	asset: string;
	recipient: string;
	status: string;
	decidedAt: string;
};

export default function AgentDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { getAccessToken } = usePrivy();
	const [loading, setLoading] = useState(true);
	const [agent, setAgent] = useState<AgentDetail | null>(null);
	const [spendingLog, setSpendingLog] = useState<SpendingLogEntry[]>([]);
	const [notFound, setNotFound] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchData() {
			try {
				setLoading(true);
				setError(null);
				const token = await getAccessToken();
				const [agentRes, logRes] = await Promise.all([
					api.get<AgentDetail>(`/agents/${id}/permissions`, { token }),
					api.get<SpendingLogEntry[]>(`/agents/${id}/spending-log`, { token }),
				]);
				setAgent(agentRes.data);
				setSpendingLog(logRes.data ?? []);
			} catch (err) {
				const message = err instanceof Error ? err.message : "Failed to load agent";
				if (message.toLowerCase().includes("not found")) {
					setNotFound(true);
				} else {
					setError(message);
				}
				console.error("Failed to fetch agent detail:", err);
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, [id, getAccessToken]);

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="space-y-2">
					<div className="h-8 w-48 animate-pulse rounded bg-muted" />
					<div className="h-4 w-32 animate-pulse rounded bg-muted" />
				</div>
				<div className="rounded-lg border border-border p-6 space-y-4">
					<div className="h-5 w-36 animate-pulse rounded bg-muted" />
					<div className="grid grid-cols-2 gap-4">
						{Array.from({ length: 4 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton keys are stable
							<div key={`sk-${i}`} className="space-y-1">
								<div className="h-3 w-20 animate-pulse rounded bg-muted" />
								<div className="h-4 w-28 animate-pulse rounded bg-muted" />
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (notFound) {
		return (
			<div className="py-16 text-center">
				<p className="text-muted-foreground text-sm">Agent not found.</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
				<p className="text-sm text-destructive">{error}</p>
			</div>
		);
	}

	if (!agent) return null;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">{agent.name}</h1>
				<p className="text-muted-foreground mt-1 text-sm">{formatAddress(agent.walletAddress)}</p>
			</div>

			{/* Permission Scope */}
			<section className="rounded-lg border border-border p-6 space-y-4">
				<h2 className="text-base font-semibold">Permission Scope</h2>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<p className="text-muted-foreground text-xs">Max Per Transaction</p>
						<p className="text-sm font-medium">
							{formatCurrency(agent.permissions.maxPerTransaction)}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground text-xs">Max Per Day</p>
						<p className="text-sm font-medium">{formatCurrency(agent.permissions.maxPerDay)}</p>
					</div>
					<div>
						<p className="text-muted-foreground text-xs">Approval Required</p>
						<p className="text-sm font-medium">
							{agent.permissions.requiresApproval
								? `Yes — above ${formatCurrency(agent.permissions.approvalThreshold)}`
								: "No"}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground text-xs">Expires</p>
						<p className="text-sm font-medium">
							{agent.expiresAt ? formatDate(agent.expiresAt) : "Never"}
						</p>
					</div>
				</div>

				{agent.permissions.allowedAssets.length > 0 && (
					<div>
						<p className="text-muted-foreground text-xs mb-1">Allowed Assets</p>
						<div className="flex flex-wrap gap-1">
							{agent.permissions.allowedAssets.map((asset) => (
								<span key={asset} className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
									{asset}
								</span>
							))}
						</div>
					</div>
				)}

				{agent.permissions.allowedRecipients.length > 0 && (
					<div>
						<p className="text-muted-foreground text-xs mb-1">Allowed Recipients</p>
						<div className="flex flex-col gap-1">
							{agent.permissions.allowedRecipients.map((addr) => (
								<span key={addr} className="text-xs font-mono">
									{formatAddress(addr)}
								</span>
							))}
						</div>
					</div>
				)}
			</section>

			{/* Spending Log */}
			<section className="space-y-3">
				<h2 className="text-base font-semibold">Spending Log</h2>

				{spendingLog.length === 0 ? (
					<p className="text-muted-foreground py-4 text-center text-sm">
						No spending activity yet.
					</p>
				) : (
					<div className="rounded-lg border border-border divide-y divide-border">
						{spendingLog.map((entry) => (
							<div key={entry.id} className="flex items-center justify-between px-4 py-3">
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium">
										{entry.asset} → {formatAddress(entry.recipient)}
									</p>
									<p className="text-muted-foreground text-xs">{formatDate(entry.decidedAt)}</p>
								</div>
								<div className="ml-4 flex shrink-0 flex-col items-end gap-1">
									<span className="text-sm font-semibold">{formatCurrency(entry.amount)}</span>
									<span className="text-muted-foreground text-xs">{entry.status}</span>
								</div>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
