"use client";

import { motion } from "motion/react";
import { CtaButton } from "@/components/ui/cta-button";
import { APPLE_EASE } from "@/lib/motion";

export function CTA() {
	return (
		<section className="bg-background px-4 py-24 md:py-32">
			<motion.div
				initial={{ opacity: 0, y: 24 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true, margin: "-60px" }}
				transition={{ duration: 0.8, ease: APPLE_EASE }}
				className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center"
			>
				<h2 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-balance md:text-[60px]">
					Spend from your portfolio.
					<br />
					Keep every share.
				</h2>
				<p className="max-w-xl font-mono text-sm leading-relaxed text-pretty text-muted-foreground">
					Hold tokenized stocks. Unlock spending power. Pay anywhere. No selling, ever.
				</p>
				<CtaButton variant="ink" href="https://app.useavela.xyz">
					Launch App
				</CtaButton>
			</motion.div>
		</section>
	);
}
