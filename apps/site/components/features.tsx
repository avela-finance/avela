"use client";

import { motion } from "motion/react";

const features = [
	{
		title: "Spending power from your portfolio",
		description:
			"Your tokenized stocks generate spending power. No selling, no liquidation — just spend.",
	},
	{
		title: "Every payment builds the market",
		description:
			"Each checkout triggers a real Uniswap V3 swap — your payment is a market order on X Layer.",
	},
	{
		title: "AI agent spending",
		description:
			"Authorize agents to spend within scoped permissions. Per-transaction limits, asset restrictions, daily caps.",
	},
	{
		title: "Approve payments via WhatsApp",
		description:
			"Check balances, approve or reject payments, and get receipts — all from WhatsApp.",
	},
	{
		title: "Watchers that act",
		description:
			"Set alerts for when spending power drops below a threshold. Your account monitors itself.",
	},
	{
		title: "Onchain receipts",
		description:
			"Every payment settles onchain. Full settlement proof with transaction hash and block number.",
	},
];

export function Features() {
	return (
		<section className="dark bg-background px-4 py-24 border-t border-border">
			<div className="max-w-5xl mx-auto">
				<div className="mb-12 text-center">
					<h2 className="text-3xl font-semibold tracking-tight text-foreground">
						Built for intelligent spending
					</h2>
					<p className="mt-3 text-muted-foreground">
						Every feature designed for the portfolio-native consumer.
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{features.map((feature, i) => (
						<motion.div
							key={feature.title}
							initial={{ opacity: 0, y: 16 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-40px" }}
							transition={{ duration: 0.45, delay: i * 0.08, ease: "easeOut" }}
							className="rounded-xl border border-border bg-muted/50 p-5 flex flex-col gap-2"
						>
							<h3 className="text-sm font-medium text-foreground">{feature.title}</h3>
							<p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
