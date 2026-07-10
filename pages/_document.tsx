import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Self-hosted fonts — loaded in the document head so it is part of
            the initial HTML (no FOUC). See /public/fonts/fonts.css */}
        <link rel="stylesheet" href="/fonts/fonts.css" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
