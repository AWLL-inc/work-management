import { auth } from "@/lib/auth-config";

/**
 * NextAuth.js v5 Middleware
 * Protects routes that require authentication
 * Uses auth-config.ts for Edge Runtime compatibility
 *
 * @see https://authjs.dev/getting-started/session-management/protecting
 */
export default auth;

/**
 * Matcher configuration for middleware
 * Runs on all routes except static files
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
