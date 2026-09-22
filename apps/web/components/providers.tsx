"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { privyConfig } from "@/lib/privy-config";

export function Providers({ children }: { children: React.ReactNode }) {
	const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
	if (!appId) {
		throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is required");
	}

	return (
		<PrivyProvider appId={appId} config={privyConfig}>
			<ThemeProvider>{children}</ThemeProvider>
		</PrivyProvider>
	);
}
