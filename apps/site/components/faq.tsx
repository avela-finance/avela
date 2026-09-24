"use client";

import { Plus } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { APPLE_EASE } from "@/lib/motion";

const faqs = [
	{
		question: "What happens to my stocks when I pay?",
		answer:
			"They stay locked in the AvelaVault contract as collateral. Payments settle from a pre-funded stablecoin reserve through the AvelaPaymentRouter, so your positions are never touched at checkout. You can verify this on the explorer: a PositionLocked event with no matching PositionReleased event means the collateral never moved. Withdrawal is permissionless to you as the depositor.",
	},
	{
		question: "How is my spending power calculated?",
		answer:
			"Your portfolio is priced with the Uniswap V3 time-weighted average price, then a conservative haircut is applied as a safety cushion against price movement. The haircut starts at 50% for index assets. If your holdings rise, spending power adjusts upward. If they fall, the haircut absorbs normal volatility first.",
	},
	{
		question: "Which assets can I deposit?",
		answer:
			"Five wrapped xStocks on X Layer: wSPYx (S&P 500), wQQQx (Nasdaq 100), wNVDAx (Nvidia), wGOOGLx (Alphabet), and wAAPLx (Apple). Each has a verified Uniswap V3 stablecoin pool with $400K or more in liquidity.",
	},
	{
		question: "Can an AI agent spend from my account?",
		answer:
			"Yes, within permissions you define. You set the maximum per transaction and per day, which assets it can use, which merchants it can pay, and whether approval is always required. Agents never own the funds. They hold scoped authority that expires and that you can revoke at any time.",
	},
	{
		question: "How do approvals work over WhatsApp?",
		answer:
			"When a payment needs your sign-off, you get a message showing the amount and the asset behind it. You tap approve or reject right in the conversation. You can also check balances and spending power and receive payment receipts without opening the app.",
	},
	{
		question: "What if my spending power is not enough?",
		answer:
			"The payment fails. Avela never silently converts or sells your stocks at checkout. You decide what to do next: deposit more, add stablecoins, or manually sell a position. Selling is always a separate portfolio action you take yourself.",
	},
];

export function FAQ() {
	const [open, setOpen] = useState<number | null>(0);

	return (
		<section id="faq" className="dark scroll-mt-28 border-t border-border bg-background px-4 py-24">
			<div className="mx-auto max-w-3xl">
				<div className="mb-12 text-center">
					<h2 className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
						Frequently asked questions
					</h2>
					<p className="mt-3 text-pretty text-muted-foreground">
						How the account, spending power, and approvals work.
					</p>
				</div>

				<div className="flex flex-col gap-3">
					{faqs.map((faq, i) => {
						const isOpen = open === i;
						return (
							<div
								key={faq.question}
								className={`border border-border bg-muted/50 transition-[border-radius] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
									isOpen ? "rounded-3xl" : "rounded-full"
								}`}
							>
								<button
									type="button"
									aria-expanded={isOpen}
									onClick={() => setOpen(isOpen ? null : i)}
									className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
								>
									<span className="text-sm font-medium text-foreground">{faq.question}</span>
									<Plus
										size={16}
										weight="bold"
										aria-hidden="true"
										className={`shrink-0 text-muted-foreground transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
											isOpen ? "rotate-45" : ""
										}`}
									/>
								</button>
								<AnimatePresence initial={false}>
									{isOpen && (
										<motion.div
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: "auto", opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											transition={{ duration: 0.5, ease: APPLE_EASE }}
											className="overflow-hidden"
										>
											<p className="px-6 pb-5 text-sm leading-relaxed text-pretty text-muted-foreground">
												{faq.answer}
											</p>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
