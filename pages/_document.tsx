/**
 * Minimal _document for Next.js module resolution.
 * This project uses App Router (app/); document structure is in app/layout.tsx.
 * This file exists only to satisfy "Cannot find module for page: /_document" when
 * something (e.g. Turbopack or build) still requests the Pages Router _document module.
 */
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
