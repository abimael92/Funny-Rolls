/**
 * Minimal _app for Next.js Pages Router when pages/_document.tsx exists.
 * All routes are served by App Router (app/); this exists only so the
 * Pages Router pipeline resolves correctly during build.
 */
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
