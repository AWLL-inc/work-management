import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth-config";
import { routing } from "./i18n/routing";

/**
 * Combined middleware for internationalization and authentication
 *
 * Best Practice (Next.js 15 + NextAuth.js v5):
 * 1. Use auth() wrapper for route protection
 * 2. Keep route logic clear and in one place
 * 3. Apply i18n middleware for all routes
 */

// Create the internationalization middleware with cookie-based locale
const intlMiddleware = createMiddleware(routing);

// Define public paths that don't require authentication
const PUBLIC_PATHS = ["/api/health", "/login", "/auth/error"];

/**
 * Check if a path is public (doesn't require authentication)
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * Check if a path is an API route
 */
function isApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

/**
 * Add pathname to request headers for server components
 */
function addPathnameHeader(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

/**
 * Merge locale cookie from i18n response to auth response
 */
function mergeLocaleCookie(
  authResponse: NextResponse,
  intlResponse: NextResponse | null,
): NextResponse {
  if (!intlResponse) return authResponse;

  const localeCookie = intlResponse.headers.get("set-cookie");
  if (localeCookie?.includes("locale=")) {
    const existingCookies = authResponse.headers.get("set-cookie");
    if (!existingCookies?.includes("locale=")) {
      authResponse.headers.append("set-cookie", localeCookie);
    }
  }

  return authResponse;
}

// Export auth-wrapped middleware
export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // Apply i18n middleware for all non-API routes
  const intlResponse = isApiPath(pathname)
    ? null
    : intlMiddleware(req as NextRequest);

  // API Documentation access control
  // Block /api-docs and /api/openapi in production unless explicitly enabled
  if (pathname.includes("/api-docs") || pathname === "/api/openapi") {
    // In production, block access unless ENABLE_API_DOCS is set
    if (
      process.env.NODE_ENV === "production" &&
      process.env.ENABLE_API_DOCS !== "true"
    ) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // In development or when enabled, require admin role
    if (!req.auth || req.auth.user.role !== "admin") {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin user: allow access
    const response = intlResponse || NextResponse.next();
    return addPathnameHeader(req as NextRequest, response);
  }

  // Public paths: allow access
  if (isPublicPath(pathname)) {
    const response = intlResponse || NextResponse.next();
    return addPathnameHeader(req as NextRequest, response);
  }

  // Protected paths: check authentication
  if (!req.auth) {
    // Redirect unauthenticated users to login
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    return addPathnameHeader(req as NextRequest, response);
  }

  // Redirect authenticated users from /login to home
  if (pathname === "/login") {
    const response = NextResponse.redirect(new URL("/", req.nextUrl.origin));
    return addPathnameHeader(req as NextRequest, response);
  }

  // Authenticated: merge i18n and continue
  const response = intlResponse || NextResponse.next();
  const mergedResponse = mergeLocaleCookie(response, intlResponse);
  return addPathnameHeader(req as NextRequest, mergedResponse);
});

/**
 * Matcher configuration for middleware
 * Runs on all routes except static files and specific file types
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
