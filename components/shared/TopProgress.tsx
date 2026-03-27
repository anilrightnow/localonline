import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function TopProgress() {
  const router = useRouter();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const onStart = () => setCount((c) => c + 1);
    const onDone = () => setCount((c) => Math.max(0, c - 1));
    const onLoading = (event: Event) => {
      const detail = (event as CustomEvent<{ active?: boolean }>).detail;
      if (detail?.active) {
        setCount((c) => c + 1);
      } else {
        setCount((c) => Math.max(0, c - 1));
      }
    };

    router.events.on("routeChangeStart", onStart);
    router.events.on("routeChangeComplete", onDone);
    router.events.on("routeChangeError", onDone);
    window.addEventListener("app:loading", onLoading as EventListener);

    return () => {
      router.events.off("routeChangeStart", onStart);
      router.events.off("routeChangeComplete", onDone);
      router.events.off("routeChangeError", onDone);
      window.removeEventListener("app:loading", onLoading as EventListener);
    };
  }, [router.events]);

  return <div className={`top-progress${count > 0 ? " is-active" : ""}`} aria-hidden="true" />;
}
