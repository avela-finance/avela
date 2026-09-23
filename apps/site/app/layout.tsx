import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { cn } from "@/lib/utils";

const geistMonoHeading = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-heading",
});

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
});

export const metadata: Metadata = {
	title: "Avela — Make your tokenized stocks your everyday spend",
	description:
		"One programmable account to hold tokenized stocks, unlock spending power, and pay across commerce. Built on X Layer.",
	metadataBase: new URL("https://avela.xyz"),
	openGraph: {
		title: "Avela — Programmable Spending Account",
		description:
			"Pay from your tokenized stock portfolio without selling. Every payment is a market order on X Layer.",
		url: "https://avela.xyz",
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
			className={cn(
				"dark antialiased",
				fontMono.variable,
				"font-sans",
				geist.variable,
				geistMonoHeading.variable,
			)}
		>
			<body>{children}</body>
		</html>
	);
}
