import { handlers } from "@/lib/auth";

/**
 * NextAuth.js v5 API Route Handler
 * Handles all authentication requests
 *
 * @see https://authjs.dev/getting-started/installation?framework=next.js
 */

// Use Node.js runtime for database operations
export const runtime = "nodejs";

export const { GET, POST } = handlers;
