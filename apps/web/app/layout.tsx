import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

const geistMonoHeading = Geist_Mono({ subsets: ["latin"], variable: "--font-heading" });

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
});

export const metadata = {
	title: "Avela — Programmable Spending Account",
	description:
		"Pay from your tokenized stock portfolio without selling. Programmable policies, agent permissions, and WhatsApp access.",
	manifest: "/manifest.json",
	metadataBase: new URL("https://app.useavela.xyz"),
	icons: [
		{
			media: "(prefers-color-scheme: light)",
			url: "/favicon-black.svg",
			href: "/favicon-black.svg",
		},
		{
			media: "(prefers-color-scheme: dark)",
			url: "/favicon-white.svg",
			href: "/favicon-white.svg",
		},
	],
};

export const viewport = {
	themeColor: "#0a0a0a",
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={cn(
				"antialiased",
				fontMono.variable,
				"font-sans",
				geist.variable,
				geistMonoHeading.variable,
			)}
		>
			<body>
				<Providers>
					<AppShell>{children}</AppShell>
				</Providers>
			</body>
		</html>
	);
}
