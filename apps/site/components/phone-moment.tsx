"use client";

import { motion } from "motion/react";
import { AppMockup } from "@/components/app-mockup";
import { APPLE_EASE } from "@/lib/motion";

export function PhoneMoment() {
	return (
		<section className="scroll-mt-28 bg-background px-4 py-24 md:py-32">
			<div className="mx-auto flex max-w-5xl flex-col items-center gap-12">
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-50px" }}
					transition={{ duration: 0.8, ease: APPLE_EASE }}
					className="flex flex-col items-center gap-4 text-center"
				>
					<p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
						The app
					</p>
					<h2 className="max-w-[680px] font-display text-5xl font-bold leading-[0.9] tracking-tight text-balance text-foreground md:text-[60px] md:leading-[0.95]">
						One account. Every way to use it.
					</h2>
					<p className="max-w-lg text-pretty text-muted-foreground">
						Spending power, positions, and receipts in one place.
					</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 32 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-50px" }}
					transition={{ duration: 0.8, ease: APPLE_EASE }}
					className="relative w-full"
				>
					<div
						aria-hidden="true"
						className="absolute inset-x-24 top-24 bottom-0 rounded-full bg-feature-lime opacity-25 blur-3xl"
					/>
					<AppMockup className="relative" />
				</motion.div>
			</div>
		</section>
	);
}
