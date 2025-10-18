"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { AGGridWorkLogTable } from "@/components/features/work-logs/ag-grid-work-log-table";
import { EnhancedWorkLogTable } from "@/components/features/work-logs/enhanced-work-log-table";
import { WorkLogTable } from "@/components/features/work-logs/work-log-table";
import { Button } from "@/components/ui/button";
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
  const [tableType, setTableType] = useState<
    "enhanced" | "ag-grid" | "standard"
  >("enhanced");
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
      ) : tableType === "ag-grid" ? (
        <AGGridWorkLogTable
          workLogs={initialWorkLogs}
          projects={projects}
          categories={categories}
          onCreateWorkLog={handleCreateWorkLog}
          onUpdateWorkLog={handleUpdateWorkLog}
          onDeleteWorkLog={handleDeleteWorkLog}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />
      ) : (
        <WorkLogTable
          workLogs={initialWorkLogs}
          projects={projects}
          categories={categories}
          onCreateWorkLog={handleCreateWorkLog}
          onUpdateWorkLog={handleUpdateWorkLog}
          onDeleteWorkLog={handleDeleteWorkLog}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
