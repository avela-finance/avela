"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { usePrivy } from "@privy-io/react-auth";
import { LogoMark } from "@/components/logo-mark";

/**
 * SignIn — clean centered sign-in screen for signed-out visitors.
 * Privy handles the actual auth methods (email, Google, wallet) inside its
 * modal; this screen is just brand + one big CTA. App-plain, no decoration.
 */
export function SignIn() {
	const { login } = usePrivy();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
			<div className="flex w-full max-w-sm flex-col items-center text-center">
				<span className="flex items-center gap-2">
					<LogoMark className="size-7" />
					<span className="text-xl font-semibold tracking-tight">Avela</span>
				</span>

				<h1 className="mt-8 text-4xl font-bold leading-[1.05] tracking-tight text-balance text-foreground">
					One account for tokenized stocks.
				</h1>
				<p className="mt-3 max-w-xs text-sm leading-relaxed text-pretty text-muted-foreground">
					Hold, spend, and automate — your tokenized stocks stay intact, without selling.
				</p>

				<button
					type="button"
					onClick={login}
					className="mt-8 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all duration-150 ease-out hover:bg-primary/90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
				>
					Sign in
					<ArrowRight size={18} weight="bold" aria-hidden="true" />
				</button>
				<p className="mt-4 text-xs text-muted-foreground">
					Email, Google, or wallet — secured by Privy
				</p>
			</div>
		</div>
	);
}
