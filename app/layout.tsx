import type React from "react"
import { Pacifico, Inter } from "next/font/google"
import "./globals.css"

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pacifico",
})

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata = {
  title: "Funny Rolls - Get Your Giggle and Your Swirl!",
  description:
    "Delicious cinnamon rolls that will make you laugh and crave more. Order now for the perfect sweet treat!",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${pacifico.variable} ${inter.variable} antialiased`}>
      <body>{children}</body>
    </html>
  )
}
