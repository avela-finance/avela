"use client";

import { Asterisk } from "@phosphor-icons/react";

const partners = [
	{ label: "X Layer", href: "https://www.okx.com/xlayer" },
	{ label: "OKX", href: "https://www.okx.com" },
	{ label: "Uniswap V3", href: "https://uniswap.org" },
	{ label: "Privy", href: "https://privy.io" },
	{ label: "xStocks", href: "https://xstocks.com" },
];

function PartnerRow({ hidden }: { hidden?: boolean }) {
	return (
		<div aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
			{partners.map((partner) => (
				<span key={partner.label} className="flex shrink-0 items-center">
					<a
						href={partner.href}
						target="_blank"
						rel="noopener noreferrer"
						tabIndex={hidden ? -1 : undefined}
						className="rounded-sm px-8 font-display text-2xl font-bold tracking-tight whitespace-nowrap text-foreground transition-colors duration-300 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:text-3xl"
					>
						{partner.label}
					</a>
					<Asterisk size={24} weight="bold" aria-hidden="true" className="shrink-0 text-primary" />
				</span>
			))}
		</div>
	);
}

export function BuiltOn() {
	return (
		<section aria-label="Built on" className="dark overflow-hidden bg-background py-10">
			<div className="flex w-max animate-[marquee_36s_linear_infinite] motion-reduce:animate-none hover:[animation-play-state:paused]">
				<PartnerRow />
				<PartnerRow hidden />
			</div>
		</section>
	);
}
