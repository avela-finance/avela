"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { APPLE_EASE } from "@/lib/motion";

const links = [
	{ label: "How it works", href: "#how-it-works" },
	{ label: "Features", href: "#features" },
	{ label: "Assets", href: "#assets" },
	{ label: "FAQ", href: "#faq" },
];

const SHEET_SPRING = { type: "spring", bounce: 0, duration: 0.4 } as const;

export function Nav() {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open]);

	return (
		<>
			<motion.header
				initial={{ opacity: 0, y: -16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, ease: APPLE_EASE }}
				className="fixed top-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2"
			>
				<nav
					aria-label="Primary"
					className="flex items-center justify-between rounded-full border border-border bg-background/80 py-3 pr-3 pl-5 backdrop-blur-xl"
				>
					<a
						href="#top"
						className="rounded-sm text-base font-semibold tracking-tight text-foreground transition-colors duration-300 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					>
						Avela
					</a>

					<div className="hidden items-center gap-6 md:flex">
						{links.map((link) => (
							<a
								key={link.href}
								href={link.href}
								className="rounded-sm text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
							>
								{link.label}
							</a>
						))}
					</div>

					<div className="flex items-center gap-2">
						<a
							href="https://app.useavela.xyz"
							className="hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors duration-300 hover:bg-primary/90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none md:inline-flex"
						>
							Launch App
						</a>
						<button
							type="button"
							aria-label={open ? "Close menu" : "Open menu"}
							aria-expanded={open}
							onClick={() => setOpen((v) => !v)}
							className="flex h-9 w-9 flex-col items-center justify-center gap-[6px] rounded-full text-foreground transition-colors duration-300 hover:bg-muted active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:hidden"
						>
							<span
								aria-hidden="true"
								className={`block h-0.5 w-5 bg-current transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
									open ? "translate-y-1 rotate-45" : ""
								}`}
							/>
							<span
								aria-hidden="true"
								className={`block h-0.5 w-5 bg-current transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
									open ? "-translate-y-1 -rotate-45" : ""
								}`}
							/>
						</button>
					</div>
				</nav>
			</motion.header>

			<AnimatePresence>
				{open && (
					<motion.div
						key="mobile-overlay"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={SHEET_SPRING}
						onClick={() => setOpen(false)}
						className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-3xl md:hidden"
					>
						{links.map((link, i) => (
							<motion.a
								key={link.href}
								href={link.href}
								onClick={() => setOpen(false)}
								initial={{ opacity: 0, y: 24 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 24 }}
								transition={{ ...SHEET_SPRING, delay: open ? i * 0.05 : 0 }}
								className="rounded-xl px-6 py-3 text-2xl font-semibold tracking-tight text-foreground active:scale-[0.98]"
							>
								{link.label}
							</motion.a>
						))}
						<motion.a
							href="https://app.useavela.xyz"
							initial={{ opacity: 0, y: 24 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 24 }}
							transition={{ ...SHEET_SPRING, delay: open ? links.length * 0.05 : 0 }}
							className="mt-4 inline-flex rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground active:scale-[0.98]"
						>
							Launch App
						</motion.a>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
