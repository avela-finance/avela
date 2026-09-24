"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { APPLE_EASE } from "@/lib/motion";

export function Hero() {
	return (
		<section className="dark bg-background flex min-h-[90vh] flex-col items-center justify-center px-4 py-24 text-center">
			<div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: APPLE_EASE }}
					className="flex flex-col items-center gap-4"
				>
					<span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium tracking-wider text-primary uppercase">
						Built on X Layer
					</span>
					<h1 className="max-w-[680px] text-5xl font-bold tracking-tight text-balance text-foreground md:text-6xl">
						Make your tokenized stocks
						<br className="hidden sm:block" /> your everyday spend.
					</h1>
				</motion.div>

				<motion.p
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.15, ease: APPLE_EASE }}
					className="max-w-2xl text-lg text-pretty text-muted-foreground"
				>
					One programmable account to hold tokenized stocks, unlock spending power, and pay across
					commerce.
				</motion.p>

				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.5, delay: 0.25 }}
					className="text-sm font-medium text-primary"
				>
					Positions stay locked. The reserve settles every payment.
				</motion.p>

				<motion.a
					href="https://app.useavela.xyz"
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.4, ease: APPLE_EASE }}
					className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors duration-300 hover:bg-primary/90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
				>
					Launch App
					<ArrowRight size={16} weight="bold" aria-hidden="true" />
				</motion.a>
			</div>
		</section>
	);
}
