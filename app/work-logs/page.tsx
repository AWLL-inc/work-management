"use client";

import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { AGGridWorkLogTable } from "@/components/features/work-logs/ag-grid-work-log-table";
import { EnhancedWorkLogTable } from "@/components/features/work-logs/enhanced-work-log-table";
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
  const [tableType, setTableType] = useState<
    "enhanced" | "ag-grid" | "standard"
  >("enhanced");

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
      <div className="mb-4 flex justify-end gap-2">
        <Button
          variant={tableType === "enhanced" ? "default" : "outline"}
          onClick={() => setTableType("enhanced")}
          className="mb-4"
        >
          Enhanced AG Grid
        </Button>
        <Button
          variant={tableType === "ag-grid" ? "default" : "outline"}
          onClick={() => setTableType("ag-grid")}
          className="mb-4"
        >
          Original AG Grid
        </Button>
        <Button
          variant={tableType === "standard" ? "default" : "outline"}
          onClick={() => setTableType("standard")}
          className="mb-4"
        >
          Standard Table
        </Button>
      </div>

      {tableType === "enhanced" ? (
        <EnhancedWorkLogTable
          workLogs={workLogs || []}
          projects={projects || []}
          categories={categories || []}
          onCreateWorkLog={handleCreateWorkLog}
          onUpdateWorkLog={handleUpdateWorkLog}
          onDeleteWorkLog={handleDeleteWorkLog}
          onRefresh={mutateWorkLogs}
          isLoading={isLoading}
        />
      ) : tableType === "ag-grid" ? (
        <AGGridWorkLogTable
          workLogs={workLogs || []}
          projects={projects || []}
          categories={categories || []}
          onCreateWorkLog={handleCreateWorkLog}
          onUpdateWorkLog={handleUpdateWorkLog}
          onDeleteWorkLog={handleDeleteWorkLog}
          onRefresh={mutateWorkLogs}
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
