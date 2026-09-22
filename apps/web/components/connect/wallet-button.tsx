"use client";

import { usePrivy } from "@privy-io/react-auth";
import { cn } from "@/lib/utils";

interface WalletButtonProps {
	className?: string;
}

export function WalletButton({ className }: WalletButtonProps) {
	const { ready, authenticated, login, logout, user } = usePrivy();

	if (!ready) {
		return (
			<button
				type="button"
				disabled
				className={cn(
					"inline-flex items-center rounded-md px-4 py-2 text-sm font-medium",
					"bg-muted text-muted-foreground opacity-50 cursor-not-allowed",
					className,
				)}
			>
				Loading…
			</button>
		);
	}

	if (authenticated) {
		const address = user?.wallet?.address ?? "";
		const truncated = address.length > 10 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;

		return (
			<button
				type="button"
				onClick={logout}
				className={cn(
					"inline-flex items-center rounded-md px-4 py-2 text-sm font-medium",
					"bg-muted text-muted-foreground hover:bg-muted/80 transition-colors",
					className,
				)}
			>
				{truncated}
			</button>
		);
	}

	return (
		<button
			type="button"
			onClick={login}
			className={cn(
				"inline-flex items-center rounded-md px-4 py-2 text-sm font-medium",
				"bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
				className,
			)}
		>
			Connect Wallet
		</button>
	);
}
