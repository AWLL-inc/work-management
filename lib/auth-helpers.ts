import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { NewUser } from "@/drizzle/schema";
import { users } from "@/drizzle/schema";
import { db } from "@/lib/db/connection";

/**
 * Authentication Helper Functions
 */

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param password Plain text password
 * @param hash Hashed password
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a new user with hashed password
 * @param userData User data including plain text password
 * @returns Created user (without password hash)
 */
export async function createUser(
  userData: Omit<NewUser, "passwordHash"> & { password: string },
) {
  const { password, ...rest } = userData;

  // Hash password
  const passwordHash = await hashPassword(password);

  // Insert user
  const [newUser] = await db
    .insert(users)
    .values({
      ...rest,
      passwordHash,
    })
    .returning();

  // Return user without password hash
  const { passwordHash: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

/**
 * Get user by email
 * @param email User email
 * @returns User or null
 */
export async function getUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user || null;
}

/**
 * Get user by id
 * @param id User ID
 * @returns User or null
 */
export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return user || null;
}

/**
 * Check if user has required role
 * @param userRole User's role
 * @param requiredRole Required role ('admin', 'manager', 'user')
 * @returns True if user has required role or higher
 */
export function hasRole(
  userRole: string,
  requiredRole: "admin" | "manager" | "user",
): boolean {
  const roleHierarchy = {
    admin: 3,
    manager: 2,
    user: 1,
  };

  return (
    roleHierarchy[userRole as keyof typeof roleHierarchy] >=
    roleHierarchy[requiredRole]
  );
}
