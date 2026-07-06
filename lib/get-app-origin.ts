import { headers } from "next/headers";

/** Builds the app's origin from the incoming request — avoids a separate hardcoded site-url env var. */
export const getAppOrigin = async () => {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
};
