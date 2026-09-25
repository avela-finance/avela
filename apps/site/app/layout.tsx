import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

import "./globals.css";
import { cn } from "@/lib/utils";

const gellix = localFont({
	src: [
		{ path: "../public/fonts/Gellix-TRIAL-SemiBold.woff2", weight: "600" },
		{ path: "../public/fonts/Gellix-TRIAL-Bold.woff2", weight: "700" },
	],
	variable: "--font-display",
	display: "swap",
	preload: true,
	fallback: ["'Gellix Fallback'", "system-ui", "sans-serif"],
});

const saans = localFont({
	src: [
		{ path: "../public/fonts/Saans-TRIAL-Regular.woff2", weight: "400" },
		{ path: "../public/fonts/Saans-TRIAL-Medium.woff2", weight: "500" },
		{ path: "../public/fonts/Saans-TRIAL-SemiBold.woff2", weight: "600" },
		{ path: "../public/fonts/Saans-TRIAL-Bold.woff2", weight: "700" },
	],
	variable: "--font-sans",
	display: "swap",
	preload: true,
	fallback: ["system-ui", "sans-serif"],
});

const fontMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
});

export const metadata: Metadata = {
	title: "Avela — Make your tokenized stocks your everyday spend",
	description:
		"One programmable account to hold tokenized stocks, unlock spending power, and pay across commerce. Built on X Layer.",
	metadataBase: new URL("https://useavela.xyz"),
	openGraph: {
		title: "Avela — Programmable Spending Account",
		description:
			"Pay from your tokenized stock portfolio without selling. Positions stay locked; the reserve settles every payment.",
		url: "https://useavela.xyz",
		siteName: "Avela",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Avela — Programmable Spending Account",
		description: "Pay from your tokenized stock portfolio without selling.",
	},
};

export const viewport: Viewport = {
	themeColor: "#0a0a0a",
	width: "device-width",
	initialScale: 1,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={cn("antialiased", fontMono.variable, "font-sans", saans.variable, gellix.variable)}
		>
			<body>{children}</body>
		</html>
	);
}
