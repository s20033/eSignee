import { headers } from "next/headers";

/**
 * Builds the app's origin. Prefers NEXT_PUBLIC_SITE_URL when set (an explicit
 * manual override), then VERCEL_PROJECT_PRODUCTION_URL — a stable domain
 * Vercel sets automatically on every deployment, pointing at the current
 * production alias rather than the ephemeral per-deployment URL. Relying on
 * request headers alone can bake an ephemeral preview-deployment host into a
 * signed PDF's QR code; once that deployment is superseded, scanning it
 * returns Vercel's DEPLOYMENT_NOT_FOUND. Falls back to request headers only
 * for local dev, where neither env var is set.
 */
export const getAppOrigin = async () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
};
