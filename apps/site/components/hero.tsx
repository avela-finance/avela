"use client";

import { motion } from "motion/react";

export function Hero() {
	return (
		<section className="flex min-h-[90vh] flex-col items-center justify-center px-4 py-24 text-center">
			<div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
				<motion.div
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					className="flex flex-col items-center gap-4"
				>
					<span className="inline-block rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs text-brand">
						Built on X Layer
					</span>
					<h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
						Make your tokenized stocks
						<br className="hidden sm:block" /> your everyday spend.
					</h1>
				</motion.div>

				<motion.p
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
					className="max-w-2xl text-lg text-muted-foreground"
				>
					One programmable account to hold tokenized stocks, unlock spending power, and pay across
					commerce.
				</motion.p>

				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.5, delay: 0.25 }}
					className="text-sm font-medium text-brand"
				>
					Every payment is a market order on X Layer.
				</motion.p>

				<motion.a
					href="https://app.useavela.xyz"
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
					className="mt-2 inline-flex items-center gap-1 rounded-lg bg-brand px-6 py-3 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
				>
					Launch App →
				</motion.a>
			</div>
		</section>
	);
}
