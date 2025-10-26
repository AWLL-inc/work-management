import { and, count, desc, eq, gte, ilike, inArray, lte } from "drizzle-orm";
import {
  type NewWorkLog,
  projects,
  users,
  type WorkLog,
  workCategories,
  workLogs,
} from "@/drizzle/schema";
import { db } from "@/lib/db/connection";

/**
 * Work Log Repository
 * Handles all database operations for work logs
 */

export interface WorkLogWithRelations extends WorkLog {
  project: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface GetWorkLogsOptions {
  userId?: string; // Filter by user (if not admin)
  userIds?: string[]; // Filter by multiple users (for team scope)
  startDate?: Date;
  endDate?: Date;
  projectId?: string;
  projectIds?: string[]; // Multiple project filtering
  categoryId?: string;
  categoryIds?: string[]; // Multiple category filtering
  searchText?: string; // Full text search in details
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Get work logs with filtering and pagination
 */
export async function getWorkLogs(options: GetWorkLogsOptions = {}): Promise<{
  data: WorkLogWithRelations[];
  pagination: PaginationResult;
}> {
  const {
    userId,
    userIds,
    startDate,
    endDate,
    projectId,
    projectIds,
    categoryId,
    categoryIds,
    searchText,
    page = 1,
    limit = 20,
  } = options;

  // Build WHERE conditions
  const conditions = [];

  // User filtering - support both single and multiple
  if (userIds && userIds.length > 0) {
    conditions.push(inArray(workLogs.userId, userIds));
  } else if (userId) {
    conditions.push(eq(workLogs.userId, userId));
  }

  if (startDate) {
    conditions.push(gte(workLogs.date, startDate));
  }

  if (endDate) {
    conditions.push(lte(workLogs.date, endDate));
  }

  // Project filtering - support both single and multiple
  if (projectIds && projectIds.length > 0) {
    conditions.push(inArray(workLogs.projectId, projectIds));
  } else if (projectId) {
    conditions.push(eq(workLogs.projectId, projectId));
  }

  // Category filtering - support both single and multiple
  if (categoryIds && categoryIds.length > 0) {
    conditions.push(inArray(workLogs.categoryId, categoryIds));
  } else if (categoryId) {
    conditions.push(eq(workLogs.categoryId, categoryId));
  }

  // Full text search in details
  if (searchText) {
    conditions.push(ilike(workLogs.details, `%${searchText}%`));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(workLogs)
    .where(whereClause);

  // Get paginated data with relations
  const offset = (page - 1) * limit;
  const logs = await db
    .select({
      id: workLogs.id,
      userId: workLogs.userId,
      date: workLogs.date,
      hours: workLogs.hours,
      projectId: workLogs.projectId,
      categoryId: workLogs.categoryId,
      details: workLogs.details,
      createdAt: workLogs.createdAt,
      updatedAt: workLogs.updatedAt,
      project: {
        id: projects.id,
        name: projects.name,
      },
      category: {
        id: workCategories.id,
        name: workCategories.name,
      },
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(workLogs)
    .innerJoin(projects, eq(workLogs.projectId, projects.id))
    .innerJoin(workCategories, eq(workLogs.categoryId, workCategories.id))
    .innerJoin(users, eq(workLogs.userId, users.id))
    .where(whereClause)
    .orderBy(desc(workLogs.date), desc(workLogs.createdAt))
    .limit(limit)
    .offset(offset);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: logs as WorkLogWithRelations[],
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages,
    },
  };
}

/**
 * Get work log by ID with relations
 */
export async function getWorkLogById(
  id: string,
): Promise<WorkLogWithRelations | undefined> {
  const [log] = await db
    .select({
      id: workLogs.id,
      userId: workLogs.userId,
      date: workLogs.date,
      hours: workLogs.hours,
      projectId: workLogs.projectId,
      categoryId: workLogs.categoryId,
      details: workLogs.details,
      createdAt: workLogs.createdAt,
      updatedAt: workLogs.updatedAt,
      project: {
        id: projects.id,
        name: projects.name,
      },
      category: {
        id: workCategories.id,
        name: workCategories.name,
      },
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(workLogs)
    .innerJoin(projects, eq(workLogs.projectId, projects.id))
    .innerJoin(workCategories, eq(workLogs.categoryId, workCategories.id))
    .innerJoin(users, eq(workLogs.userId, users.id))
    .where(eq(workLogs.id, id))
    .limit(1);

  return log as WorkLogWithRelations | undefined;
}

/**
 * Create a new work log
 */
export async function createWorkLog(
  data: Omit<NewWorkLog, "id" | "createdAt" | "updatedAt">,
): Promise<WorkLog> {
  const [log] = await db.insert(workLogs).values(data).returning();

  return log;
}

/**
 * Update a work log
 */
export async function updateWorkLog(
  id: string,
  data: Partial<Omit<NewWorkLog, "id" | "createdAt" | "updatedAt">>,
): Promise<WorkLog | undefined> {
  const [log] = await db
    .update(workLogs)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(workLogs.id, id))
    .returning();

  return log;
}

/**
 * Delete a work log
 */
export async function deleteWorkLog(id: string): Promise<void> {
  await db.delete(workLogs).where(eq(workLogs.id, id));
}

/**
 * Check if user owns the work log
 */
export async function isWorkLogOwner(
  workLogId: string,
  userId: string,
): Promise<boolean> {
  const [log] = await db
    .select({ userId: workLogs.userId })
    .from(workLogs)
    .where(eq(workLogs.id, workLogId))
    .limit(1);

  return log?.userId === userId;
}

/**
 * Batch update work logs
 */
export interface BatchUpdateItem {
  id: string;
  data: Partial<Omit<NewWorkLog, "id" | "createdAt" | "updatedAt">>;
}

export async function batchUpdateWorkLogs(
  updates: BatchUpdateItem[],
): Promise<WorkLog[]> {
  return await db.transaction(async (tx) => {
    const results: WorkLog[] = [];

    for (const { id, data } of updates) {
      const [updated] = await tx
        .update(workLogs)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(workLogs.id, id))
        .returning();

      if (updated) {
        results.push(updated);
      }
    }

    return results;
  });
}
