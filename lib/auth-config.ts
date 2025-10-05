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
    signOut: "/",
    error: "/login",
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
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnWorkLogs = nextUrl.pathname.startsWith("/work-logs");
      const isOnProtectedApi = ["/api/work-logs", "/api/projects"].some(
        (route) => nextUrl.pathname.startsWith(route),
      );

      if (isOnDashboard || isOnWorkLogs || isOnProtectedApi) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      if (isLoggedIn && nextUrl.pathname === "/login") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
  providers: [], // Providers are added in auth.ts
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Required for Vercel deployment
};

export const { auth } = NextAuth(authConfig);
