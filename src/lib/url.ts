import { NextRequest } from "next/server";

/**
 * Absolute origin of the incoming request, e.g. "https://admin.example.com".
 *
 * Used for links that leave the app — a CSV opened in Excel has no page to
 * resolve a relative path against, so "/api/..." would not be clickable.
 *
 * The request's own host is preferred over NEXT_PUBLIC_APP_URL: the admin is
 * clicking from whatever host they are signed in on, and a stale env var
 * (pointing at localhost, say) would produce links that go nowhere.
 */
export function requestOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");

  if (host) {
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host);
    const proto = request.headers.get("x-forwarded-proto") || (isLocal ? "http" : "https");
    return `${proto}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
}
