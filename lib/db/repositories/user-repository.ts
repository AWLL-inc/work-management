import { eq, ne } from "drizzle-orm";
import { type User, users } from "@/drizzle/schema";
import { db } from "@/lib/db/connection";

/**
 * User Repository
 * Handles all database operations for users
 */

/**
 * Get all users with optional filtering
 * @param options Filter options
 * @returns Array of users
 */
export async function getAllUsers(options?: {
  activeOnly?: boolean;
}): Promise<User[]> {
  const { activeOnly = false } = options || {};

  const selectFields = {
    id: users.id,
    name: users.name,
    email: users.email,
    emailVerified: users.emailVerified,
    image: users.image,
    passwordHash: users.passwordHash,
    role: users.role,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  };

  const baseQuery = db.select(selectFields).from(users);

  // Return all users (including inactive if activeOnly is false)
  if (activeOnly) {
    // Filter out users with 'inactive' role
    return await baseQuery.where(ne(users.role, "inactive")).orderBy(users.name);
  }

  return await baseQuery.orderBy(users.name);
}

/**
 * Get user by ID
 * @param id User ID
 * @returns User or undefined
 */
export async function getUserById(id: string): Promise<User | undefined> {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
      image: users.image,
      passwordHash: users.passwordHash,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user;
}

/**
 * Get user by email
 * @param email User email
 * @returns User or undefined
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
      image: users.image,
      passwordHash: users.passwordHash,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user;
}
