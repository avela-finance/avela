"use client";

import {
	ArrowsLeftRight,
	Diamond,
	DotsThree,
	Eye,
	Gear,
	House,
	Robot,
	SquaresFour,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
	{ label: "Dashboard", href: "/", Icon: House },
	{ label: "Portfolio", href: "/portfolio", Icon: Diamond },
	{ label: "Payments", href: "/payments", Icon: ArrowsLeftRight },
];

const MORE_ITEMS = [
	{ label: "Policies", href: "/policies", Icon: SquaresFour },
	{ label: "Agents", href: "/agents", Icon: Robot },
	{ label: "Watchers", href: "/watchers", Icon: Eye },
	{ label: "Settings", href: "/settings", Icon: Gear },
];

const SHEET_SPRING = { type: "spring", bounce: 0, duration: 0.4 } as const;

export function MobileNav() {
	const pathname = usePathname();
	const [showMore, setShowMore] = useState(false);

	const isMoreActive = MORE_ITEMS.some((item) => pathname.startsWith(item.href));

	useEffect(() => {
		if (!showMore) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setShowMore(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [showMore]);

	return (
		<>
			<AnimatePresence>
				{showMore && (
					<motion.button
						key="more-scrim"
						type="button"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={SHEET_SPRING}
						className="fixed inset-0 z-40 cursor-default bg-background/40"
						onClick={() => setShowMore(false)}
						aria-label="Close menu"
					/>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{showMore && (
					<motion.div
						key="more-panel"
						initial={{ opacity: 0, y: 24 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 24 }}
						transition={SHEET_SPRING}
						className="fixed bottom-14 left-0 right-0 z-50 space-y-2 border-t border-border bg-background p-4"
					>
						{MORE_ITEMS.map((item) => {
							const isActive = pathname.startsWith(item.href);
							const ItemIcon = item.Icon;
							return (
								<Link
									key={item.href}
									href={item.href}
									onClick={() => setShowMore(false)}
									className={cn(
										"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98]",
										isActive
											? "bg-muted text-primary"
											: "text-muted-foreground hover:bg-muted hover:text-foreground",
									)}
								>
									<ItemIcon size={20} weight="duotone" aria-hidden />
									<span>{item.label}</span>
								</Link>
							);
						})}
					</motion.div>
				)}
			</AnimatePresence>

			<nav
				className={cn(
					"fixed bottom-0 left-0 right-0 z-50",
					"flex items-center justify-around",
					"border-t border-border bg-background/95 backdrop-blur-sm",
					"h-14 px-2",
					"md:hidden",
				)}
			>
				{NAV_ITEMS.map((item) => {
					const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
					const ItemIcon = item.Icon;
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors active:scale-[0.98]",
								isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
							)}
						>
							<ItemIcon size={20} weight="duotone" aria-hidden />
							<span>{item.label}</span>
						</Link>
					);
				})}

				<button
					type="button"
					onClick={() => setShowMore((prev) => !prev)}
					aria-expanded={showMore}
					className={cn(
						"flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors active:scale-[0.98]",
						showMore || isMoreActive
							? "text-primary"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<DotsThree size={20} weight="duotone" aria-hidden />
					<span>More</span>
				</button>
			</nav>
		</>
	);
}
