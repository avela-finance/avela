"use client";

import {
	ArrowRight,
	Buildings,
	Cardholder,
	HandCoins,
	LockKey,
	PaperPlaneTilt,
	Robot,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { APPLE_EASE } from "@/lib/motion";

const products = [
	{
		id: "spend",
		icon: HandCoins,
		name: "Spend",
		status: "Live",
		headline: "Checkout from your portfolio.",
		copy: "Pay at any checkout from spending power. The reserve settles in stablecoin while your stocks stay locked in the vault — no selling, no liquidation, no surprises.",
		link: "https://app.useavela.xyz/payments",
		linkLabel: "Open Spend",
	},
	{
		id: "pay",
		icon: PaperPlaneTilt,
		name: "Pay",
		status: "Live",
		headline: "Send money to anyone.",
		copy: "Send stablecoin to a name, not an address. Claim a username, share your link, and get paid in seconds — settled onchain, receipted automatically.",
		link: "https://app.useavela.xyz/settings",
		linkLabel: "Claim your link",
	},
	{
		id: "borrow",
		icon: LockKey,
		name: "Borrow",
		status: "Live",
		headline: "Unlock cash against your holdings.",
		copy: "Your portfolio sets the limit. Pricing comes from the Uniswap V3 TWAP with a conservative haircut, so borrowing power moves with the market — and your positions never move at all.",
		link: "https://app.useavela.xyz/portfolio",
		linkLabel: "View portfolio",
	},
	{
		id: "agents",
		icon: Robot,
		name: "Agents",
		status: "Live",
		headline: "Give your agent an allowance.",
		copy: "AI agents spend within scoped permissions you define — per-transaction limits, asset restrictions, daily caps, always revocable. Built for humans and the agents working for them.",
		link: "https://app.useavela.xyz/agents",
		linkLabel: "Set up an agent",
	},
	{
		id: "card",
		icon: Cardholder,
		name: "Avela Card",
		status: "Coming soon",
		headline: "One card for the portfolio.",
		copy: "Spend anywhere cards are accepted, drawn from the same spending power. Join the list and get notified the moment cards ship.",
		link: "https://app.useavela.xyz",
		linkLabel: "Get notified",
	},
	{
		id: "business",
		icon: Buildings,
		name: "Avela Business",
		status: "Coming soon",
		headline: "Treasury that spends itself.",
		copy: "Team wallets with roles, approvals, and spending policies on top of tokenized-stock collateral. Avela Business is coming soon.",
		link: "https://app.useavela.xyz",
		linkLabel: "Get notified",
	},
];

export function Products() {
	return (
		<section id="products" className="scroll-mt-28 bg-background px-4 py-24 md:py-32">
			<div className="mx-auto max-w-6xl">
				<div className="mb-14 md:mb-20">
					<p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
						Products
					</p>
					<h2 className="mt-4 max-w-[680px] font-display text-5xl font-bold leading-[0.9] tracking-tight text-balance md:text-[60px] md:leading-[0.95]">
						Everything your portfolio can do.
					</h2>
					<p className="mt-4 max-w-xl text-pretty text-muted-foreground">
						One account for humans and AI agents — every surface scoped, receipted, and revocable.
					</p>
				</div>

				<div className="flex flex-col">
					{products.map((product, i) => (
						<motion.article
							key={product.id}
							id={product.id}
							initial={{ opacity: 0, y: 24 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-60px" }}
							transition={{ duration: 0.7, delay: i * 0.06, ease: APPLE_EASE }}
							className="grid scroll-mt-28 gap-4 border-t border-border py-10 last:border-b md:grid-cols-[auto_1fr_auto] md:items-center md:gap-8"
						>
							<span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
								<product.icon size={24} weight="duotone" aria-hidden="true" />
							</span>
							<div className="min-w-0">
								<p className="flex flex-wrap items-center gap-2">
									<span className="font-display text-2xl font-bold tracking-tight md:text-3xl">
										{product.name}
									</span>
									<span
										className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-widest ${
											product.status === "Live"
												? "bg-feature-lime text-foreground"
												: "border border-border text-muted-foreground"
										}`}
									>
										{product.status}
									</span>
								</p>
								<p className="mt-1 font-medium">{product.headline}</p>
								<p className="mt-2 max-w-2xl text-sm leading-relaxed text-pretty text-muted-foreground">
									{product.copy}
								</p>
							</div>
							<a
								href={product.link}
								className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition-colors duration-300 hover:border-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
							>
								{product.linkLabel}
								<ArrowRight size={16} weight="bold" aria-hidden="true" />
							</a>
						</motion.article>
					))}
				</div>
			</div>
		</section>
	);
}
