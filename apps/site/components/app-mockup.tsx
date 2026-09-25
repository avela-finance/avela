"use client";

import {
	Bell,
	House,
	ListBullets,
	MagnifyingGlass,
	PaperPlaneTilt,
	TrendUp,
	Vault,
	Wallet,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const positions = [
	{ symbol: "wSPYx", name: "S&P 500", value: "$6,241.18", width: "64%" },
	{ symbol: "wQQQx", name: "Nasdaq 100", value: "$3,512.44", width: "42%" },
	{ symbol: "wNVDAx", name: "NVIDIA", value: "$2,731.09", width: "31%" },
];

const actions = [
	{ icon: Wallet, label: "Add" },
	{ icon: PaperPlaneTilt, label: "Send" },
	{ icon: ListBullets, label: "Details" },
];

/**
 * AppMockup — shared iPhone-style app view used across the marketing site
 * (hero, product moment). Mirrors the real app home: spending power,
 * locked positions, supported assets, balances, tab bar. Decorative only.
 */
export function AppMockup({ className }: { className?: string }) {
	return (
		<div aria-hidden="true" className={cn("relative mx-auto w-full max-w-[340px]", className)}>
			<div className="relative rounded-[3rem] border border-border bg-card p-2.5 shadow-2xl">
				<div className="flex flex-col gap-4 overflow-hidden rounded-[2.4rem] bg-background px-5 pt-4 pb-6">
					<div className="flex items-center justify-between text-xs font-semibold tabular-nums">
						<span>9:41</span>
						<span className="h-5 w-20 rounded-full bg-foreground" />
						<span className="flex gap-1 opacity-60">
							<span className="h-2 w-2 rounded-full bg-foreground" />
							<span className="h-2 w-2 rounded-full bg-foreground" />
							<span className="h-2 w-2 rounded-full bg-foreground" />
						</span>
					</div>

					<div className="flex items-center gap-2">
						<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-feature-peach text-sm font-bold">
							A
						</span>
						<span className="flex flex-1 items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
							<MagnifyingGlass size={14} weight="bold" /> Search
						</span>
						<span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
							<Bell size={16} weight="duotone" />
							<span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
								2
							</span>
						</span>
					</div>

					<div className="flex flex-col items-center gap-1 text-center">
						<span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
							Spending power
						</span>
						<span className="font-display text-4xl font-bold leading-none tracking-tight tabular-nums">
							$12,473<span className="opacity-40">.82</span>
						</span>
					</div>

					<div className="flex items-center justify-between gap-2 rounded-2xl bg-foreground px-4 py-2.5 text-xs font-medium text-background">
						<span className="flex items-center gap-1.5">
							<Vault size={14} weight="duotone" /> 2 positions locked
						</span>
						<span>›</span>
					</div>

					<div className="grid grid-cols-3 gap-2">
						{actions.map((a) => (
							<span
								key={a.label}
								className="flex flex-col items-center gap-1.5 rounded-2xl bg-muted py-3 text-xs font-medium"
							>
								<a.icon size={18} weight="duotone" /> {a.label}
							</span>
						))}
					</div>

					<div className="flex flex-col gap-3.5 rounded-2xl bg-muted px-4 py-3.5">
						<span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
							Portfolio
						</span>
						{positions.map((row) => (
							<div key={row.symbol} className="flex flex-col gap-1.5">
								<div className="flex items-baseline justify-between gap-2">
									<span className="font-mono text-xs font-medium">
										{row.symbol} <span className="opacity-50">· {row.name}</span>
									</span>
									<span className="text-xs font-semibold tabular-nums">{row.value}</span>
								</div>
								<div className="h-1.5 overflow-hidden rounded-full bg-background">
									<div
										className="h-full rounded-full bg-feature-lime"
										style={{ width: row.width }}
									/>
								</div>
							</div>
						))}
					</div>

					<div className="flex flex-col rounded-2xl bg-muted px-4 py-1">
						<div className="flex items-center justify-between py-2 text-xs">
							<span className="flex items-center gap-2 font-medium">
								<Wallet size={16} weight="duotone" /> Reserve balance
							</span>
							<span className="font-semibold tabular-nums">$8,124.05</span>
						</div>
						<div className="flex items-center justify-between border-t border-border py-2 text-xs">
							<span className="flex items-center gap-2 font-medium">
								<TrendUp size={16} weight="duotone" /> Vault value
							</span>
							<span className="font-semibold tabular-nums">$24,947.64</span>
						</div>
					</div>

					<div className="flex items-center justify-around rounded-full bg-muted px-4 py-2.5 text-[10px] font-medium text-muted-foreground">
						<span className="flex flex-col items-center gap-0.5 text-foreground">
							<House size={18} weight="fill" /> Home
						</span>
						<span className="flex flex-col items-center gap-0.5">
							<TrendUp size={18} weight="duotone" /> Earn
						</span>
						<span className="flex flex-col items-center gap-0.5">
							<PaperPlaneTilt size={18} weight="duotone" /> Activity
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
