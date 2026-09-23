"use client";

import { motion } from "motion/react";

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
			"Avela calculates how much you can spend based on your portfolio value and haircut.",
	},
	{
		number: "03",
		title: "Pay at checkout",
		description:
			"Your stocks stay — Avela swaps just enough to settle the payment. Merchant gets paid in stablecoin.",
	},
];

export function HowItWorks() {
	return (
		<section className="bg-background px-4 py-24 border-t border-border">
			<div className="max-w-5xl mx-auto">
				<div className="mb-12 text-center">
					<h2 className="text-3xl font-semibold tracking-tight text-foreground">How it works</h2>
					<p className="mt-3 text-muted-foreground">Three steps from portfolio to payment.</p>
				</div>

				<div className="grid gap-8 sm:grid-cols-3">
					{steps.map((step, i) => (
						<motion.div
							key={step.number}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-50px" }}
							transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
							className="flex flex-col gap-3"
						>
							<span className="font-mono text-sm text-primary">{step.number}</span>
							<h3 className="text-lg font-medium text-foreground">{step.title}</h3>
							<p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
