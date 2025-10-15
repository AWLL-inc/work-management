import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth-config";
import { routing } from "./i18n/routing";

/**
 * Combined middleware for internationalization and authentication
 *
 * Architecture:
 * 1. Handles locale via cookies (not in URL path)
 * 2. Protects routes that require authentication
 * 3. Applies middlewares in order: i18n first, then auth
 */

// Create the internationalization middleware with cookie-based locale
const intlMiddleware = createMiddleware(routing);

// Define public paths that don't require authentication
const PUBLIC_PATHS = [
  "/api/health",
  "/login",
  "/auth/signin",
  "/auth/signup",
  "/auth/error",
];

// Define API paths that bypass i18n middleware
const API_PATHS = ["/api/"];

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
  return API_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * Merge response headers from two NextResponse objects
 * Prioritizes cookies from the second response if both exist
 */
function mergeResponses(
  intlResponse: NextResponse | null,
  authResponse: NextResponse | null,
): NextResponse {
  // If only one response exists, return it
  if (!intlResponse) return authResponse || NextResponse.next();
  if (!authResponse) return intlResponse;

  // Both responses exist - merge headers
  const mergedResponse = authResponse;

  // Extract locale cookie from intl response
  const localeCookie = intlResponse.headers.get("set-cookie");
  if (localeCookie?.includes("locale=")) {
    const existingCookies = mergedResponse.headers.get("set-cookie");

    // Only add locale cookie if it doesn't already exist
    if (!existingCookies?.includes("locale=")) {
      // Use append() for multiple cookies instead of string concatenation
      mergedResponse.headers.append("set-cookie", localeCookie);
    }
  }

  return mergedResponse;
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

// Combined middleware function
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes: skip i18n, apply auth only
  if (isApiPath(pathname)) {
    // Skip auth for public API endpoints
    if (isPublicPath(pathname)) {
      const response = NextResponse.next();
      return addPathnameHeader(request, response);
    }
    // Apply auth for protected API routes
    // biome-ignore lint/suspicious/noExplicitAny: NextAuth requires any type for middleware
    const authResponse = await auth(request as any);
    return addPathnameHeader(
      request,
      authResponse instanceof NextResponse ? authResponse : NextResponse.next(),
    );
  }

  // Apply i18n middleware first (for all non-API routes)
  const intlResponse = intlMiddleware(request);

  // Public paths: only apply i18n
  if (isPublicPath(pathname)) {
    const response = intlResponse || NextResponse.next();
    return addPathnameHeader(request, response);
  }

  // Protected paths: apply both i18n and auth
  // biome-ignore lint/suspicious/noExplicitAny: NextAuth requires any type for middleware
  const authResponse = await auth(request as any);

  // Merge responses to preserve both locale and auth headers
  const mergedResponse = mergeResponses(
    intlResponse,
    authResponse instanceof NextResponse ? authResponse : null,
  );

  return addPathnameHeader(request, mergedResponse);
}

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
