import { ArrowRight } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { APPLE_EASE } from "@/lib/motion";

type CtaVariant = "lime" | "ink" | "cream";
type CtaSize = "md" | "sm";

const variantStyles: Record<CtaVariant, { pill: string; circle: string }> = {
	lime: { pill: "bg-accent text-accent-foreground hover:bg-accent/90", circle: "bg-black/10" },
	ink: { pill: "bg-primary text-primary-foreground hover:bg-primary/90", circle: "bg-white/20" },
	cream: {
		pill: "bg-primary-foreground text-primary hover:bg-primary-foreground/90",
		circle: "bg-black/10",
	},
};

export function CtaButton({
	variant = "lime",
	size = "md",
	href,
	children,
	className = "",
}: {
	variant?: CtaVariant;
	size?: CtaSize;
	href: string;
	children: ReactNode;
	className?: string;
}) {
	const v = variantStyles[variant];
	const s = size === "sm" ? "gap-1.5 px-5 py-2.5 text-sm" : "gap-2.5 px-8 py-4 text-base";
	return (
		<a
			href={href}
			style={{ transitionTimingFunction: `cubic-bezier(${APPLE_EASE.join(", ")})` }}
			className={`inline-flex items-center ${s} rounded-full font-semibold transition-colors duration-300 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none ${v.pill} ${className}`}
		>
			{children}
			<span
				aria-hidden="true"
				className={`inline-flex items-center justify-center rounded-full ${v.circle} ${size === "sm" ? "p-1" : "p-1.5"}`}
			>
				<ArrowRight size={size === "sm" ? 14 : 18} weight="bold" />
			</span>
		</a>
	);
}
