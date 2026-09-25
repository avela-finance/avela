"use client";

import { motion } from "motion/react";
import { CtaButton } from "@/components/ui/cta-button";
import { APPLE_EASE } from "@/lib/motion";

function HeroPhone() {
	return (
		<div aria-hidden="true" className="relative mx-auto w-full max-w-[300px]">
			<div className="absolute inset-x-8 top-16 bottom-8 rounded-full bg-feature-lime opacity-25 blur-3xl" />
			<div className="relative rounded-[2.8rem] border border-border bg-card p-2 shadow-2xl">
				<div className="flex flex-col gap-3.5 overflow-hidden rounded-[2.2rem] bg-background px-5 pt-4 pb-5">
					<div className="flex items-center justify-between text-[11px] font-semibold tabular-nums">
						<span>9:41</span>
						<span className="h-4 w-16 rounded-full bg-foreground" />
						<span className="flex gap-1 opacity-60">
							<span className="h-1.5 w-1.5 rounded-full bg-foreground" />
							<span className="h-1.5 w-1.5 rounded-full bg-foreground" />
							<span className="h-1.5 w-1.5 rounded-full bg-foreground" />
						</span>
					</div>
					<div className="flex flex-col items-center gap-1 text-center">
						<span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
							Spendable
						</span>
						<span className="font-display text-[32px] font-bold leading-none tracking-tight tabular-nums">
							$9,076.56
						</span>
						<span className="rounded-full bg-muted px-2.5 py-1 font-mono text-[10px] tabular-nums text-muted-foreground">
							$19,176.56 portfolio
						</span>
					</div>
					<div className="rounded-2xl bg-foreground px-4 py-3.5 text-background">
						<span className="font-mono text-[10px] uppercase tracking-widest opacity-60">
							Avela Card
						</span>
						<span className="mt-1.5 block font-mono text-sm tabular-nums">•••• 2312</span>
					</div>
					<div className="flex flex-col rounded-2xl bg-muted px-4 py-1">
						<div className="flex items-center justify-between py-2 text-xs">
							<span className="font-medium">Uber</span>
							<span className="font-semibold tabular-nums">-$38.19</span>
						</div>
						<div className="flex items-center justify-between border-t border-border py-2 text-xs">
							<span className="font-medium">Whole Foods</span>
							<span className="font-semibold tabular-nums">-$86.14</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export function Hero() {
	return (
		<section className="dark bg-background flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 pt-32 pb-20 text-center">
			<div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6">
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: APPLE_EASE }}
					className="flex flex-col items-center gap-5"
				>
					<span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 font-mono text-[11px] font-medium uppercase tracking-widest text-primary">
						<span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />
						Live on X Layer
					</span>
					<h1 className="max-w-[720px] font-display text-5xl font-bold leading-[0.9] tracking-tight text-balance text-foreground md:text-[64px] md:leading-[0.95]">
						Make tokenized stocks
						<br className="hidden sm:block" /> your everyday spend.
					</h1>
				</motion.div>

				<motion.p
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.15, ease: APPLE_EASE }}
					className="max-w-xl text-sm text-pretty text-muted-foreground"
				>
					One account for your tokenized stocks. Unlock spending power and pay anywhere — your
					positions never move.
				</motion.p>

				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3, ease: APPLE_EASE }}
					className="mt-2 flex flex-col items-center gap-3 sm:flex-row"
				>
					<CtaButton variant="lime" href="https://app.useavela.xyz">
						Launch App
					</CtaButton>
					<CtaButton variant="cream" href="#how-it-works">
						See how it works
					</CtaButton>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 40 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.9, delay: 0.45, ease: APPLE_EASE }}
					className="mt-10 w-full"
				>
					<HeroPhone />
				</motion.div>
			</div>
		</section>
	);
}
