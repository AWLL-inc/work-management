import { eq, ne } from "drizzle-orm";
import { type NewUser, type User, users } from "@/drizzle/schema";
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
    passwordResetRequired: users.passwordResetRequired,
    passwordResetToken: users.passwordResetToken,
    passwordResetTokenExpires: users.passwordResetTokenExpires,
    lastPasswordChange: users.lastPasswordChange,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  };

  const baseQuery = db.select(selectFields).from(users);

  // Return all users (including inactive if activeOnly is false)
  if (activeOnly) {
    // Filter out users with 'inactive' role
    return await baseQuery
      .where(ne(users.role, "inactive"))
      .orderBy(users.name);
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
      passwordResetRequired: users.passwordResetRequired,
      passwordResetToken: users.passwordResetToken,
      passwordResetTokenExpires: users.passwordResetTokenExpires,
      lastPasswordChange: users.lastPasswordChange,
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
      passwordResetRequired: users.passwordResetRequired,
      passwordResetToken: users.passwordResetToken,
      passwordResetTokenExpires: users.passwordResetTokenExpires,
      lastPasswordChange: users.lastPasswordChange,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user;
}

/**
 * Create a new user
 * @param userData User data
 * @returns Created user
 */
export async function createUser(userData: NewUser): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return user;
}

/**
 * Update user by ID
 * @param id User ID
 * @param userData Partial user data to update
 * @returns Updated user or undefined
 */
export async function updateUser(
  id: string,
  userData: Partial<NewUser>,
): Promise<User | undefined> {
  const [user] = await db
    .update(users)
    .set({
      ...userData,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  return user;
}
