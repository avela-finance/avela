import Image from "next/image";

import { cn } from "@/lib/utils";

type LogoMarkProps = {
	className?: string;
};

/**
 * Theme-aware Avela mark. CSS-driven (no JS theme hook) so it works in the
 * marketing site without a ThemeProvider: dark icon in light mode, light
 * icon in dark mode. Mirrors the ZenithPay asset pair.
 */
export function LogoMark({ className }: LogoMarkProps) {
	return (
		<span aria-hidden="true" className={cn("relative inline-flex size-5 shrink-0", className)}>
			<Image
				src="/icon-dark.svg"
				alt=""
				width={20}
				height={20}
				className="size-full dark:hidden"
				priority
			/>
			<Image
				src="/icon-light.svg"
				alt=""
				width={20}
				height={20}
				className="hidden size-full dark:block"
				priority
			/>
		</span>
	);
}
