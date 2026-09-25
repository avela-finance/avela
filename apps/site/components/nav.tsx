"use client";

import { ArrowRight, CaretDown } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { APPLE_EASE } from "@/lib/motion";

const APP_URL = "https://app.useavela.xyz";

const sectionLinks = [
	{ label: "How it works", href: "#how-it-works" },
	{ label: "Assets", href: "#assets" },
	{ label: "FAQ", href: "#faq" },
];

const productItems = [
	{ title: "Portfolio", desc: "Positions and live values", href: `${APP_URL}/portfolio` },
	{ title: "Payments", desc: "Spend from spending power", href: `${APP_URL}/payments` },
	{ title: "Agents", desc: "Scoped agent spending", href: `${APP_URL}/agents` },
	{ title: "Watchers", desc: "Alerts that watch the market", href: `${APP_URL}/watchers` },
];

const linkMono =
	"font-navmono text-[13px] font-medium uppercase tracking-widest rounded-sm transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export function Nav() {
	const [scrolled, setScrolled] = useState(false);
	const [dropOpen, setDropOpen] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const [mobileProducts, setMobileProducts] = useState(false);
	const dropRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// rAF-throttled: scroll fires faster than paint; coalesce to one read per frame.
		let ticking = false;
		const onScroll = () => {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				setScrolled(window.scrollY > 8);
				ticking = false;
			});
		};
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	useEffect(() => {
		if (!dropOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setDropOpen(false);
		};
		const onClick = (e: MouseEvent) => {
			if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
				setDropOpen(false);
			}
		};
		window.addEventListener("keydown", onKey);
		window.addEventListener("mousedown", onClick);
		return () => {
			window.removeEventListener("keydown", onKey);
			window.removeEventListener("mousedown", onClick);
		};
	}, [dropOpen]);

	useEffect(() => {
		if (!mobileOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setMobileOpen(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [mobileOpen]);

	return (
		<>
			<motion.header
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.8, ease: APPLE_EASE }}
				className={`dark fixed top-0 right-0 left-0 z-50 transition-colors duration-300 ${
					scrolled ? "border-b border-border bg-background/90 backdrop-blur-xl" : "bg-transparent"
				}`}
			>
				<nav
					aria-label="Primary"
					className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 md:px-8"
				>
					<a
						href="#top"
						className="font-display rounded-sm text-lg font-bold tracking-tight text-foreground transition-colors duration-300 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					>
						Avela
					</a>

					<div className="hidden items-center gap-7 md:flex">
						<div ref={dropRef} className="relative">
							<button
								type="button"
								aria-expanded={dropOpen}
								aria-haspopup="true"
								onClick={() => setDropOpen((v) => !v)}
								className={`${linkMono} inline-flex cursor-pointer items-center gap-1 py-2 ${
									dropOpen ? "text-foreground" : "text-foreground/70 hover:text-foreground"
								}`}
							>
								Products
								<CaretDown
									size={12}
									weight="bold"
									aria-hidden="true"
									className={`transition-transform duration-300 ${dropOpen ? "rotate-180" : ""}`}
								/>
							</button>
							<AnimatePresence>
								{dropOpen && (
									<motion.div
										key="products-panel"
										initial={{ opacity: 0, y: 6 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 6 }}
										transition={{ duration: 0.25, ease: APPLE_EASE }}
										className="absolute top-full left-1/2 w-72 -translate-x-1/2 pt-2"
									>
										<div className="rounded-2xl border border-border bg-popover p-2 shadow-xl">
											{productItems.map((item) => (
												<a
													key={item.href}
													href={item.href}
													className="group block rounded-xl px-4 py-3 transition-colors duration-300 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
												>
													<span className="block text-sm font-semibold text-popover-foreground transition-colors duration-300 group-hover:text-primary">
														{item.title}
													</span>
													<span className="mt-0.5 block text-xs text-muted-foreground">
														{item.desc}
													</span>
												</a>
											))}
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						{sectionLinks.map((link) => (
							<a
								key={link.href}
								href={link.href}
								className={`${linkMono} py-2 text-foreground/70 hover:text-foreground`}
							>
								{link.label}
							</a>
						))}
					</div>

					<div className="flex items-center gap-2">
						<a
							href={APP_URL}
							className="hidden items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors duration-300 hover:bg-primary/90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none md:inline-flex"
						>
							Try the app
							<ArrowRight size={16} weight="duotone" aria-hidden="true" />
						</a>
						<button
							type="button"
							aria-label={mobileOpen ? "Close menu" : "Open menu"}
							aria-expanded={mobileOpen}
							onClick={() => setMobileOpen((v) => !v)}
							className="flex h-9 w-9 flex-col items-center justify-center gap-[6px] rounded-full text-foreground transition-colors duration-300 hover:bg-muted active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:hidden"
						>
							<span
								aria-hidden="true"
								className={`block h-0.5 w-5 bg-current transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
									mobileOpen ? "translate-y-1 rotate-45" : ""
								}`}
							/>
							<span
								aria-hidden="true"
								className={`block h-0.5 w-5 bg-current transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
									mobileOpen ? "-translate-y-1 -rotate-45" : ""
								}`}
							/>
						</button>
					</div>
				</nav>
			</motion.header>

			<AnimatePresence>
				{mobileOpen && (
					<motion.div
						key="mobile-overlay"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3, ease: APPLE_EASE }}
						className="dark fixed inset-0 z-40 flex flex-col bg-background/95 px-6 pt-24 pb-8 backdrop-blur-3xl md:hidden"
					>
						<div className="flex flex-col gap-1">
							<motion.div
								initial={{ opacity: 0, y: 24 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.4, ease: APPLE_EASE }}
							>
								<button
									type="button"
									aria-expanded={mobileProducts}
									onClick={() => setMobileProducts((v) => !v)}
									className={`${linkMono} inline-flex cursor-pointer items-center gap-1.5 px-2 py-3 text-foreground`}
								>
									Products
									<CaretDown
										size={12}
										weight="bold"
										aria-hidden="true"
										className={`transition-transform duration-300 ${mobileProducts ? "rotate-180" : ""}`}
									/>
								</button>
								<AnimatePresence initial={false}>
									{mobileProducts && (
										<motion.div
											key="mobile-products"
											initial={{ opacity: 0, height: 0 }}
											animate={{ opacity: 1, height: "auto" }}
											exit={{ opacity: 0, height: 0 }}
											transition={{ duration: 0.3, ease: APPLE_EASE }}
											className="overflow-hidden"
										>
											<div className="flex flex-col gap-1 pb-2 pl-2">
												{productItems.map((item) => (
													<a
														key={item.href}
														href={item.href}
														onClick={() => setMobileOpen(false)}
														className="group rounded-xl px-2 py-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
													>
														<span className="block text-base font-semibold text-popover-foreground transition-colors duration-300 group-hover:text-primary">
															{item.title}
														</span>
														<span className="block text-xs text-muted-foreground">{item.desc}</span>
													</a>
												))}
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>

							{sectionLinks.map((link, i) => (
								<motion.a
									key={link.href}
									href={link.href}
									onClick={() => setMobileOpen(false)}
									initial={{ opacity: 0, y: 24 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.4, ease: APPLE_EASE, delay: (i + 1) * 0.06 }}
									className={`${linkMono} px-2 py-3 text-foreground`}
								>
									{link.label}
								</motion.a>
							))}
						</div>

						<div className="mt-auto">
							<motion.a
								href={APP_URL}
								initial={{ opacity: 0, y: 24 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									duration: 0.4,
									ease: APPLE_EASE,
									delay: (sectionLinks.length + 1) * 0.06,
								}}
								className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
							>
								Try the app
								<ArrowRight size={16} weight="duotone" aria-hidden="true" />
							</motion.a>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
