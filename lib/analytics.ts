type AnalyticsEventPayload = Record<string, unknown>;

type AnalyticsEvent = {
  eventType: string;
  cid?: string | null;
  source?: string | null;
  payload?: AnalyticsEventPayload | null;
};

export function trackAnalyticsEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  if (!event?.eventType) return;
  try {
    const apiBaseUrl = getApiBaseUrl();
    const endpoint = `${apiBaseUrl}/api/analytics/track`;
    const body = JSON.stringify({
      eventType: event.eventType,
      cid: event.cid ?? null,
      source: event.source ?? "frontend",
      payload: event.payload ?? {},
    });
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob);
      return;
    }
    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // best-effort tracking only
  }
}
import { getApiBaseUrl } from "./publicApi";
