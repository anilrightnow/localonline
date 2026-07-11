export const APP_BRAND = "LocalOnline";

export function appPageTitle(title?: string | null): string {
  const clean = title?.trim();
  if (clean) return `${clean} | ${APP_BRAND}`;
  return APP_BRAND;
}
