import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const isDev = process.env.NODE_ENV !== "production";

// Next.js's own dev-mode Fast Refresh runtime relies on eval(), so script-src
// needs 'unsafe-eval' outside production. 'unsafe-inline' and https: are kept
// only as a fallback for browsers that don't support nonces — any browser that
// does ignores them in favor of the nonce/strict-dynamic sources.
const buildCsp = (nonce: string) => {
  const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https:${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
    `img-src 'self' blob: data: ${supabaseOrigin}`,
    `font-src 'self'`,
    `connect-src 'self' ${supabaseOrigin}`,
    `frame-src 'self' ${supabaseOrigin}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
};

export const updateSession = async (request: NextRequest) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
  supabaseResponse.headers.set("Content-Security-Policy", csp);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          supabaseResponse.headers.set("Content-Security-Policy", csp);
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.headers.set("Content-Security-Policy", csp);
    return redirectResponse;
  }

  return supabaseResponse;
};
