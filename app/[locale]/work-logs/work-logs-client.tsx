"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { EnhancedWorkLogTable } from "@/components/features/work-logs/enhanced-work-log-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  editableWorkLogIds: string[];
  canSelectUser: boolean;
  onCreateWorkLog: (data: {
    userId: string;
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
  editableWorkLogIds,
  canSelectUser,
  onCreateWorkLog,
  onUpdateWorkLog,
  onDeleteWorkLog,
  onRefresh,
}: WorkLogsClientProps) {
  const t = useTranslations("workLogs");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State for scope change confirmation dialog
  const [scopeChangeDialogOpen, setScopeChangeDialogOpen] = useState(false);
  const [pendingScopeChange, setPendingScopeChange] = useState<string | null>(
    null,
  );

  // Ref to check if batch editing is enabled
  const batchEditingEnabledRef = useRef(false);
  const checkHasChangesRef = useRef<(() => boolean) | null>(null);

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
    // Check if batch editing is enabled and there are changes
    if (batchEditingEnabledRef.current) {
      // Check if there are any changes
      const hasChanges = checkHasChangesRef.current?.() ?? false;

      if (hasChanges) {
        // Show confirmation dialog
        setPendingScopeChange(newScope);
        setScopeChangeDialogOpen(true);
        return;
      }
    }

    // No changes or not in batch editing mode, proceed with scope change
    const params = new URLSearchParams(searchParams.toString());
    params.set("scope", newScope);
    router.push(`/work-logs?${params.toString()}`);
  };

  const handleConfirmScopeChange = () => {
    if (pendingScopeChange) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("scope", pendingScopeChange);
      router.push(`/work-logs?${params.toString()}`);
      setScopeChangeDialogOpen(false);
      setPendingScopeChange(null);
    }
  };

  const handleCancelScopeChange = () => {
    setScopeChangeDialogOpen(false);
    setPendingScopeChange(null);
  };

  const handleCreateWorkLog = async (data: {
    userId: string;
    date: string;
    hours: string;
    projectId: string;
    categoryId: string;
    details?: string;
  }) => {
    // Create optimistic work log
    const optimisticLog: WorkLog = {
      id: createOptimisticId(),
      userId: data.userId,
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
          currentScope={currentScope}
          editableWorkLogIds={editableWorkLogIds}
          canSelectUser={canSelectUser}
          onCreateWorkLog={handleCreateWorkLog}
          onUpdateWorkLog={handleUpdateWorkLog}
          onDeleteWorkLog={handleDeleteWorkLog}
          onRefresh={handleRefresh}
          isLoading={isPending}
          onBatchEditingChange={(enabled) => {
            batchEditingEnabledRef.current = enabled;
          }}
          onRegisterHasChangesCheck={(checkFn) => {
            checkHasChangesRef.current = checkFn;
          }}
        />
      </div>

      {/* Scope change confirmation dialog */}
      <Dialog
        open={scopeChangeDialogOpen}
        onOpenChange={setScopeChangeDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>未保存の変更を破棄しますか？</DialogTitle>
            <DialogDescription>
              編集中の変更があります。スコープを切り替えると、これらの変更は失われます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelScopeChange}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleConfirmScopeChange}>
              破棄して続行
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
