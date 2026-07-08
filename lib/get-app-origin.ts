import { headers } from "next/headers";

/**
 * Builds the app's origin. Prefers NEXT_PUBLIC_SITE_URL when set — a fixed,
 * known-correct value for production (e.g. behind a proxy/CDN layer where
 * forwarded headers can't always be trusted) — and falls back to deriving it
 * from the incoming request otherwise, so local dev needs no extra config.
 */
export const getAppOrigin = async () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
};
