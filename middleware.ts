import { auth } from "@/lib/auth-config";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Combined middleware for internationalization and authentication
 * 1. Handles locale routing with next-intl
 * 2. Protects routes that require authentication
 */

// Create the internationalization middleware
const intlMiddleware = createMiddleware(routing);

// Combined middleware function
export default function middleware(request: NextRequest) {
  // Check if the request is for API routes (no locale handling needed)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return auth(request as any);
  }

  // Handle internationalization first
  const intlResponse = intlMiddleware(request);
  
  // If intl middleware returns a response (redirect), use it
  if (intlResponse && intlResponse.headers.get('location')) {
    return intlResponse;
  }

  // For localized routes, apply authentication
  const locale = request.nextUrl.pathname.split('/')[1];
  if (routing.locales.includes(locale as any)) {
    // Apply auth middleware to localized routes
    return auth(request as any);
  }

  // Default response for other cases
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
