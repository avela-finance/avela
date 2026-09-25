"use client";

import { ArrowRight } from "@phosphor-icons/react";

export function CTA() {
	return (
		<section className="bg-background px-4 py-24 border-t border-border">
			<div className="max-w-5xl mx-auto text-center flex flex-col items-center gap-6">
				<h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-balance text-foreground sm:text-4xl">
					Start spending from your portfolio.
				</h2>
				<p className="max-w-lg text-pretty text-muted-foreground">
					Connect your wallet, deposit wrapped xStocks, and unlock spending power in minutes.
				</p>
				<a
					href="https://app.useavela.xyz"
					className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors duration-300 hover:bg-primary/90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
				>
					Launch App
					<ArrowRight size={16} weight="bold" aria-hidden="true" />
				</a>
			</div>
		</section>
	);
}
