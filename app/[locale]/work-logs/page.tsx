import { revalidatePath } from "next/cache";
import { getProjects } from "@/lib/api/projects";
import { getWorkCategories } from "@/lib/api/work-categories";
import {
  createWorkLog,
  deleteWorkLog,
  getWorkLogs,
  updateWorkLog,
} from "@/lib/api/work-logs";
import { WorkLogsClient } from "./work-logs-client";

export default async function WorkLogsPage() {
  // Server-side data fetching
  const [workLogs, projects, categories] = await Promise.all([
    getWorkLogs({}),
    getProjects(true),
    getWorkCategories(true),
  ]);

  // Server Actions wrapped in async functions
  const handleCreateWorkLog = async (data: {
    date: string;
    hours: string;
    projectId: string;
    categoryId: string;
    details?: string;
  }) => {
    "use server";
    await createWorkLog({
      date: data.date,
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
    await updateWorkLog(id, data);
    revalidatePath("/[locale]/work-logs");
  };

  const handleDeleteWorkLog = async (id: string) => {
    "use server";
    await deleteWorkLog(id);
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
