import type { Metadata } from "next";
import { Pacifico, Inter } from "next/font/google";
import { AuthProvider } from './providers/AuthProvider'
import "./globals.css";

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pacifico",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Funny Rolls - Risas y Rollos de Canela",
  description: "Deliciosos rollos de canela",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${pacifico.variable} ${inter.variable}`}>
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}