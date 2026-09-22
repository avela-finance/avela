"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { privyConfig } from "@/lib/privy-config";

export function Providers({ children }: { children: React.ReactNode }) {
	const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
	if (!appId) {
		return (
			<div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
				<h2>Missing NEXT_PUBLIC_PRIVY_APP_ID</h2>
				<p>Add it to apps/web/.env.local</p>
			</div>
		);
	}

	return (
		<PrivyProvider appId={appId} config={privyConfig}>
			<ThemeProvider>{children}</ThemeProvider>
		</PrivyProvider>
	);
}
