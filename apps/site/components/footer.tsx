"use client";

import { XLogo } from "@phosphor-icons/react";

import { LogoMark } from "@/components/logo-mark";

const APP_URL = "https://app.useavela.xyz";

const columns = [
	{
		heading: "Product",
		links: [
			{ label: "Products", href: "#products" },
			{ label: "Agents", href: "#agents" },
			{ label: "Business", href: "#business" },
			{ label: "How it works", href: "#how-it-works" },
			{ label: "Assets", href: "#assets" },
			{ label: "FAQ", href: "#faq" },
			{ label: "Launch App", href: APP_URL },
		],
	},
	{
		heading: "Company",
		links: [
			{ label: "App", href: APP_URL },
			{ label: "X", href: "https://x.com/avela_xyz", external: true },
			{ label: "X Layer", href: "https://www.okx.com/xlayer", external: true },
			{ label: "Uniswap V3", href: "https://uniswap.org", external: true },
		],
	},
];

export function Footer() {
	return (
		<footer className="dark bg-background pt-16 pb-8">
			<div className="mx-auto max-w-6xl px-4">
				<div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
					<div className="flex flex-col items-start gap-5">
						<a
							href="#top"
							className="font-display text-2xl font-bold tracking-tight rounded-sm transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none flex items-center gap-2"
						>
							<LogoMark />
							<span>Avela</span>
						</a>
						<p className="max-w-xs font-mono text-xs leading-relaxed text-pretty text-muted-foreground">
							A programmable spending account for tokenized stocks. Hold, spend, and automate —
							positions stay intact.
						</p>
						<a
							href="https://x.com/avela_xyz"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="Avela on X"
							className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors duration-300 hover:border-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						>
							<XLogo size={18} weight="bold" aria-hidden="true" />
						</a>
					</div>

					{columns.map((col) => (
						<nav key={col.heading} aria-label={`Footer — ${col.heading}`}>
							<h3 className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
								{col.heading}
							</h3>
							<ul className="mt-5 flex flex-col gap-4">
								{col.links.map((link) => (
									<li key={link.label}>
										<a
											href={link.href}
											{...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
											className="font-mono text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
										>
											{link.label}
										</a>
									</li>
								))}
							</ul>
						</nav>
					))}

					<nav aria-label="Footer — Legal">
						<h3 className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
							Legal
						</h3>
						<ul className="mt-5 flex flex-col gap-4">
							{/* TODO: point Privacy and Terms at real pages once published. Disabled spans until then. */}
							<li>
								<span
									aria-disabled="true"
									className="cursor-not-allowed font-mono text-sm opacity-40"
								>
									Privacy
								</span>
							</li>
							<li>
								<span
									aria-disabled="true"
									className="cursor-not-allowed font-mono text-sm opacity-40"
								>
									Terms
								</span>
							</li>
							<li>
								<span
									aria-disabled="true"
									className="cursor-not-allowed font-mono text-sm opacity-40"
								>
									Support
								</span>
							</li>
						</ul>
					</nav>
				</div>
			</div>

			<div className="mt-16 border-t border-border">
				<div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
					<p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
						© 2026 Avela. All rights reserved.
					</p>
					<p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
						useavela.xyz · Built on X Layer
					</p>
				</div>
			</div>
		</footer>
	);
}
