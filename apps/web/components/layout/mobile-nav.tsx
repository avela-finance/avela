"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
	{ label: "Dashboard", href: "/", icon: "⌂" },
	{ label: "Portfolio", href: "/portfolio", icon: "◈" },
	{ label: "Payments", href: "/payments", icon: "⇄" },
];

const MORE_ITEMS = [
	{ label: "Policies", href: "/policies", icon: "⊞" },
	{ label: "Agents", href: "/agents", icon: "◎" },
	{ label: "Watchers", href: "/watchers", icon: "◉" },
	{ label: "Settings", href: "/settings", icon: "⚙" },
];

export function MobileNav() {
	const pathname = usePathname();
	const [showMore, setShowMore] = useState(false);

	const isMoreActive = MORE_ITEMS.some((item) => pathname.startsWith(item.href));

	return (
		<>
			{showMore && (
				<button
					type="button"
					className="fixed inset-0 z-40 cursor-default"
					onClick={() => setShowMore(false)}
					aria-label="Close menu"
				/>
			)}

			{showMore && (
				<div className="fixed bottom-14 left-0 right-0 z-50 bg-background border-t border-border p-4 space-y-2">
					{MORE_ITEMS.map((item) => {
						const isActive = pathname.startsWith(item.href);
						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={() => setShowMore(false)}
								className={cn(
									"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
									isActive
										? "bg-muted text-primary"
										: "text-muted-foreground hover:bg-muted hover:text-foreground",
								)}
							>
								<span className="text-lg leading-none">{item.icon}</span>
								<span>{item.label}</span>
							</Link>
						);
					})}
				</div>
			)}

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
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors",
								isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
							)}
						>
							<span className="text-lg leading-none">{item.icon}</span>
							<span>{item.label}</span>
						</Link>
					);
				})}

				<button
					type="button"
					onClick={() => setShowMore((prev) => !prev)}
					className={cn(
						"flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors",
						showMore || isMoreActive
							? "text-primary"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<span className="text-lg leading-none">⋯</span>
					<span>More</span>
				</button>
			</nav>
		</>
	);
}
