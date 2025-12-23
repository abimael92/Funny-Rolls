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
    title: "Funny Rolls - Risas y Rollos de Canela",
    description:
      "Deliciosos rollos de canela que te harán reír y querer más. ¡Ordénalos ahora y disfruta el antojo perfecto!",
    icons: {
    icon: [
      { url: '/favicon/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon/favicon-16x16.png', type: 'image/png', sizes: '16x16' }
    ],
    apple: '/favicon/apple-touch-icon.png',
    shortcut: '/favicon/favicon.ico',
  },
  manifest: '/favicon/site.webmanifest'
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
