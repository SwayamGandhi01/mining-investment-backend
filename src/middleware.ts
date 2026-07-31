import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge } from "@/lib/jwt";

// Routes that don't require authentication
const publicRoutes = [
  "/admin/login",
  "/api/auth/login",
  "/api/auth/seed",
];

// Routes that should be accessible without auth (public API endpoints — GET only)
const publicApiPrefixes = [
  "/api/events",
  "/api/speakers",
  "/api/sponsors",
  "/api/exhibitors",
  "/api/companies",
  "/api/blogs",
  "/api/gallery",
  "/api/newsflash",
  "/api/latest-news",
  "/api/agendas",
];

// Routes that allow all HTTP methods without auth (public form submission endpoints)
const publicPostApiPrefixes = [
  "/api/investor-registrations",
  "/api/company-registrations",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.some((route) => pathname === route)) {
    return NextResponse.next();
  }

  // Allow all methods on public form-submission API prefixes
  if (publicPostApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Allow GET requests to public API prefixes (read-only public access)
  if (
    request.method === "GET" &&
    publicApiPrefixes.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.next();
  }

  // Check authentication for admin routes and protected API routes
  const isAdminRoute = pathname.startsWith("/admin");
  const isApiRoute = pathname.startsWith("/api");

  if (isAdminRoute || isApiRoute) {
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      if (isAdminRoute) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify token using Edge-compatible jose library
    const payload = await verifyTokenEdge(token);

    if (!payload) {
      // Clear invalid token
      const response = isAdminRoute
        ? NextResponse.redirect(new URL("/admin/login", request.url))
        : NextResponse.json(
            { success: false, message: "Invalid or expired token" },
            { status: 401 }
          );

      response.cookies.delete("admin_token");
      return response;
    }

    // Attach user info to headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-admin-id", payload.id);
    requestHeaders.set("x-admin-email", payload.email);
    requestHeaders.set("x-admin-role", payload.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
