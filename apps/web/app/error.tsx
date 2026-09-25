"use client";

import { useEffect } from "react";
import { LogoMark } from "@/components/logo-mark";

/**
 * Route-level error boundary. If any screen throws during render or data
 * loading, show a branded retry instead of a dead page.
 */
export default function RouteError({
	error: routeError,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Route error:", routeError);
	}, [routeError]);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
			<div className="flex w-full max-w-sm flex-col items-center text-center">
				<span className="flex items-center gap-2">
					<LogoMark className="size-7" />
					<span className="text-xl font-semibold tracking-tight text-foreground">Avela</span>
				</span>
				<h1 className="mt-8 text-2xl font-bold tracking-tight text-foreground">
					Something didn&apos;t load
				</h1>
				<p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
					The app hit a snag. Your funds and positions are safe — try again.
				</p>
				<button
					type="button"
					onClick={reset}
					className="mt-8 inline-flex w-full cursor-pointer items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all duration-150 ease-out hover:bg-primary/90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
				>
					Try again
				</button>
			</div>
		</div>
	);
}
