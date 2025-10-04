import { db } from "@/lib/db/connection";
import {
  workCategories,
  type WorkCategory,
  type NewWorkCategory,
} from "@/drizzle/schema";
import { eq, and, asc } from "drizzle-orm";

/**
 * Work Category Repository
 * Handles all database operations for work categories
 */

/**
 * Get all work categories with optional filtering
 * @param options Filter options
 * @returns Array of work categories sorted by display_order
 */
export async function getAllWorkCategories(options?: {
  activeOnly?: boolean;
}): Promise<WorkCategory[]> {
  const { activeOnly = false } = options || {};

  if (activeOnly) {
    return await db
      .select()
      .from(workCategories)
      .where(eq(workCategories.isActive, true))
      .orderBy(asc(workCategories.displayOrder), asc(workCategories.name));
  }

  return await db
    .select()
    .from(workCategories)
    .orderBy(asc(workCategories.displayOrder), asc(workCategories.name));
}

/**
 * Get work category by ID
 * @param id Work category ID
 * @returns Work category or undefined
 */
export async function getWorkCategoryById(
  id: string
): Promise<WorkCategory | undefined> {
  const [category] = await db
    .select()
    .from(workCategories)
    .where(eq(workCategories.id, id))
    .limit(1);

  return category;
}

/**
 * Get work category by name
 * @param name Work category name
 * @returns Work category or undefined
 */
export async function getWorkCategoryByName(
  name: string
): Promise<WorkCategory | undefined> {
  const [category] = await db
    .select()
    .from(workCategories)
    .where(eq(workCategories.name, name))
    .limit(1);

  return category;
}

/**
 * Create a new work category
 * @param data Work category data
 * @returns Created work category
 */
export async function createWorkCategory(
  data: Omit<NewWorkCategory, "id" | "createdAt" | "updatedAt">
): Promise<WorkCategory> {
  const [category] = await db
    .insert(workCategories)
    .values(data)
    .returning();

  return category;
}

/**
 * Update a work category
 * @param id Work category ID
 * @param data Updated work category data
 * @returns Updated work category or undefined
 */
export async function updateWorkCategory(
  id: string,
  data: Partial<Omit<NewWorkCategory, "id" | "createdAt" | "updatedAt">>
): Promise<WorkCategory | undefined> {
  const [category] = await db
    .update(workCategories)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(workCategories.id, id))
    .returning();

  return category;
}

/**
 * Delete a work category (soft delete - set isActive to false)
 * @param id Work category ID
 * @returns Deleted work category or undefined
 */
export async function deleteWorkCategory(
  id: string
): Promise<WorkCategory | undefined> {
  const [category] = await db
    .update(workCategories)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(workCategories.id, id))
    .returning();

  return category;
}

/**
 * Check if work category name exists (for duplicate checking)
 * @param name Work category name
 * @param excludeId Optional ID to exclude from check (for updates)
 * @returns True if name exists
 */
export async function workCategoryNameExists(
  name: string,
  excludeId?: string
): Promise<boolean> {
  const conditions = excludeId
    ? and(eq(workCategories.name, name), eq(workCategories.id, excludeId))
    : eq(workCategories.name, name);

  const [existing] = await db
    .select({ id: workCategories.id })
    .from(workCategories)
    .where(conditions)
    .limit(1);

  return !!existing;
}
