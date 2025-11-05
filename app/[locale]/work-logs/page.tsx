import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { teamMembers } from "@/drizzle/schema";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";
import { getAllProjects } from "@/lib/db/repositories/project-repository";
import { getAllUsers } from "@/lib/db/repositories/user-repository";
import { getAllWorkCategories } from "@/lib/db/repositories/work-category-repository";
import {
  createWorkLog as createWorkLogRepo,
  deleteWorkLog as deleteWorkLogRepo,
  type GetWorkLogsOptions,
  getWorkLogs as getWorkLogsRepo,
  updateWorkLog as updateWorkLogRepo,
} from "@/lib/db/repositories/work-log-repository";
import { WorkLogsClient } from "./work-logs-client";

/**
 * Validates if a string is a valid date string in ISO format (YYYY-MM-DD)
 * @param dateStr Date string to validate
 * @returns true if valid, false otherwise
 */
function isValidDateString(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/**
 * Validates if a string is a valid UUID
 * @param str String to validate
 * @returns true if valid UUID, false otherwise
 */
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    str,
  );
}

/**
 * Parses comma-separated UUID string and validates each UUID
 * @param param Comma-separated UUID string
 * @returns Array of valid UUIDs or undefined if no valid UUIDs found
 */
function parseUUIDs(param: string | undefined): string[] | undefined {
  if (!param) return undefined;
  const ids = param.split(",").filter((id) => isValidUUID(id));
  return ids.length > 0 ? ids : undefined;
}

interface WorkLogsPageProps {
  searchParams: Promise<{
    scope?: string;
    from?: string;
    to?: string;
    projects?: string;
    categories?: string;
    userId?: string;
  }>;
}

export default async function WorkLogsPage({
  searchParams,
}: WorkLogsPageProps) {
  // Get authenticated session
  const session = await getAuthenticatedSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Get parameters from URL
  const params = await searchParams;
  const {
    scope = "own",
    from,
    to,
    projects: projectIdsParam,
    categories: categoryIdsParam,
    userId: filterUserId,
  } = params;

  // Build query options based on scope and filters
  const options: GetWorkLogsOptions = {
    // Date range filters (with validation)
    startDate: from && isValidDateString(from) ? new Date(from) : undefined,
    endDate: to && isValidDateString(to) ? new Date(to) : undefined,
    // Multi-select filters (with UUID validation)
    projectIds: parseUUIDs(projectIdsParam),
    categoryIds: parseUUIDs(categoryIdsParam),
    // User filter (for admin viewing specific user's logs)
    userId: filterUserId,
  };

  // Apply scope-based filtering (unless userId filter is specified)
  if (!filterUserId) {
    if (scope === "all") {
      // Admin can view all work logs
      if (session.user.role !== "admin") {
        throw new Error("Forbidden: Only admins can view all work logs");
      }
      // No user filter - show all users' logs
      delete options.userId;
    } else if (scope === "team") {
      // Get user's teams
      const userTeams = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.userId, session.user.id));

      if (userTeams.length > 0) {
        const teamIds = userTeams.map((tm) => tm.teamId);

        // Get all team members
        const allMembers = await db
          .select({ userId: teamMembers.userId })
          .from(teamMembers)
          .where(inArray(teamMembers.teamId, teamIds));

        // Include current user and deduplicate
        const uniqueTeammateIds = Array.from(
          new Set([session.user.id, ...allMembers.map((m) => m.userId)]),
        );

        options.userIds = uniqueTeammateIds;
        delete options.userId;
      } else {
        // User not in any team, show only own work logs
        options.userId = session.user.id;
      }
    } else {
      // scope === "own" (default)
      options.userId = session.user.id;
    }
  }

  // Server-side data fetching
  const [workLogsResult, projects, categories, users] = await Promise.all([
    getWorkLogsRepo(options),
    getAllProjects({ activeOnly: true }),
    getAllWorkCategories({ activeOnly: true }),
    getAllUsers(),
  ]);

  const workLogs = workLogsResult.data;

  // Sanitize users data (remove password hashes)
  const sanitizedUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    image: user.image,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));

  // Server Actions wrapped in async functions
  const handleCreateWorkLog = async (data: {
    date: string;
    hours: string;
    projectId: string;
    categoryId: string;
    details?: string;
    userId?: string;
  }) => {
    "use server";
    const session = await getAuthenticatedSession();
    if (!session) throw new Error("Unauthorized");

    // Only admins can create work logs for other users
    let targetUserId = session.user.id;
    if (data.userId && data.userId !== session.user.id) {
      if (session.user.role !== "admin") {
        throw new Error(
          "Forbidden: Only admins can create work logs for other users",
        );
      }
      targetUserId = data.userId;
    }

    await createWorkLogRepo({
      userId: targetUserId,
      date: new Date(data.date),
      hours: data.hours,
      projectId: data.projectId,
      categoryId: data.categoryId,
      details: data.details || null,
    });
    revalidatePath("/[locale]/work-logs");
  };

  const handleUpdateWorkLog = async (
    id: string,
    data: {
      date?: string;
      hours?: string;
      projectId?: string;
      categoryId?: string;
      details?: string | null;
      userId?: string;
    },
  ) => {
    "use server";
    const session = await getAuthenticatedSession();
    if (!session) throw new Error("Unauthorized");

    // Only admins can change the user of a work log
    if (data.userId && data.userId !== session.user.id) {
      if (session.user.role !== "admin") {
        throw new Error("Forbidden: Only admins can change work log user");
      }
    }

    await updateWorkLogRepo(id, {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    });
    revalidatePath("/[locale]/work-logs");
  };

  const handleDeleteWorkLog = async (id: string) => {
    "use server";
    await deleteWorkLogRepo(id);
    revalidatePath("/[locale]/work-logs");
  };

  const handleRefresh = async () => {
    "use server";
    revalidatePath("/[locale]/work-logs");
  };

  return (
    <WorkLogsClient
      initialWorkLogs={workLogs}
      projects={projects}
      categories={categories}
      users={sanitizedUsers}
      currentScope={scope as "own" | "team" | "all"}
      userRole={session.user.role}
      currentUserId={session.user.id}
      onCreateWorkLog={handleCreateWorkLog}
      onUpdateWorkLog={handleUpdateWorkLog}
      onDeleteWorkLog={handleDeleteWorkLog}
      onRefresh={handleRefresh}
    />
  );
}
