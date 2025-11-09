import type { DefaultSession } from "next-auth";

/**
 * Extend NextAuth.js types to include custom user properties
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      passwordResetRequired?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    passwordResetRequired?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    passwordResetRequired?: boolean;
  }
}
