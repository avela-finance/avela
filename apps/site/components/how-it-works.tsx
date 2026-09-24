"use client";

import { motion } from "motion/react";
import { APPLE_EASE } from "@/lib/motion";

const steps = [
	{
		number: "01",
		title: "Deposit tokenized stocks",
		description: "Transfer wrapped xStocks (wSPYx, wQQQx, wNVDAx) to your Avela account.",
	},
	{
		number: "02",
		title: "See your spending power",
		description:
			"Avela prices your spending power with the Uniswap V3 TWAP oracle, based on portfolio value and haircut.",
	},
	{
		number: "03",
		title: "Pay at checkout",
		description:
			"The reserve settles the payment in stablecoin while your positions stay intact. No selling, ever.",
	},
];

export function HowItWorks() {
	return (
		<section
			id="how-it-works"
			className="bg-background px-4 py-24 border-t border-border scroll-mt-28"
		>
			<div className="max-w-5xl mx-auto">
				<div className="mb-12 text-center">
					<h2 className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
						How it works
					</h2>
					<p className="mt-3 text-pretty text-muted-foreground">
						Three steps from portfolio to payment.
					</p>
				</div>

				<div className="grid gap-8 sm:grid-cols-3">
					{steps.map((step, i) => (
						<motion.div
							key={step.number}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-50px" }}
							transition={{ duration: 0.5, delay: i * 0.12, ease: APPLE_EASE }}
							className="flex flex-col gap-3"
						>
							<span className="font-mono text-sm tabular-nums text-primary">{step.number}</span>
							<h3 className="text-lg font-semibold text-balance text-foreground">{step.title}</h3>
							<p className="text-sm leading-relaxed text-pretty text-muted-foreground">
								{step.description}
							</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
