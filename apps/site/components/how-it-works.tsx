"use client";

import { ArrowRight, ChatCircle, LockKey, Robot, Vault } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { APPLE_EASE } from "@/lib/motion";

const CARD =
	"relative flex min-h-[440px] flex-col overflow-hidden rounded-[2rem] p-6 md:min-h-[480px] md:p-8";

const NUMBER_PILL =
	"inline-flex h-9 w-9 items-center justify-center rounded-full border border-current font-mono text-xs tabular-nums opacity-70";

const bars = [
	{ symbol: "wSPYx", value: "$6,241.18", width: "64%" },
	{ symbol: "wQQQx", value: "$3,512.44", width: "42%" },
	{ symbol: "wNVDAx", value: "$2,731.09", width: "31%" },
];

const receipts = [
	{ name: "Blue Bottle Coffee", meta: "Today, 09:41 · USDC", amount: "-$4.20" },
	{ name: "Whole Foods", meta: "Yesterday, 18:03 · USDG", amount: "-$86.14" },
	{ name: "Vault position", meta: "wSPYx · locked, untouched", amount: "Intact" },
];

export function HowItWorks() {
	return (
		<section id="how-it-works" className="dark scroll-mt-28 bg-background px-4 py-24 md:py-32">
			<div className="mx-auto max-w-6xl">
				<div className="mb-14 text-center md:mb-20">
					<h2 className="mx-auto max-w-[680px] font-display text-5xl font-bold leading-[0.9] tracking-tight text-balance text-foreground md:text-[60px] md:leading-[0.95]">
						How Avela
						<br />
						works.
					</h2>
					<p className="mt-6 font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
						Built on X Layer
					</p>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					{/* 01 — DEPOSIT */}
					<motion.article
						initial={{ opacity: 0, y: 32 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.8, ease: APPLE_EASE }}
						className={`${CARD} bg-feature-peach text-foreground`}
					>
						<div aria-hidden="true" className="flex flex-col gap-3">
							<div className="flex items-center gap-3 rounded-3xl bg-card px-5 py-4 shadow-sm">
								<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
									<Vault size={20} weight="duotone" />
								</span>
								<span className="min-w-0 flex-1">
									<span className="block truncate text-sm font-semibold">wSPYx deposit</span>
									<span className="block truncate text-xs text-muted-foreground">
										Locks in AvelaVault as collateral
									</span>
								</span>
								<ArrowRight size={16} weight="bold" />
							</div>
							<div className="flex items-center gap-3 rounded-3xl bg-card px-5 py-4 shadow-sm">
								<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
									<LockKey size={20} weight="duotone" />
								</span>
								<span className="min-w-0 flex-1">
									<span className="block truncate text-sm font-semibold">PositionLocked</span>
									<span className="block truncate text-xs text-muted-foreground">
										Verifiable onchain, never moved
									</span>
								</span>
								<ArrowRight size={16} weight="bold" />
							</div>
						</div>

						<div className="mt-auto pt-10">
							<span className={NUMBER_PILL}>01</span>
							<h3 className="mt-4 font-display text-3xl font-bold leading-none tracking-tight text-foreground">
								Deposit
							</h3>
							<p className="mt-3 max-w-md text-pretty text-sm leading-relaxed opacity-80 md:text-base">
								Transfer wrapped xStocks to your vault. They lock as collateral and stay intact —
								never touched at checkout.
							</p>
						</div>
					</motion.article>

					{/* 02 — UNLOCK */}
					<motion.article
						initial={{ opacity: 0, y: 32 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.8, delay: 0.1, ease: APPLE_EASE }}
						className={`${CARD} bg-card text-card-foreground`}
					>
						<div className="flex flex-col gap-1">
							<span className={NUMBER_PILL}>02</span>
							<h3 className="mt-4 font-display text-3xl font-bold leading-none tracking-tight text-foreground">
								Unlock
							</h3>
							<p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
								Uniswap V3 TWAP prices your portfolio, then a 50% haircut sets safe spending power.
							</p>
						</div>

						<div aria-hidden="true" className="mt-auto rounded-3xl bg-background px-6 pt-5 pb-6">
							<span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Spending power
							</span>
							<span className="mt-1 block font-display text-4xl font-bold leading-tight tracking-tight tabular-nums">
								$12,473.82
							</span>
							<div className="mt-5 flex flex-col gap-4">
								{bars.map((row) => (
									<div key={row.symbol} className="flex flex-col gap-1.5">
										<div className="flex items-center justify-between">
											<span className="font-mono text-xs font-medium">{row.symbol}</span>
											<span className="text-xs font-semibold tabular-nums text-muted-foreground">
												{row.value}
											</span>
										</div>
										<div className="h-1.5 overflow-hidden rounded-full bg-muted">
											<div
												className="h-full rounded-full bg-feature-lime"
												style={{ width: row.width }}
											/>
										</div>
									</div>
								))}
							</div>
						</div>
					</motion.article>

					{/* 03 — SPEND */}
					<motion.article
						initial={{ opacity: 0, y: 32 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.8, ease: APPLE_EASE }}
						className={`${CARD} bg-feature-olive text-foreground`}
					>
						<div className="flex flex-col gap-1">
							<span className={NUMBER_PILL}>03</span>
							<h3 className="mt-4 font-display text-3xl font-bold leading-none tracking-tight text-foreground">
								Spend
							</h3>
							<p className="mt-3 max-w-md text-pretty text-sm leading-relaxed opacity-80 md:text-base">
								Pay in stablecoin from the pre-funded reserve. The vault stays locked — no selling,
								ever.
							</p>
						</div>

						<div aria-hidden="true" className="mt-auto overflow-hidden rounded-3xl bg-card">
							{receipts.map((row, i) => (
								<div
									key={row.name}
									className={`flex items-center justify-between gap-3 px-5 py-4 ${
										i !== 0 ? "border-t border-border" : ""
									}`}
								>
									<span className="min-w-0">
										<span className="block truncate text-sm font-semibold text-card-foreground">
											{row.name}
										</span>
										<span className="block truncate text-xs text-muted-foreground">{row.meta}</span>
									</span>
									<span className="shrink-0 text-sm font-semibold tabular-nums text-card-foreground">
										{row.amount}
									</span>
								</div>
							))}
						</div>
					</motion.article>

					{/* 04 — AUTOMATE */}
					<motion.article
						initial={{ opacity: 0, y: 32 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-60px" }}
						transition={{ duration: 0.8, delay: 0.1, ease: APPLE_EASE }}
						className={`${CARD} bg-feature-lime text-foreground`}
					>
						<div className="flex flex-col gap-1">
							<span className={NUMBER_PILL}>04</span>
							<h3 className="mt-4 font-display text-3xl font-bold leading-none tracking-tight text-foreground">
								Automate
							</h3>
							<p className="mt-3 max-w-md text-pretty text-sm leading-relaxed opacity-80 md:text-base">
								Scoped agents spend within caps you set. Approve in WhatsApp — watchers guard the
								rest.
							</p>
						</div>

						<div aria-hidden="true" className="mt-auto rounded-3xl bg-card px-5 py-4 shadow-sm">
							<div className="flex items-center gap-3">
								<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
									<Robot size={20} weight="duotone" />
								</span>
								<span className="min-w-0 flex-1">
									<span className="block truncate text-sm font-semibold text-card-foreground">
										Trading agent · $50/day
									</span>
									<span className="block truncate text-xs text-muted-foreground">
										Coffee run — needs approval
									</span>
								</span>
								<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
									<ChatCircle size={20} weight="duotone" />
								</span>
							</div>
							<div className="mt-4 grid grid-cols-2 gap-2">
								<span className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
									Approve
								</span>
								<span className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-card-foreground">
									Reject
								</span>
							</div>
						</div>
					</motion.article>
				</div>
			</div>
		</section>
	);
}
