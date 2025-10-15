import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";

/**
 * NextAuth.js v5 Edge-Compatible Configuration
 * This configuration doesn't import database connections
 * and can be used in Edge Runtime (middleware)
 */
export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt", // JWT strategy for Edge Runtime compatibility
  },
  pages: {
    signIn: "/login",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user role to token on sign in
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user role and id to session
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      // Check if authentication is disabled for development
      const isDevelopmentMode = process.env.NODE_ENV === "development";
      const isProduction = process.env.NODE_ENV === "production";
      const isAuthDisabled = process.env.DISABLE_AUTH === "true";

      // 本番環境では DISABLE_AUTH を絶対に許可しない
      if (isProduction && isAuthDisabled) {
        console.error(
          "SECURITY WARNING: DISABLE_AUTH is set in production environment - ignoring this setting",
        );
        // 本番環境では無視して認証を強制
      } else if (isDevelopmentMode && isAuthDisabled && !isProduction) {
        // 開発環境のみで認証バイパスを許可
        return true;
      }

      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/auth");

      // Allow access to auth pages for unauthenticated users
      if (isAuthPage) {
        if (isLoggedIn) {
          // Redirect authenticated users to root page
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      // Protect root page - redirect unauthenticated users to signin
      if (nextUrl.pathname === "/") {
        if (!isLoggedIn) {
          return Response.redirect(new URL("/login", nextUrl));
        }
        return true;
      }

      // Protect dashboard pages
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnWorkLogs = nextUrl.pathname.startsWith("/work-logs");
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnProtectedApi = ["/api/work-logs", "/api/projects"].some(
        (route) => nextUrl.pathname.startsWith(route),
      );

      if (isOnDashboard || isOnWorkLogs || isOnAdmin || isOnProtectedApi) {
        if (isLoggedIn) return true;
        // Redirect to signin with callback URL
        const callbackUrl = nextUrl.pathname + nextUrl.search;
        const signinUrl = new URL("/login", nextUrl);
        signinUrl.searchParams.set("callbackUrl", callbackUrl);
        return Response.redirect(signinUrl);
      }

      // Handle legacy login page redirect
      if (isLoggedIn && nextUrl.pathname === "/login") {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
  providers: [], // Providers are added in auth.ts
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Required for Vercel deployment
};

export const { auth } = NextAuth(authConfig);
