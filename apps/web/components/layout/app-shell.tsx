"use client";

import { usePrivy } from "@privy-io/react-auth";
import { WalletButton } from "@/components/connect/wallet-button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";

interface AppShellProps {
	children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
	const { ready, authenticated } = usePrivy();

	if (!ready) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<span className="text-muted-foreground text-sm">Loading…</span>
			</div>
		);
	}

	if (!authenticated) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
				<div className="text-center space-y-2">
					<h1 className="text-3xl font-semibold tracking-tight">Avela</h1>
					<p className="text-muted-foreground text-sm max-w-xs">
						Programmable spending account for tokenized stocks
					</p>
				</div>
				<WalletButton />
			</div>
		);
	}

	return (
		<div className="flex min-h-screen">
			<Sidebar />

			<div className="flex flex-1 flex-col min-w-0">
				{/* Mobile header */}
				<header className="flex h-14 items-center justify-between px-4 border-b border-border md:hidden">
					<span className="text-lg font-semibold tracking-tight">Avela</span>
					<WalletButton />
				</header>

				{/* Desktop header with wallet */}
				<header className="hidden md:flex h-14 items-center justify-end px-6 border-b border-border">
					<WalletButton />
				</header>

				<main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
			</div>

			<MobileNav />
		</div>
	);
}
