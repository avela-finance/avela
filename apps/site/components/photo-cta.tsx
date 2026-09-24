"use client";

import { ArrowRight } from "@phosphor-icons/react";

// Placeholder photography: https://picsum.photos/seed/avela-cta/1920/1080
// Swap with commissioned lifestyle photography, see DESIGN.md swap list.
export function PhotoCTA() {
	return (
		<section className="dark relative overflow-hidden border-t border-border bg-background">
			{/* biome-ignore lint/performance/noImgElement: static export cannot optimize remote images; placeholder until commissioned photography lands. */}
			<img
				src="https://picsum.photos/seed/avela-cta/1920/1080"
				alt=""
				aria-hidden="true"
				loading="lazy"
				className="absolute inset-0 h-full w-full object-cover"
			/>
			<div aria-hidden="true" className="absolute inset-0 bg-background/70" />
			<div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-32 text-center">
				<h2 className="max-w-[680px] text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
					Start spending from your portfolio.
				</h2>
				<p className="max-w-lg text-pretty text-muted-foreground">
					Connect your wallet, deposit wrapped xStocks, and unlock spending power in minutes.
				</p>
				<a
					href="https://app.useavela.xyz"
					className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors duration-300 hover:bg-primary/90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
				>
					Launch App
					<ArrowRight size={16} weight="bold" aria-hidden="true" />
				</a>
			</div>
		</section>
	);
}
