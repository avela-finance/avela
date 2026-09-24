"use client";

import {
	ArrowsLeftRight,
	Diamond,
	Eye,
	Gear,
	House,
	Robot,
	SquaresFour,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
	{ label: "Dashboard", href: "/", Icon: House },
	{ label: "Portfolio", href: "/portfolio", Icon: Diamond },
	{ label: "Payments", href: "/payments", Icon: ArrowsLeftRight },
	{ label: "Policies", href: "/policies", Icon: SquaresFour },
	{ label: "Agents", href: "/agents", Icon: Robot },
	{ label: "Watchers", href: "/watchers", Icon: Eye },
	{ label: "Settings", href: "/settings", Icon: Gear },
];

export function Sidebar() {
	const pathname = usePathname();

	return (
		<aside
			className={cn(
				"hidden md:flex md:flex-col",
				"w-60 shrink-0",
				"h-screen sticky top-0",
				"border-r border-border bg-background",
			)}
		>
			<div className="flex h-14 items-center px-6 border-b border-border">
				<Link
					href="/"
					className="rounded-sm text-lg font-semibold tracking-tight transition-transform duration-150 active:scale-[0.98]"
				>
					Avela
				</Link>
			</div>

			<nav className="flex flex-col gap-1 p-3 flex-1">
				{NAV_ITEMS.map((item) => {
					const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
					const ItemIcon = item.Icon;
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98]",
								isActive
									? "bg-muted text-primary"
									: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
							)}
						>
							<ItemIcon size={18} weight="duotone" aria-hidden />
							{item.label}
						</Link>
					);
				})}
			</nav>

			<div className="p-3 border-t border-border">
				<ModeToggle />
			</div>
		</aside>
	);
}
