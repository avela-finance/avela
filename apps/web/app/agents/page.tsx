"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { AgentCard } from "@/components/agents/agent-card";
import { api } from "@/lib/api";

type Agent = {
	id: string;
	name: string;
	status: "active" | "suspended" | "expired" | "revoked";
	permissions: { maxPerTransaction: number; maxPerDay: number };
	dailySpent: number;
};

type AgentsResponse = {
	agents: Agent[];
};

export default function AgentsPage() {
	const { getAccessToken } = usePrivy();
	const [loading, setLoading] = useState(true);
	const [agents, setAgents] = useState<Agent[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchAgents() {
			try {
				setLoading(true);
				setError(null);
				const token = await getAccessToken();
				const response = await api.get<AgentsResponse>("/agents", { token });
				setAgents(response.data.agents ?? []);
			} catch (err) {
				console.error("Failed to fetch agents:", err);
				setError(err instanceof Error ? err.message : "Failed to load agents");
			} finally {
				setLoading(false);
			}
		}

		fetchAgents();
	}, [getAccessToken]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Agents</h1>
				<p className="text-muted-foreground mt-1">Manage agent spending permissions</p>
			</div>

			{error && (
				<div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
					<p className="text-sm text-destructive">{error}</p>
				</div>
			)}

			{loading ? (
				<div className="space-y-3">
					{Array.from({ length: 2 }).map((_, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton keys are stable
							key={`skeleton-${i}`}
							className="rounded-lg border border-border p-4 space-y-4"
						>
							<div className="flex items-center justify-between">
								<div className="h-4 w-32 animate-pulse rounded bg-muted" />
								<div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
							</div>
							<div className="grid grid-cols-3 gap-2">
								{Array.from({ length: 3 }).map((_, j) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: skeleton keys are stable
									<div key={`col-${j}`} className="space-y-1 text-center">
										<div className="mx-auto h-3 w-12 animate-pulse rounded bg-muted" />
										<div className="mx-auto h-4 w-16 animate-pulse rounded bg-muted" />
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			) : agents.length === 0 ? (
				<p className="text-muted-foreground py-8 text-center text-sm">No agents registered yet.</p>
			) : (
				<div className="space-y-3">
					{agents.map((agent) => (
						<AgentCard
							key={agent.id}
							id={agent.id}
							name={agent.name}
							status={agent.status}
							maxPerTransaction={agent.permissions.maxPerTransaction}
							maxPerDay={agent.permissions.maxPerDay}
							dailySpent={agent.dailySpent}
						/>
					))}
				</div>
			)}
		</div>
	);
}
