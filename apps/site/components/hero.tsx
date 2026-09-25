"use client";

import { motion } from "motion/react";
import { AppMockup } from "@/components/app-mockup";
import { CtaButton } from "@/components/ui/cta-button";
import { APPLE_EASE } from "@/lib/motion";

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
					<span className="inline-flex items-center rounded-full bg-primary px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-widest text-primary-foreground">
						Tokenized stock spending account on X Layer
					</span>
					<h1 className="max-w-[720px] font-display text-5xl font-bold leading-[0.9] tracking-tight text-balance text-foreground md:text-[60px] md:leading-[0.95]">
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
					className="relative mt-10 w-full"
				>
					<div
						aria-hidden="true"
						className="absolute -inset-x-16 top-24 bottom-0 rounded-full bg-feature-lime opacity-40 blur-3xl"
					/>
					<AppMockup className="relative" />
				</motion.div>
			</div>
		</section>
	);
}
