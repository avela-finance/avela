"use client";

import { motion } from "motion/react";
import { APPLE_EASE } from "@/lib/motion";

const rows = [
	{ symbol: "wSPYx", value: "$6,240.00", width: "64%" },
	{ symbol: "wQQQx", value: "$3,510.00", width: "42%" },
	{ symbol: "wNVDAx", value: "$2,730.00", width: "31%" },
];

export function PhoneMoment() {
	return (
		<section className="scroll-mt-28 border-t border-border bg-background px-4 py-24">
			<div className="mx-auto flex max-w-5xl flex-col items-center gap-12">
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-50px" }}
					transition={{ duration: 0.8, ease: APPLE_EASE }}
					className="flex flex-col items-center gap-4 text-center"
				>
					<h2 className="max-w-[680px] font-display text-3xl font-bold leading-tight tracking-tight text-balance text-foreground sm:text-4xl md:text-[64px] md:leading-[0.95]">
						One account. Available globally.
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
					className="relative mx-auto w-full max-w-sm"
				>
					<div
						aria-hidden="true"
						className="absolute inset-x-4 top-24 bottom-0 rounded-full bg-feature-lime opacity-20 blur-3xl"
					/>
					<div className="relative rounded-[3rem] border border-border bg-card p-3">
						<div className="flex flex-col gap-5 rounded-[2.4rem] bg-background px-6 pt-4 pb-8">
							<div aria-hidden="true" className="mx-auto h-5 w-24 rounded-full bg-foreground/10" />
							{/* TODO: swap with live web PWA screenshot, see DESIGN.md swap list */}
							<div className="flex flex-col gap-1">
								<span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
									Spending power
								</span>
								<span className="font-display text-4xl font-bold leading-tight tracking-tight tabular-nums text-foreground">
									$12,480.00
								</span>
								<span className="text-xs text-muted-foreground">Demo data</span>
							</div>
							<div className="flex flex-col gap-4">
								{rows.map((row) => (
									<div key={row.symbol} className="flex flex-col gap-1.5">
										<div className="flex items-center justify-between">
											<span className="font-mono text-xs font-medium text-foreground">
												{row.symbol}
											</span>
											<span className="text-xs font-semibold tabular-nums text-muted-foreground">
												{row.value}
											</span>
										</div>
										<div className="h-1.5 overflow-hidden rounded-full bg-muted">
											<div
												className="h-full rounded-full bg-primary"
												style={{ width: row.width }}
											/>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
