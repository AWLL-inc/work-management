"use client";

import { WorkLogTable } from "@/components/features/work-logs/work-log-table";
import useSWR from "swr";
import { toast } from "sonner";
import {
  getWorkLogs,
  createWorkLog,
  updateWorkLog,
  deleteWorkLog,
} from "@/lib/api/work-logs";
import { getProjects } from "@/lib/api/projects";
import { getWorkCategories } from "@/lib/api/work-categories";

export default function WorkLogsPage() {
  const {
    data: workLogs,
    isLoading: isLoadingWorkLogs,
    mutate: mutateWorkLogs,
  } = useSWR("/api/work-logs", getWorkLogs, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const { data: projects, isLoading: isLoadingProjects } = useSWR(
    "/api/projects?active=true",
    () => getProjects(true),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const { data: categories, isLoading: isLoadingCategories } = useSWR(
    "/api/work-categories?active=true",
    () => getWorkCategories(true),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const handleCreateWorkLog = async (data: {
    date: string;
    hours: string;
    projectId: string;
    categoryId: string;
    details?: string;
  }) => {
    try {
      await createWorkLog({
        date: new Date(data.date),
        hours: data.hours,
        projectId: data.projectId,
        categoryId: data.categoryId,
        details: data.details || null,
      });
      mutateWorkLogs();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create work log"
      );
      throw error;
    }
  };

  const handleUpdateWorkLog = async (
    id: string,
    data: {
      date?: string;
      hours?: string;
      projectId?: string;
      categoryId?: string;
      details?: string | null;
    }
  ) => {
    try {
      await updateWorkLog(id, {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      });
      mutateWorkLogs();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update work log"
      );
      throw error;
    }
  };

  const handleDeleteWorkLog = async (id: string) => {
    try {
      await deleteWorkLog(id);
      mutateWorkLogs();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete work log"
      );
      throw error;
    }
  };

  const isLoading = isLoadingWorkLogs || isLoadingProjects || isLoadingCategories;

  return (
    <div className="px-4 sm:px-0">
      <WorkLogTable
        workLogs={workLogs || []}
        projects={projects || []}
        categories={categories || []}
        onCreateWorkLog={handleCreateWorkLog}
        onUpdateWorkLog={handleUpdateWorkLog}
        onDeleteWorkLog={handleDeleteWorkLog}
        isLoading={isLoading}
      />
    </div>
  );
}
