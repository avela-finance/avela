"use client";

import { motion } from "motion/react";
import { APPLE_EASE } from "@/lib/motion";

const rowA = [
	"Nigeria",
	"Kenya",
	"Ghana",
	"India",
	"Philippines",
	"Indonesia",
	"Brazil",
	"Mexico",
	"Argentina",
	"Colombia",
];

const rowB = [
	"United States",
	"United Kingdom",
	"Germany",
	"France",
	"Canada",
	"Australia",
	"Japan",
	"Singapore",
	"UAE",
	"South Africa",
];

const pins = [
	{ label: "Americas", top: "42%", left: "26%" },
	{ label: "Europe", top: "26%", left: "53%" },
	{ label: "Asia", top: "36%", left: "71%" },
	{ label: "Africa", top: "58%", left: "51%" },
	{ label: "Oceania", top: "74%", left: "79%" },
];

function CountryRow({ countries, reverse }: { countries: string[]; reverse?: boolean }) {
	return (
		<div
			className="flex w-max animate-[marquee_40s_linear_infinite] gap-3 motion-reduce:animate-none"
			style={reverse ? { animationDirection: "reverse" } : undefined}
		>
			{countries.map((country) => (
				<span
					key={country}
					className="shrink-0 rounded-full border border-border px-5 py-2 font-mono text-xs tracking-widest whitespace-nowrap text-muted-foreground uppercase"
				>
					{country}
				</span>
			))}
			{countries.map((country) => (
				<span
					key={`${country}-dup`}
					aria-hidden="true"
					className="shrink-0 rounded-full border border-border px-5 py-2 font-mono text-xs tracking-widest whitespace-nowrap text-muted-foreground uppercase"
				>
					{country}
				</span>
			))}
		</div>
	);
}

export function Global() {
	return (
		<section id="global" className="scroll-mt-28 overflow-hidden bg-background px-4 py-24 md:py-32">
			<div className="mx-auto max-w-6xl text-center">
				<p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
					Global by default
				</p>
				<h2 className="mx-auto mt-4 max-w-[680px] font-display text-5xl font-bold leading-[0.9] tracking-tight text-balance md:text-[60px] md:leading-[0.95]">
					Available globally.
				</h2>
				<p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
					One account on X Layer rails. Settle in USDG and USDC — no borders, no banking hours.
				</p>

				<motion.div
					initial={{ opacity: 0, y: 32 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-60px" }}
					transition={{ duration: 0.8, ease: APPLE_EASE }}
					className="relative mx-auto mt-14 aspect-square w-full max-w-[420px]"
				>
					<div
						aria-hidden="true"
						className="absolute inset-0 rounded-full"
						style={{
							background:
								"radial-gradient(circle at 32% 28%, oklch(0.928 0.202 117.8 / 0.55), oklch(0.928 0.202 117.8 / 0.12) 55%, oklch(0.928 0.202 117.8 / 0.04) 75%)",
						}}
					/>
					<div aria-hidden="true" className="absolute inset-0 rounded-full border border-border" />
					<div
						aria-hidden="true"
						className="absolute inset-[18%] rounded-full border border-border"
					/>
					{pins.map((pin) => (
						<div key={pin.label} className="absolute" style={{ top: pin.top, left: pin.left }}>
							<span className="relative flex size-3">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-feature-lime opacity-60 motion-reduce:animate-none" />
								<span className="relative inline-flex size-3 rounded-full border-2 border-background bg-feature-lime" />
							</span>
							<span className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-2.5 py-1 font-mono text-[10px] font-medium whitespace-nowrap text-background uppercase tracking-widest">
								{pin.label}
							</span>
						</div>
					))}
				</motion.div>
			</div>

			<div className="mt-14 flex flex-col gap-3 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
				<CountryRow countries={rowA} />
				<CountryRow countries={rowB} reverse />
			</div>
		</section>
	);
}
