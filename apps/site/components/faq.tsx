"use client";

import {
	Bell,
	House,
	ListBullets,
	MagnifyingGlass,
	PaperPlaneTilt,
	Plus,
	TrendUp,
	Vault,
	Wallet,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { APPLE_EASE } from "@/lib/motion";

const faqs = [
	{
		question: "What happens to my stocks when I pay?",
		answer:
			"They stay locked in the AvelaVault contract as collateral. Payments settle from a pre-funded stablecoin reserve through the AvelaPaymentRouter, so your positions are never touched at checkout. A PositionLocked event with no matching PositionReleased event means the collateral never moved.",
	},
	{
		question: "How is my spending power calculated?",
		answer:
			"Your portfolio is priced with the Uniswap V3 time-weighted average price, then a conservative haircut is applied as a safety cushion. The haircut starts at 50% for index assets. If holdings rise, spending power adjusts upward.",
	},
	{
		question: "Which assets can I deposit?",
		answer:
			"Five wrapped xStocks on X Layer: wSPYx (S&P 500), wQQQx (Nasdaq 100), wNVDAx (Nvidia), wGOOGLx (Alphabet), and wAAPLx (Apple). Each has a verified Uniswap V3 stablecoin pool with $400K or more in liquidity.",
	},
	{
		question: "Can an AI agent spend from my account?",
		answer:
			"Yes, within permissions you define. You set the maximum per transaction and per day, which assets it can use, and whether approval is always required. Agents never own the funds — scoped authority that expires and you can revoke anytime.",
	},
	{
		question: "How do approvals work over WhatsApp?",
		answer:
			"When a payment needs sign-off, you get a message showing the amount and the asset behind it. Tap approve or reject right in the conversation. Check balances and receive receipts without opening the app.",
	},
	{
		question: "What if my spending power is not enough?",
		answer:
			"The payment fails. Avela never silently converts or sells your stocks at checkout. You decide next: deposit more, add stablecoins, or manually sell a position yourself.",
	},
];

function PhoneMock() {
	return (
		<div aria-hidden="true" className="relative mx-auto w-full max-w-[340px]">
			<div className="absolute inset-x-8 top-16 bottom-8 rounded-full bg-feature-lime opacity-25 blur-3xl" />
			<div className="relative rounded-[3rem] border border-border bg-card p-2.5 shadow-xl">
				<div className="flex flex-col gap-4 overflow-hidden rounded-[2.4rem] bg-background px-5 pt-4 pb-6">
					<div className="flex items-center justify-between text-xs font-semibold tabular-nums">
						<span>9:41</span>
						<span className="h-5 w-20 rounded-full bg-foreground" />
						<span className="flex gap-1 opacity-60">
							<span className="h-2 w-2 rounded-full bg-foreground" />
							<span className="h-2 w-2 rounded-full bg-foreground" />
							<span className="h-2 w-2 rounded-full bg-foreground" />
						</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-feature-peach text-sm font-bold">
							A
						</span>
						<span className="flex flex-1 items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">
							<MagnifyingGlass size={14} weight="bold" /> Search
						</span>
						<span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
							<Bell size={16} weight="duotone" />
							<span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
								2
							</span>
						</span>
					</div>
					<div className="flex flex-col items-center gap-1 text-center">
						<span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
							Spending power
						</span>
						<span className="font-display text-4xl font-bold leading-none tracking-tight tabular-nums">
							$12,473<span className="opacity-40">.82</span>
						</span>
					</div>
					<div className="flex items-center justify-between gap-2 rounded-2xl bg-foreground px-4 py-2.5 text-xs font-medium text-background">
						<span className="flex items-center gap-1.5">
							<Vault size={14} weight="duotone" /> 2 positions locked
						</span>
						<span aria-hidden="true">›</span>
					</div>
					<div className="grid grid-cols-3 gap-2">
						{[
							{ icon: Wallet, label: "Add" },
							{ icon: PaperPlaneTilt, label: "Send" },
							{ icon: ListBullets, label: "Details" },
						].map((a) => (
							<span
								key={a.label}
								className="flex flex-col items-center gap-1.5 rounded-2xl bg-muted py-3 text-xs font-medium"
							>
								<a.icon size={18} weight="duotone" /> {a.label}
							</span>
						))}
					</div>
					<div className="flex flex-col gap-1 rounded-2xl bg-muted px-4 py-2">
						<div className="flex items-center justify-between py-2 text-xs">
							<span className="flex items-center gap-2 font-medium">
								<Wallet size={16} weight="duotone" /> Reserve balance
							</span>
							<span className="font-semibold tabular-nums">$8,124.05</span>
						</div>
						<div className="flex items-center justify-between border-t border-border py-2 text-xs">
							<span className="flex items-center gap-2 font-medium">
								<TrendUp size={16} weight="duotone" /> Vault value
							</span>
							<span className="font-semibold tabular-nums">$24,947.64</span>
						</div>
					</div>
					<div className="flex items-center justify-around rounded-full bg-muted px-4 py-2.5 text-[10px] font-medium text-muted-foreground">
						<span className="flex flex-col items-center gap-0.5 text-foreground">
							<House size={18} weight="fill" /> Home
						</span>
						<span className="flex flex-col items-center gap-0.5">
							<TrendUp size={18} weight="duotone" /> Earn
						</span>
						<span className="flex flex-col items-center gap-0.5">
							<PaperPlaneTilt size={18} weight="duotone" /> Activity
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

export function FAQ() {
	const [open, setOpen] = useState<number | null>(0);

	return (
		<section id="faq" className="scroll-mt-28 bg-background px-4 py-24 md:py-32">
			<div className="mx-auto max-w-6xl">
				<div className="mb-14 text-center md:mb-20">
					<h2 className="mx-auto max-w-[680px] font-display text-5xl font-bold leading-[0.9] tracking-tight text-balance text-foreground md:text-[60px] md:leading-[0.95]">
						Frequently
						<br />
						asked questions.
					</h2>
				</div>

				<div className="grid items-start gap-12 lg:grid-cols-[360px_1fr] lg:gap-16">
					<motion.div
						initial={{ opacity: 0, y: 32 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.8, ease: APPLE_EASE }}
					>
						<PhoneMock />
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 24 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.8, delay: 0.1, ease: APPLE_EASE }}
						className="flex flex-col items-start gap-3"
					>
						{faqs.map((faq, i) => {
							const isOpen = open === i;
							return (
								<div key={faq.question} className="flex w-full flex-col items-start gap-2">
									<button
										type="button"
										aria-expanded={isOpen}
										aria-controls={`faq-answer-${i}`}
										onClick={() => setOpen(isOpen ? null : i)}
										className={`inline-flex max-w-full items-center gap-2 rounded-full px-4 py-2.5 text-left text-sm font-medium transition-colors duration-300 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
											isOpen
												? "bg-foreground text-background"
												: "bg-muted text-foreground hover:bg-muted/70"
										}`}
									>
										<Plus
											size={14}
											weight="bold"
											aria-hidden="true"
											className={`shrink-0 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
										/>
										<span className="min-w-0">{faq.question}</span>
									</button>
									<AnimatePresence initial={false}>
										{isOpen && (
											<motion.div
												key="answer"
												id={`faq-answer-${i}`}
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
												transition={{ duration: 0.3, ease: APPLE_EASE }}
												className="max-w-xl rounded-3xl rounded-tl-lg bg-muted px-5 py-4"
											>
												<p className="text-sm leading-relaxed text-pretty text-muted-foreground">
													{faq.answer}
												</p>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							);
						})}
					</motion.div>
				</div>
			</div>
		</section>
	);
}
