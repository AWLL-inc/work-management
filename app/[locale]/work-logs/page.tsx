import { revalidatePath } from "next/cache";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { getAllProjects } from "@/lib/db/repositories/project-repository";
import { getAllWorkCategories } from "@/lib/db/repositories/work-category-repository";
import {
  createWorkLog as createWorkLogRepo,
  deleteWorkLog as deleteWorkLogRepo,
  getWorkLogs as getWorkLogsRepo,
  updateWorkLog as updateWorkLogRepo,
} from "@/lib/db/repositories/work-log-repository";
import { WorkLogsClient } from "./work-logs-client";

export default async function WorkLogsPage() {
  // Get authenticated session
  const session = await getAuthenticatedSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Server-side data fetching - use repository directly instead of API
  const [workLogsResult, projects, categories] = await Promise.all([
    getWorkLogsRepo({
      userId: session.user.role === "admin" ? undefined : session.user.id,
    }),
    getAllProjects({ activeOnly: true }),
    getAllWorkCategories({ activeOnly: true }),
  ]);

  const workLogs = workLogsResult.data;

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
      onCreateWorkLog={handleCreateWorkLog}
      onUpdateWorkLog={handleUpdateWorkLog}
      onDeleteWorkLog={handleDeleteWorkLog}
      onRefresh={handleRefresh}
    />
  );
}
