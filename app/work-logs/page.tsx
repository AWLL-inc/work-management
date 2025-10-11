"use client";

import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { AGGridWorkLogTable } from "@/components/features/work-logs/ag-grid-work-log-table";
import { WorkLogTable } from "@/components/features/work-logs/work-log-table";
import { Button } from "@/components/ui/button";
import { getProjects } from "@/lib/api/projects";
import { getWorkCategories } from "@/lib/api/work-categories";
import {
  createWorkLog,
  deleteWorkLog,
  getWorkLogs,
  updateWorkLog,
} from "@/lib/api/work-logs";

export default function WorkLogsPage() {
  const [useAGGrid, setUseAGGrid] = useState(true);

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
    },
  );

  const { data: categories, isLoading: isLoadingCategories } = useSWR(
    "/api/work-categories?active=true",
    () => getWorkCategories(true),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
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
        date: data.date,
        hours: data.hours,
        projectId: data.projectId,
        categoryId: data.categoryId,
        details: data.details || null,
      });
      mutateWorkLogs();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create work log",
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
    },
  ) => {
    try {
      await updateWorkLog(id, data);
      mutateWorkLogs();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update work log",
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
        error instanceof Error ? error.message : "Failed to delete work log",
      );
      throw error;
    }
  };

  const isLoading =
    isLoadingWorkLogs || isLoadingProjects || isLoadingCategories;

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-4 flex justify-end">
        <Button
          variant={useAGGrid ? "default" : "outline"}
          onClick={() => setUseAGGrid(!useAGGrid)}
          className="mb-4"
        >
          {useAGGrid ? "Switch to Standard Table" : "Switch to AG Grid"}
        </Button>
      </div>

      {useAGGrid ? (
        <AGGridWorkLogTable
          workLogs={workLogs || []}
          projects={projects || []}
          categories={categories || []}
          onCreateWorkLog={handleCreateWorkLog}
          onUpdateWorkLog={handleUpdateWorkLog}
          onDeleteWorkLog={handleDeleteWorkLog}
          isLoading={isLoading}
        />
      ) : (
        <WorkLogTable
          workLogs={workLogs || []}
          projects={projects || []}
          categories={categories || []}
          onCreateWorkLog={handleCreateWorkLog}
          onUpdateWorkLog={handleUpdateWorkLog}
          onDeleteWorkLog={handleDeleteWorkLog}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
