import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import "../index.css";
import { trackAnalyticsEvent } from "../lib/analytics";

const isGoogleAdsEnabled =
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
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@9..96,800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap"
          as="style"
        />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@9..96,800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@9..96,800&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root {
            --midnight: #0A0A0C;
            --surface: #16161A;
            --marigold: #FFB800;
            --emerald: #10B981;
            --border: #27272A;
          }
          body {
            background-color: var(--midnight);
            color: #E4E4E7;
            font-family: 'Plus Jakarta Sans', sans-serif;
            line-height: 1.6;
          }
          h1, h2, h3, .pub-title {
            font-family: 'Bricolage Grotesque', sans-serif;
            font-weight: 800;
            letter-spacing: -0.03em;
            text-transform: uppercase;
          }
          .pub-card, section, .section-card-inner {
            background-color: var(--surface) !important;
            border-radius: 16px !important;
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
