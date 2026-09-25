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
				aria-label="Loading wallet"
				aria-busy="true"
				className={cn(
					"inline-flex items-center rounded-md px-4 py-2 text-sm font-medium",
					"bg-muted text-muted-foreground opacity-50 cursor-not-allowed",
					"transition-transform duration-150 ease-out",
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
				aria-label={`Disconnect wallet ${truncated}`}
				title={address || truncated}
				className={cn(
					"inline-flex items-center rounded-md px-4 py-2 text-sm font-medium",
					"bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-150 ease-out",
					"active:scale-[0.98]",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
			aria-label="Sign in"
			className={cn(
				"inline-flex items-center rounded-md px-4 py-2 text-sm font-medium",
				"bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-150 ease-out",
				"active:scale-[0.98]",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
				className,
			)}
		>
			Sign in
		</button>
	);
}
