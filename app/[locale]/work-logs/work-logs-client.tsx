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
import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { Project, WorkCategory, WorkLog } from "@/drizzle/schema";
import type { SanitizedUser } from "@/lib/api/users";
import type { PaginationResult } from "@/lib/db/repositories/work-log-repository";
import { cn } from "@/lib/utils";

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
  pagination: PaginationResult;
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
  pagination,
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

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/work-logs?${params.toString()}`);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const { page, totalPages } = pagination;
    const pages: { type: "page" | "ellipsis"; value: number; key: string }[] =
      [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push({ type: "page", value: i, key: `page-${i}` });
      }
    } else {
      // Always show first page
      pages.push({ type: "page", value: 1, key: "page-1" });

      if (page > 3) {
        pages.push({ type: "ellipsis", value: 0, key: "ellipsis-start" });
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push({ type: "page", value: i, key: `page-${i}` });
      }

      if (page < totalPages - 2) {
        pages.push({ type: "ellipsis", value: 0, key: "ellipsis-end" });
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push({
          type: "page",
          value: totalPages,
          key: `page-${totalPages}`,
        });
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] px-4 sm:px-0 space-y-6">
      {/* Scope Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleScopeChange("own")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            currentScope === "own"
              ? "text-primary bg-primary/10 border border-primary rounded-full"
              : "text-foreground bg-background border border-border rounded-md shadow-sm hover:bg-accent",
          )}
        >
          {t("tabs.own")}
        </button>
        <button
          type="button"
          onClick={() => handleScopeChange("team")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            currentScope === "team"
              ? "text-primary bg-primary/10 border border-primary rounded-full"
              : "text-foreground bg-background border border-border rounded-md shadow-sm hover:bg-accent",
          )}
        >
          {t("tabs.team")}
        </button>
        {userRole === "admin" && (
          <button
            type="button"
            onClick={() => handleScopeChange("all")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              currentScope === "all"
                ? "text-primary bg-primary/10 border border-primary rounded-full"
                : "text-foreground bg-background border border-border rounded-md shadow-sm hover:bg-accent",
            )}
          >
            {t("tabs.all")}
          </button>
        )}
      </div>

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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            {t("pagination.showing", {
              from: (pagination.page - 1) * pagination.limit + 1,
              to: Math.min(
                pagination.page * pagination.limit,
                pagination.total,
              ),
              total: pagination.total,
            })}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationFirst
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                />
              </PaginationItem>

              {getPageNumbers().map((item) =>
                item.type === "ellipsis" ? (
                  <PaginationItem key={item.key}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item.key}>
                    <PaginationButton
                      onClick={() => handlePageChange(item.value)}
                      isActive={pagination.page === item.value}
                    >
                      {item.value}
                    </PaginationButton>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLast
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

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
