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
		<section id="features" className="dark scroll-mt-28 bg-background px-4 py-24 md:py-32">
			<div className="mx-auto max-w-6xl">
				<div className="mb-14 text-center md:mb-20">
					<p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
						Platform
					</p>
					<h2 className="mx-auto mt-4 max-w-[680px] font-display text-5xl font-bold leading-[0.9] tracking-tight text-balance text-foreground md:text-[60px] md:leading-[0.95]">
						Built for intelligent spending
					</h2>
					<p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
						The account layer for people who live in their portfolio.
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{features.map((feature, i) => (
						<motion.div
							key={feature.title}
							initial={{ opacity: 0, y: 24 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-40px" }}
							transition={{ duration: 0.6, delay: i * 0.06, ease: APPLE_EASE }}
							className="group flex flex-col gap-4 rounded-[1.75rem] border border-border bg-card p-8 transition-[transform,border-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-primary/50"
						>
							<span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
								<feature.icon
									size={24}
									weight="duotone"
									className="text-primary"
									aria-hidden="true"
								/>
							</span>
							<h3 className="font-display text-xl font-bold leading-tight tracking-tight text-balance text-foreground">
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
