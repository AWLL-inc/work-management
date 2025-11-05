"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { EnhancedWorkLogTable } from "@/components/features/work-logs/enhanced-work-log-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Project, WorkCategory, WorkLog } from "@/drizzle/schema";
import type { SanitizedUser } from "@/lib/api/users";

/**
 * Prefix for temporary IDs used in optimistic updates
 * These IDs are replaced with real IDs from the server after successful creation
 */
const OPTIMISTIC_ID_PREFIX = "optimistic-";

/**
 * Creates a temporary ID for optimistic updates
 * Format: optimistic-{uuid}
 */
function createOptimisticId(): string {
  return `${OPTIMISTIC_ID_PREFIX}${crypto.randomUUID()}`;
}

/**
 * Checks if an ID is a temporary optimistic ID
 * Note: Currently unused but available for future validation needs
 */
function _isOptimisticId(id: string): boolean {
  return id.startsWith(OPTIMISTIC_ID_PREFIX);
}

interface WorkLogsClientProps {
  initialWorkLogs: WorkLog[];
  projects: Project[];
  categories: WorkCategory[];
  users: SanitizedUser[];
  currentScope: "own" | "team" | "all";
  userRole: "admin" | "manager" | "user";
  currentUserId: string;
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
  users,
  currentScope,
  userRole,
  currentUserId,
  onCreateWorkLog,
  onUpdateWorkLog,
  onDeleteWorkLog,
  onRefresh,
}: WorkLogsClientProps) {
  const t = useTranslations("workLogs");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Optimistic state for work logs
  const [optimisticWorkLogs, updateOptimisticWorkLogs] = useOptimistic(
    initialWorkLogs,
    (
      state,
      action:
        | { type: "create"; log: WorkLog }
        | { type: "update"; id: string; data: Partial<WorkLog> }
        | { type: "delete"; id: string },
    ) => {
      switch (action.type) {
        case "create":
          return [...state, action.log];
        case "update":
          return state.map((log) =>
            log.id === action.id ? { ...log, ...action.data } : log,
          );
        case "delete":
          return state.filter((log) => log.id !== action.id);
        default:
          return state;
      }
    },
  );

  const handleScopeChange = (newScope: string) => {
    // Preserve existing filter parameters when changing scope
    const params = new URLSearchParams(searchParams.toString());
    params.set("scope", newScope);
    router.push(`/work-logs?${params.toString()}`);
  };

  const handleCreateWorkLog = async (data: {
    date: string;
    hours: string;
    projectId: string;
    categoryId: string;
    details?: string;
  }) => {
    // Create optimistic work log
    const optimisticLog: WorkLog = {
      id: createOptimisticId(),
      userId: currentUserId,
      date: new Date(data.date),
      hours: data.hours,
      projectId: data.projectId,
      categoryId: data.categoryId,
      details: data.details || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    startTransition(async () => {
      updateOptimisticWorkLogs({ type: "create", log: optimisticLog });

      try {
        await onCreateWorkLog(data);
        toast.success(t("messages.created"));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("messages.createError"),
        );
        // Explicitly sync with server state after error to ensure UI consistency
        await onRefresh();
      }
    });
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
    const optimisticData: Partial<WorkLog> = {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
      updatedAt: new Date(),
    };

    startTransition(async () => {
      updateOptimisticWorkLogs({ type: "update", id, data: optimisticData });

      try {
        await onUpdateWorkLog(id, data);
        toast.success(t("messages.updated"));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("messages.updateError"),
        );
        // Explicitly sync with server state after error to ensure UI consistency
        await onRefresh();
      }
    });
  };

  const handleDeleteWorkLog = async (id: string) => {
    startTransition(async () => {
      updateOptimisticWorkLogs({ type: "delete", id });

      try {
        await onDeleteWorkLog(id);
        toast.success(t("messages.deleted"));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("messages.deleteError"),
        );
        // Explicitly sync with server state after error to ensure UI consistency
        await onRefresh();
      }
    });
  };

  // React Compiler will automatically memoize this function
  const handleRefresh = async () => {
    startTransition(async () => {
      await onRefresh();
    });
  };

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
          workLogs={optimisticWorkLogs}
          projects={projects}
          categories={categories}
          users={users}
          currentUserId={currentUserId}
          userRole={userRole}
          onCreateWorkLog={handleCreateWorkLog}
          onUpdateWorkLog={handleUpdateWorkLog}
          onDeleteWorkLog={handleDeleteWorkLog}
          onRefresh={handleRefresh}
          isLoading={isPending}
        />
      </div>
    </div>
  );
}
