import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import "../index.css";
import { trackAnalyticsEvent } from "../lib/analytics";
import "../lib/authRefresh";

// Only load Google Ads / Analytics in production. These third-party scripts
// communicate via postMessage and run heavy synchronous work, which triggers
// Chrome's "[Violation] 'message' handler took …ms" long-task warning in dev.
// Keeping them out of local development removes that noise.
const isGoogleAdsEnabled =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ENABLED === "true";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "1";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (maintenanceMode && router.pathname !== "/maintenance") {
      router.push("/maintenance").catch(() => {});
    } else if (!maintenanceMode && router.pathname === "/maintenance") {
      router.push("/").catch(() => {});
    }
  }, [maintenanceMode, router.pathname, isMounted, router]);

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
        {/* Self-hosted fonts are declared in /public/fonts/fonts.css and loaded
            via the document <head> (see _document.tsx). We intentionally do NOT
            preload them here: this SPA hydrates after the window load event, so
            preloaded fonts would be flagged as unused by the browser. The
            @font-face rules are discovered during HTML parse, so they still
            load quickly without the preload console warnings. */}
        {/* Speed up delivery of Cloudinary-hosted business images */}
        <link
          rel="preconnect"
          href="https://res.cloudinary.com"
          crossOrigin="anonymous"
        />
        <style>{`
          body {
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
          }
          h1, h2, h3, .pub-title {
            font-family: 'Bricolage Grotesque', 'Plus Jakarta Sans', system-ui, sans-serif;
            font-weight: 800;
            letter-spacing: -0.03em;
            text-transform: uppercase;
          }
        `}</style>
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
        <Script
          id="google-adsense"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8129203343952744"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}
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
