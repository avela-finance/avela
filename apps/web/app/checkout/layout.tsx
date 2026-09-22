import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
	title: "Demo Store — Avela Checkout",
	description: "Demo merchant storefront for Pay with Avela",
};

export default function CheckoutLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-background">
			<header className="border-b border-border px-4 py-3">
				<div className="mx-auto flex max-w-4xl items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-muted-foreground">Demo Store</span>
						<Badge variant="secondary">Powered by Avela</Badge>
					</div>
				</div>
			</header>
			<main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
		</div>
	);
}
