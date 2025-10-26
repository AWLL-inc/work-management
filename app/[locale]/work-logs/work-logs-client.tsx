"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { EnhancedWorkLogTable } from "@/components/features/work-logs/enhanced-work-log-table";
import type { Project, WorkCategory, WorkLog } from "@/drizzle/schema";

interface WorkLogsClientProps {
  initialWorkLogs: WorkLog[];
  projects: Project[];
  categories: WorkCategory[];
  onCreateWorkLog: (data: {
    date: string;
    hours: string;
    projectId: string;
    categoryId: string;
    details?: string;
  }) => Promise<void>;
  onUpdateWorkLog: (
    id: string,
    data: {
      date?: string;
      hours?: string;
      projectId?: string;
      categoryId?: string;
      details?: string | null;
    },
  ) => Promise<void>;
  onDeleteWorkLog: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function WorkLogsClient({
  initialWorkLogs,
  projects,
  categories,
  onCreateWorkLog,
  onUpdateWorkLog,
  onDeleteWorkLog,
  onRefresh,
}: WorkLogsClientProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateWorkLog = async (data: {
    date: string;
    hours: string;
    projectId: string;
    categoryId: string;
    details?: string;
  }) => {
    try {
      setIsLoading(true);
      await onCreateWorkLog(data);
      toast.success("Work log created successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create work log",
      );
      throw error;
    } finally {
      setIsLoading(false);
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
      setIsLoading(true);
      await onUpdateWorkLog(id, data);
      toast.success("Work log updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update work log",
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWorkLog = async (id: string) => {
    try {
      setIsLoading(true);
      await onDeleteWorkLog(id);
      toast.success("Work log deleted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete work log",
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      await onRefresh();
    } finally {
      setIsLoading(false);
    }
  }, [onRefresh]);

  return (
    <div className="px-4 sm:px-0">
      <EnhancedWorkLogTable
        workLogs={initialWorkLogs}
        projects={projects}
        categories={categories}
        onCreateWorkLog={handleCreateWorkLog}
        onUpdateWorkLog={handleUpdateWorkLog}
        onDeleteWorkLog={handleDeleteWorkLog}
        onRefresh={handleRefresh}
        onFilterChange={() => {}}
        isLoading={isLoading}
      />
    </div>
  );
}
