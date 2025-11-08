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
const PUBLIC_PATHS = [
  "/api/health",
  "/login",
  "/auth/error",
  "/forgot-password",
  "/reset-password",
];

// Paths that are allowed when password reset is required
const PASSWORD_RESET_ALLOWED_PATHS = ["/change-password", "/api/auth"];

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
  if (localeCookie?.includes("NEXT_LOCALE=")) {
    const existingCookies = authResponse.headers.get("set-cookie");
    if (!existingCookies?.includes("NEXT_LOCALE=")) {
      authResponse.headers.append("set-cookie", localeCookie);
    }
  }

  return authResponse;
}

/**
 * Middleware handler type for processing requests
 */
type MiddlewareHandler = (
  req: Parameters<Parameters<typeof auth>[0]>[0],
  intlResponse: NextResponse | null,
) => NextResponse | null;

/**
 * Handle API documentation access control
 * Requires admin authentication for /api-docs and /api/openapi
 */
function handleApiDocsAccess(
  req: Parameters<Parameters<typeof auth>[0]>[0],
  intlResponse: NextResponse | null,
): NextResponse | null {
  const pathname = req.nextUrl.pathname;
  const isApiDocsPath =
    pathname.includes("/api-docs") || pathname === "/api/openapi";

  if (!isApiDocsPath) return null;

  // 1. Check authentication and admin role
  if (!req.auth || req.auth.user.role !== "admin") {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return addPathnameHeader(
      req as NextRequest,
      NextResponse.redirect(loginUrl),
    );
  }

  // 2. Production environment: check if API docs are explicitly enabled
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_API_DOCS !== "true"
  ) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 3. Admin user with enabled API docs: allow access
  const response = intlResponse || NextResponse.next();
  return addPathnameHeader(req as NextRequest, response);
}

/**
 * Handle public paths that don't require authentication
 */
function handlePublicPaths(
  req: Parameters<Parameters<typeof auth>[0]>[0],
  intlResponse: NextResponse | null,
): NextResponse | null {
  const pathname = req.nextUrl.pathname;

  if (!isPublicPath(pathname)) return null;

  const response = intlResponse || NextResponse.next();
  return addPathnameHeader(req as NextRequest, response);
}

/**
 * Handle authentication for protected paths
 */
function handleAuthentication(
  req: Parameters<Parameters<typeof auth>[0]>[0],
  _intlResponse: NextResponse | null,
): NextResponse | null {
  const pathname = req.nextUrl.pathname;

  // If not authenticated, redirect to login
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    return addPathnameHeader(req as NextRequest, response);
  }

  // If authenticated and on /login, redirect to home
  if (pathname === "/login") {
    const response = NextResponse.redirect(new URL("/", req.nextUrl.origin));
    return addPathnameHeader(req as NextRequest, response);
  }

  return null;
}

/**
 * Handle forced password change redirect
 * If user has passwordResetRequired flag, redirect to change-password page
 */
function handlePasswordResetRequired(
  req: Parameters<Parameters<typeof auth>[0]>[0],
  _intlResponse: NextResponse | null,
): NextResponse | null {
  const pathname = req.nextUrl.pathname;

  // Skip if user is not authenticated
  if (!req.auth) return null;

  // Skip if user doesn't need password reset
  if (!req.auth.user.passwordResetRequired) return null;

  // Allow access to password reset allowed paths
  const isAllowedPath = PASSWORD_RESET_ALLOWED_PATHS.some((path) =>
    pathname.startsWith(path),
  );
  if (isAllowedPath) return null;

  // Redirect to change-password page
  const changePasswordUrl = new URL("/change-password", req.nextUrl.origin);
  const response = NextResponse.redirect(changePasswordUrl);
  return addPathnameHeader(req as NextRequest, response);
}

// Export auth-wrapped middleware with handler chain
export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // Apply i18n middleware for all non-API routes
  const intlResponse = isApiPath(pathname)
    ? null
    : intlMiddleware(req as NextRequest);

  // Process middleware handlers in order
  const handlers: MiddlewareHandler[] = [
    handleApiDocsAccess,
    handlePublicPaths,
    handleAuthentication,
    handlePasswordResetRequired,
  ];

  for (const handler of handlers) {
    const response = handler(req, intlResponse);
    if (response) return response;
  }

  // Default: Authenticated user, allow access with i18n
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
