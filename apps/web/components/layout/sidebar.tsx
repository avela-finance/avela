"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
	{ label: "Dashboard", href: "/" },
	{ label: "Portfolio", href: "/portfolio" },
	{ label: "Payments", href: "/payments" },
	{ label: "Policies", href: "/policies" },
	{ label: "Agents", href: "/agents" },
	{ label: "Watchers", href: "/watchers" },
	{ label: "Settings", href: "/settings" },
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
				<Link href="/" className="text-lg font-semibold tracking-tight">
					Avela
				</Link>
			</div>

			<nav className="flex flex-col gap-1 p-3 flex-1">
				{NAV_ITEMS.map((item) => {
					const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"rounded-md px-3 py-2 text-sm font-medium transition-colors",
								isActive
									? "bg-muted text-foreground"
									: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
							)}
						>
							{item.label}
						</Link>
					);
				})}
			</nav>
		</aside>
	);
}
