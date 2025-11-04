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

interface WorkLogsPageProps {
  searchParams: Promise<{ scope?: string }>;
}

export default async function WorkLogsPage({
  searchParams,
}: WorkLogsPageProps) {
  // Get authenticated session
  const session = await getAuthenticatedSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Get scope from URL parameter
  const { scope = "own" } = await searchParams;

  // Build query options based on scope
  const options: GetWorkLogsOptions = {};

  if (scope === "all") {
    // Admin can view all work logs
    if (session.user.role !== "admin") {
      throw new Error("Forbidden: Only admins can view all work logs");
    }
    // No user filter for admin viewing all
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
    } else {
      // User not in any team, show only own work logs
      options.userId = session.user.id;
    }
  } else {
    // scope === "own" (default)
    options.userId = session.user.id;
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
  }) => {
    "use server";
    const session = await getAuthenticatedSession();
    if (!session) throw new Error("Unauthorized");

    await createWorkLogRepo({
      userId: session.user.id,
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
    },
  ) => {
    "use server";
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
