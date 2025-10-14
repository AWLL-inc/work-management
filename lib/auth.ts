import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { users } from "@/drizzle/schema";
import { db } from "@/lib/db/connection";
import { authConfig } from "./auth-config";

/**
 * NextAuth.js v5 Configuration with Database
 * This file includes database connections and providers
 * Use this in API routes (Node.js runtime)
 * For middleware, use auth-config.ts instead
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  // @ts-expect-error NextAuth v5 beta type compatibility issue with DrizzleAdapter
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Find user by email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash,
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // Return user object (without password hash)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
});
