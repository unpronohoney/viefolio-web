import { NextRequest, NextResponse } from "next/server";

/* ─── Base domains ───────────────────────────────────── */
const BASE_DOMAINS = [
  "localhost:3000",    // dev
  "viefolio.com",      // production (bare domain)
  "www.viefolio.com",  // www redirect
];

/* ─── System paths to skip ──────────────────────────── */
const SYSTEM_PREFIXES = ["/_next", "/api", "/static", "/favicon.ico", "/portfolio"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip system/internal paths
  if (SYSTEM_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Determine the base domain from the request
  const host = request.headers.get("host") ?? "";
  const baseDomain = BASE_DOMAINS.find((d) => host.endsWith(d));

  if (!baseDomain) return NextResponse.next();

  // Extract subdomain (e.g., "mirza" from "mirza.viefolio.com" or "mirza.localhost:3000")
  const subdomain = host.replace(`.${baseDomain}`, "");

  // If there's no subdomain (i.e., it's the base domain itself), pass through
  if (!subdomain || subdomain === host || subdomain === "www") {
    return NextResponse.next();
  }

  // Validate subdomain format (lowercase alphanumeric + dashes, 1-20 chars)
  if (!/^[a-z0-9][a-z0-9-]{0,18}[a-z0-9]?$/.test(subdomain)) {
    return NextResponse.next();
  }

  // Rewrite to the dynamic portfolio route
  const url = request.nextUrl.clone();
  url.pathname = `/portfolio/${subdomain}${pathname === "/" ? "" : pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
