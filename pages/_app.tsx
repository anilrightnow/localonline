import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import "../index.css";
import { trackAnalyticsEvent } from "../lib/analytics";
import { useApiHealth } from "../lib/useApiHealth";

const isGoogleAdsEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ENABLED === "true";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { isHealthy } = useApiHealth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect to maintenance page if API is down (but not if already on maintenance page)
  useEffect(() => {
    if (!isMounted || isMounted === null) return;

    // If we explicitly know the API is down (isHealthy === false), redirect
    if (isHealthy === false && router.pathname !== "/maintenance") {
      router.push("/maintenance").catch(() => {
        // Silently handle navigation errors
      });
    }

    // If we're on maintenance page and API is healthy again, redirect to home
    if (isHealthy === true && router.pathname === "/maintenance") {
      router.push("/").catch(() => {
        // Silently handle navigation errors
      });
    }
  }, [isHealthy, router.pathname, isMounted]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTheme = document.cookie
      .split("; ")
      .find((row) => row.startsWith("theme="))
      ?.split("=")[1];
    document.body.classList.toggle("theme-dark", savedTheme === "dark");

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
        <meta name="application-name" content="Local Online" />
        <meta name="apple-mobile-web-app-title" content="Local Online" />
        <meta name="theme-color" content="#0f766e" />
        {isGoogleAdsEnabled && (
          <meta
            name="google-adsense-account"
            content="ca-pub-8129203343952744"
          />
        )}
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <Script id="trusted-types" strategy="beforeInteractive">
        {`
          if (window.trustedTypes && window.trustedTypes.createPolicy) {
            try {
              window.trustedTypes.createPolicy('default', {
                createHTML: (input) => input,
                createScript: (input) => input,
                createScriptURL: (input) => input,
              });
            } catch (err) {
              // ignore if policy already exists
            }
          }
        `}
      </Script>
      {isGoogleAdsEnabled && (
        <>
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
        </>
      )}
      <Component {...pageProps} />
    </>
  );
}
