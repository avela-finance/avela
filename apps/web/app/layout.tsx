import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { Providers } from "@/components/providers"
import { cn } from "@/lib/utils";

const geistMonoHeading = Geist_Mono({subsets:['latin'],variable:'--font-heading'});

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: "Avela",
  description: "Pay from your portfolio without selling",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable, geistMonoHeading.variable)}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
