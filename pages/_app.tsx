import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import "../index.css";
import { trackAnalyticsEvent } from "../lib/analytics";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const todayKey = `site_visit_${new Date().toISOString().slice(0, 10)}`;
    if (!localStorage.getItem(todayKey)) {
      localStorage.setItem(todayKey, "1");
      trackAnalyticsEvent({ eventType: "site_visit", source: "site" });
    }

    const track = (path: string) => {
      trackAnalyticsEvent({
        eventType: "page_view",
        source: "site",
        payload: { path },
      });
    };

    track(router.asPath || "/");
    router.events.on("routeChangeComplete", track);
    return () => {
      router.events.off("routeChangeComplete", track);
    };
  }, [router]);

  return (
    <>
      <Head>
        <meta name="application-name" content="LocalOnline" />
        <meta name="apple-mobile-web-app-title" content="LocalOnline" />
        <meta name="theme-color" content="#0f766e" />
        <link rel="icon" href="/favicon.png" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.png" />
      </Head>
      <Script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-Y671521B04"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-Y671521B04');
        `}
      </Script>
      <Component {...pageProps} />
    </>
  );
}
