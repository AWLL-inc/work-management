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
    authorized({ auth }) {
      /**
       * Next.js 15 + NextAuth.js v5 Best Practice:
       * Keep authorized callback simple - only check authentication.
       * Route protection logic is handled in middleware.ts for better clarity.
       */
      const isDevelopment = process.env.NODE_ENV === "development";
      const isAuthDisabled = process.env.DISABLE_AUTH === "true";

      // Allow auth bypass in development mode only
      if (isDevelopment && isAuthDisabled) {
        return true;
      }

      // Return true if user is authenticated
      return !!auth?.user;
    },
  },
  providers: [], // Providers are added in auth.ts
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Required for Vercel deployment
};

export const { auth } = NextAuth(authConfig);
