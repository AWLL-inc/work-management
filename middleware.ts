import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth-config";
import { routing } from "./i18n/routing";

/**
 * Combined middleware for internationalization and authentication
 * 1. Handles locale via cookies (not in URL path)
 * 2. Protects routes that require authentication
 */

// Create the internationalization middleware with cookie-based locale
const intlMiddleware = createMiddleware(routing);

// Combined middleware function
export default async function middleware(request: NextRequest) {
  // Check if the request is for API routes (no locale handling needed)
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // biome-ignore lint/suspicious/noExplicitAny: NextAuth requires any type for middleware
    return auth(request as any);
  }

  // Handle internationalization with cookie-based locale
  const intlResponse = intlMiddleware(request);

  // Apply authentication after i18n processing
  // biome-ignore lint/suspicious/noExplicitAny: NextAuth requires any type for middleware
  const authResponse = await auth(request as any);

  // If auth returns a response (like a redirect), handle it
  if (authResponse instanceof NextResponse) {
    // If we have both responses, preserve locale cookie from intl response
    if (intlResponse) {
      const localeCookie = intlResponse.headers.get("set-cookie");
      if (localeCookie?.includes("locale=")) {
        authResponse.headers.set("set-cookie", localeCookie);
      }
    }
    return authResponse;
  }

  // Return intl response if available, otherwise pass through
  return intlResponse || NextResponse.next();
}

/**
 * Matcher configuration for middleware
 * Runs on all routes except static files and API routes that don't need locale handling
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
