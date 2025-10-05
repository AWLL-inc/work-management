import { and, eq } from "drizzle-orm";
import { type NewProject, type Project, projects } from "@/drizzle/schema";
import { db } from "@/lib/db/connection";

/**
 * Project Repository
 * Handles all database operations for projects
 */

/**
 * Get all projects with optional filtering
 * @param options Filter options
 * @returns Array of projects
 */
export async function getAllProjects(options?: {
  activeOnly?: boolean;
}): Promise<Project[]> {
  const { activeOnly = false } = options || {};

  if (activeOnly) {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.isActive, true))
      .orderBy(projects.name);
  }

  return await db.select().from(projects).orderBy(projects.name);
}

/**
 * Get project by ID
 * @param id Project ID
 * @returns Project or undefined
 */
export async function getProjectById(id: string): Promise<Project | undefined> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  return project;
}

/**
 * Get project by name
 * @param name Project name
 * @returns Project or undefined
 */
export async function getProjectByName(
  name: string,
): Promise<Project | undefined> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.name, name))
    .limit(1);

  return project;
}

/**
 * Create a new project
 * @param data Project data
 * @returns Created project
 */
export async function createProject(
  data: Omit<NewProject, "id" | "createdAt" | "updatedAt">,
): Promise<Project> {
  const [project] = await db.insert(projects).values(data).returning();

  return project;
}

/**
 * Update a project
 * @param id Project ID
 * @param data Updated project data
 * @returns Updated project or undefined
 */
export async function updateProject(
  id: string,
  data: Partial<Omit<NewProject, "id" | "createdAt" | "updatedAt">>,
): Promise<Project | undefined> {
  const [project] = await db
    .update(projects)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .returning();

  return project;
}

/**
 * Delete a project (soft delete - set isActive to false)
 * @param id Project ID
 * @returns Deleted project or undefined
 */
export async function deleteProject(id: string): Promise<Project | undefined> {
  const [project] = await db
    .update(projects)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .returning();

  return project;
}

/**
 * Check if project name exists (for duplicate checking)
 * @param name Project name
 * @param excludeId Optional ID to exclude from check (for updates)
 * @returns True if name exists
 */
export async function projectNameExists(
  name: string,
  excludeId?: string,
): Promise<boolean> {
  const conditions = excludeId
    ? and(eq(projects.name, name), eq(projects.id, excludeId))
    : eq(projects.name, name);

  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(conditions)
    .limit(1);

  return !!existing;
}
