"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { EnhancedWorkLogTable } from "@/components/features/work-logs/enhanced-work-log-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Project, WorkCategory, WorkLog } from "@/drizzle/schema";

interface WorkLogsClientProps {
  initialWorkLogs: WorkLog[];
  projects: Project[];
  categories: WorkCategory[];
  currentScope: "own" | "team" | "all";
  userRole: string;
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
  currentScope,
  userRole,
  onCreateWorkLog,
  onUpdateWorkLog,
  onDeleteWorkLog,
  onRefresh,
}: WorkLogsClientProps) {
  const t = useTranslations("workLogs");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleScopeChange = (newScope: string) => {
    router.push(`/work-logs?scope=${newScope}`);
  };

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
      toast.success(t("messages.created"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("messages.createError"),
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
      toast.success(t("messages.updated"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("messages.updateError"),
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
      toast.success(t("messages.deleted"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("messages.deleteError"),
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
    <div className="flex flex-col h-[calc(100vh-8rem)] px-4 sm:px-0 space-y-6">
      {/* Scope Tabs */}
      <Tabs
        id="work-logs-scope-tabs"
        value={currentScope}
        onValueChange={handleScopeChange}
      >
        <TabsList>
          <TabsTrigger value="own">{t("tabs.own")}</TabsTrigger>
          <TabsTrigger value="team">{t("tabs.team")}</TabsTrigger>
          {userRole === "admin" && (
            <TabsTrigger value="all">{t("tabs.all")}</TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      {/* Work Log Table - Takes remaining height */}
      <div className="flex-1 min-h-0">
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
    </div>
  );
}
