"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ModeToggle({ className }: { className?: string }) {
	const { resolvedTheme, setTheme } = useTheme();

	return (
		<button
			type="button"
			onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
			className={cn(
				"inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors active:scale-[0.98] hover:bg-muted hover:text-foreground",
				className,
			)}
		>
			<Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
			<Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
			<span className="sr-only">Toggle theme</span>
		</button>
	);
}
