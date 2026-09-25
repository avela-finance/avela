"use client";

import { ArrowsClockwise, ChatCircle, Eyes, Receipt, Robot, Vault } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { APPLE_EASE } from "@/lib/motion";

const features = [
	{
		icon: Vault,
		title: "Spending power from your portfolio",
		description:
			"Your tokenized stocks generate spending power. No selling, no liquidation — just spend.",
	},
	{
		icon: ArrowsClockwise,
		title: "Reserve settlement with onchain proof",
		description:
			"Payments settle from the pre-funded stablecoin reserve via AvelaPaymentRouter. Positions stay locked in AvelaVault as collateral.",
	},
	{
		icon: Robot,
		title: "AI agent spending",
		description:
			"Authorize agents to spend within scoped permissions. Per-transaction limits, asset restrictions, daily caps.",
	},
	{
		icon: ChatCircle,
		title: "Approve payments via WhatsApp",
		description:
			"Check balances, approve or reject payments, and get receipts — all from WhatsApp.",
	},
	{
		icon: Eyes,
		title: "Watchers that act",
		description:
			"Set alerts for when spending power drops below a threshold. Your account monitors itself.",
	},
	{
		icon: Receipt,
		title: "Onchain receipts",
		description:
			"Every payment settles onchain. Full settlement proof with transaction hash and block number.",
	},
];

export function Features() {
	return (
		<section
			id="features"
			className="dark bg-background px-4 py-24 border-t border-border scroll-mt-28"
		>
			<div className="max-w-5xl mx-auto">
				<div className="mb-12 text-center">
					<h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-balance text-foreground sm:text-4xl md:text-[64px] md:leading-[0.95]">
						Built for intelligent spending
					</h2>
					<p className="mt-3 text-pretty text-muted-foreground">
						The account layer for people who live in their portfolio.
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{features.map((feature, i) => (
						<motion.div
							key={feature.title}
							initial={{ opacity: 0, y: 16 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-40px" }}
							transition={{ duration: 0.45, delay: i * 0.08, ease: APPLE_EASE }}
							className="rounded-xl border border-border bg-muted/50 p-6 flex flex-col gap-2"
						>
							<feature.icon
								size={32}
								weight="duotone"
								className="text-primary"
								aria-hidden="true"
							/>
							<h3 className="font-display text-sm font-bold leading-tight text-foreground">
								{feature.title}
							</h3>
							<p className="text-sm leading-relaxed text-pretty text-muted-foreground">
								{feature.description}
							</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
