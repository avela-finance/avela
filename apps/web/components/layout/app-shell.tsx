"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { SignIn } from "@/components/connect/sign-in";
import { WalletButton } from "@/components/connect/wallet-button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { LogoMark } from "@/components/logo-mark";
import { cn } from "@/lib/utils";

interface AppShellProps {
	children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
	const { ready, authenticated } = usePrivy();
	const [scrolled, setScrolled] = useState(false);

	// Scroll-edge fade: minimal scroll listener with rAF throttle (cheap —
	// one passive listener, no IntersectionObserver sentinel needed since the
	// header is sticky and scrollY > 8 is the only signal).
	useEffect(() => {
		let ticking = false;
		const onScroll = () => {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				setScrolled(window.scrollY > 8);
				ticking = false;
			});
		};
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	if (!ready) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<span className="text-muted-foreground text-sm">Loading…</span>
			</div>
		);
	}

	if (!authenticated) {
		return <SignIn />;
	}

	return (
		<div className="flex min-h-screen">
			<Sidebar />

			<div className="flex flex-1 flex-col min-w-0">
				{/* Mobile header — translucent material, content scrolls under */}
				<header
					className={cn(
						"sticky top-0 z-40 flex h-14 items-center justify-between bg-background/70 px-4 backdrop-blur-xl transition-[border-color] duration-300 md:hidden",
						scrolled ? "border-b border-border" : "border-b border-transparent",
					)}
				>
					<span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
						<LogoMark />
						Avela
					</span>
					<WalletButton />
				</header>

				{/* Desktop header with wallet — translucent material, content scrolls under */}
				<header
					className={cn(
						"sticky top-0 z-40 hidden h-14 items-center justify-end bg-background/70 px-6 backdrop-blur-xl transition-[border-color] duration-300 md:flex",
						scrolled ? "border-b border-border" : "border-b border-transparent",
					)}
				>
					<WalletButton />
				</header>

				<main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
			</div>

			<MobileNav />
		</div>
	);
}
