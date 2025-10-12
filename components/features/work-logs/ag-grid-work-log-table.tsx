"use client";

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import type {
  CellEditingStoppedEvent,
  ColDef,
  GridReadyEvent,
} from "ag-grid-community";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Project, WorkCategory, WorkLog } from "@/drizzle/schema";
import { WorkLogFormDialog } from "./work-log-form-dialog";

// Validation constants
const WORK_LOG_VALIDATION = {
  HOURS: {
    MIN: 0,
    MAX: 168,
    MAX_LENGTH: 5,
    PATTERN: /^\d+(\.\d{1,2})?$/,
  },
  DETAILS: {
    MAX_LENGTH: 1000,
  },
  DATE: {
    FORMAT: /^\d{4}-\d{2}-\d{2}$/,
  },
} as const;

interface AGGridWorkLogTableProps {
  workLogs: WorkLog[];
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
  isLoading: boolean;
}

interface WorkLogGridRow extends WorkLog {
  projectName?: string;
  categoryName?: string;
}

export function AGGridWorkLogTable({
  workLogs,
  projects,
  categories,
  onCreateWorkLog,
  onUpdateWorkLog,
  onDeleteWorkLog,
  isLoading,
}: AGGridWorkLogTableProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWorkLog, setSelectedWorkLog] = useState<WorkLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchEditingEnabled, setBatchEditingEnabled] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<
    Map<
      string,
      Partial<{
        date?: string;
        hours?: string;
        projectId?: string;
        categoryId?: string;
        details?: string | null;
      }>
    >
  >(new Map());

  // Create project and category lookup maps
  const projectsMap = useMemo(() => {
    return new Map(projects.map((p) => [p.id, p.name]));
  }, [projects]);

  const categoriesMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  // Prepare data with project and category names
  const rowData: WorkLogGridRow[] = useMemo(() => {
    return workLogs.map((workLog) => ({
      ...workLog,
      projectName: projectsMap.get(workLog.projectId) || "Unknown",
      categoryName: categoriesMap.get(workLog.categoryId) || "Unknown",
    }));
  }, [workLogs, projectsMap, categoriesMap]);

  // Actions cell renderer
  const ActionsCellRenderer = useCallback((params: { data: WorkLog }) => {
    const onEdit = () => {
      setSelectedWorkLog(params.data);
      setFormOpen(true);
    };

    const onDelete = () => {
      setSelectedWorkLog(params.data);
      setDeleteDialogOpen(true);
    };

    return (
      <div className="flex gap-2 h-full items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="h-7 px-2"
        >
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="h-7 px-2"
        >
          Delete
        </Button>
      </div>
    );
  }, []);

  // Column definitions
  const columnDefs: ColDef[] = useMemo(() => {
    const columns: ColDef[] = [
      {
        headerName: "Date",
        field: "date",
        width: 120,
        editable: batchEditingEnabled,
        cellEditor: "agDateCellEditor",
        cellEditorParams: {
          format: "yyyy-mm-dd",
        },
        valueFormatter: (params) => {
          if (!params.value) return "";

          // If it's already YYYY-MM-DD format, format for display
          if (
            typeof params.value === "string" &&
            WORK_LOG_VALIDATION.DATE.FORMAT.test(params.value)
          ) {
            // Simple string formatting to avoid timezone issues
            const [year, month, day] = params.value.split("-");
            return `${year}/${month}/${day}`;
          }

          // Otherwise, try to parse as date
          try {
            return new Date(params.value).toLocaleDateString();
          } catch (_e) {
            return params.value;
          }
        },
        valueParser: (params) => {
          // Return the value exactly as provided by the editor
          if (
            params.newValue &&
            WORK_LOG_VALIDATION.DATE.FORMAT.test(params.newValue)
          ) {
            return params.newValue;
          }

          // If not valid, return the old value
          return params.oldValue;
        },
        sort: "desc",
      },
      {
        headerName: "Hours",
        field: "hours",
        width: 100,
        editable: batchEditingEnabled,
        cellEditor: "agTextCellEditor",
        cellEditorParams: {
          maxLength: WORK_LOG_VALIDATION.HOURS.MAX_LENGTH,
        },
        valueParser: (params) => {
          const value = params.newValue;

          if (!value) {
            toast.error("時間を入力してください");
            return params.oldValue;
          }

          if (!WORK_LOG_VALIDATION.HOURS.PATTERN.test(value)) {
            toast.error("時間は数値で入力してください（例: 8 または 8.5）");
            return params.oldValue;
          }

          const hours = parseFloat(value);
          if (hours <= WORK_LOG_VALIDATION.HOURS.MIN) {
            toast.error("時間は0より大きい値を入力してください");
            return params.oldValue;
          }

          if (hours > WORK_LOG_VALIDATION.HOURS.MAX) {
            toast.error("時間は168以下で入力してください");
            return params.oldValue;
          }

          return value;
        },
      },
      {
        headerName: "Project",
        field: batchEditingEnabled ? "projectId" : "projectName",
        width: 200,
        editable: batchEditingEnabled,
        cellEditor: batchEditingEnabled ? "agSelectCellEditor" : undefined,
        cellEditorParams: batchEditingEnabled
          ? {
              values: projects.filter((p) => p.isActive).map((p) => p.id),
            }
          : undefined,
        valueFormatter: (params) => {
          if (batchEditingEnabled) {
            return projectsMap.get(params.value) || "Unknown";
          }
          return params.value;
        },
        filter: true,
      },
      {
        headerName: "Category",
        field: batchEditingEnabled ? "categoryId" : "categoryName",
        width: 180,
        editable: batchEditingEnabled,
        cellEditor: batchEditingEnabled ? "agSelectCellEditor" : undefined,
        cellEditorParams: batchEditingEnabled
          ? {
              values: categories.filter((c) => c.isActive).map((c) => c.id),
            }
          : undefined,
        valueFormatter: (params) => {
          if (batchEditingEnabled) {
            return categoriesMap.get(params.value) || "Unknown";
          }
          return params.value;
        },
        filter: true,
      },
      {
        headerName: "Details",
        field: "details",
        flex: 1,
        editable: batchEditingEnabled,
        cellEditor: "agTextCellEditor",
        cellEditorParams: {
          maxLength: WORK_LOG_VALIDATION.DETAILS.MAX_LENGTH,
        },
        tooltipField: "details",
        wrapText: true,
        cellStyle: (_params) => {
          return {
            lineHeight: "1.4",
            padding: "8px",
            whiteSpace: "normal",
            wordWrap: "break-word",
            display: "flex",
            alignItems: "center",
          };
        },
      },
    ];

    // Add Actions column only when batch editing is disabled
    if (!batchEditingEnabled) {
      columns.push({
        headerName: "Actions",
        cellRenderer: ActionsCellRenderer,
        width: 150,
        sortable: false,
        filter: false,
        pinned: "right",
      });
    }

    return columns;
  }, [
    batchEditingEnabled,
    projects,
    categories,
    projectsMap,
    categoriesMap,
    ActionsCellRenderer,
  ]);

  // Default column properties
  const defaultColDef: ColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: false,
      suppressKeyboardEvent: (params) => {
        // Allow Enter to commit cell edit and move to next row
        if (params.event.key === "Enter" && params.editing) {
          return false;
        }
        return false;
      },
    }),
    [],
  );

  // Handle cell editing - store changes instead of immediate save
  const onCellEditingStopped = useCallback((event: CellEditingStoppedEvent) => {
    const { data, colDef, newValue, oldValue } = event;

    if (newValue === oldValue) return;

    const field = colDef.field;
    if (!field) return;

    // Store the change in pending changes
    setPendingChanges((prev) => {
      const newChanges = new Map(prev);
      const workLogId = data.id;
      const existingChanges = newChanges.get(workLogId) || {};
      newChanges.set(workLogId, {
        ...existingChanges,
        [field]: newValue,
      });
      return newChanges;
    });
  }, []);

  const handleFormSubmit = async (data: {
    date: string;
    hours: string;
    projectId: string;
    categoryId: string;
    details?: string;
  }) => {
    try {
      setIsSubmitting(true);
      if (selectedWorkLog) {
        await onUpdateWorkLog(selectedWorkLog.id, data);
      } else {
        await onCreateWorkLog(data);
      }
      setFormOpen(false);
      setSelectedWorkLog(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWorkLog) return;

    try {
      setIsSubmitting(true);
      await onDeleteWorkLog(selectedWorkLog.id);
      setDeleteDialogOpen(false);
      setSelectedWorkLog(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle batch save
  const handleBatchSave = useCallback(async () => {
    if (pendingChanges.size === 0) {
      toast.info("変更がありません");
      return;
    }

    setIsSubmitting(true);

    try {
      const results = await Promise.allSettled(
        Array.from(pendingChanges.entries()).map(
          async ([workLogId, changes]) => {
            try {
              await onUpdateWorkLog(workLogId, changes);
              return { workLogId, success: true };
            } catch (error) {
              return {
                workLogId,
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
              };
            }
          },
        ),
      );

      const succeeded = results.filter(
        (r) => r.status === "fulfilled" && r.value.success,
      );
      const failed = results.filter(
        (r) => r.status === "fulfilled" && !r.value.success,
      );

      if (failed.length === 0) {
        toast.success(`${succeeded.length}件の変更を保存しました`);
        setPendingChanges(new Map());
        setBatchEditingEnabled(false);
      } else if (succeeded.length > 0) {
        toast.warning(
          `${succeeded.length}件保存、${failed.length}件失敗しました。失敗した項目を再度確認してください。`,
        );
        // Remove only successful changes from pending
        const newPendingChanges = new Map(pendingChanges);
        succeeded.forEach((r) => {
          if (r.status === "fulfilled") {
            newPendingChanges.delete(r.value.workLogId);
          }
        });
        setPendingChanges(newPendingChanges);
      } else {
        toast.error(`全ての更新に失敗しました (${failed.length}件)`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [pendingChanges, onUpdateWorkLog]);

  // Handle cancel batch editing
  const handleCancelBatchEditing = useCallback(() => {
    if (pendingChanges.size > 0) {
      setCancelDialogOpen(true);
    } else {
      setBatchEditingEnabled(false);
    }
  }, [pendingChanges.size]);

  const handleConfirmCancel = () => {
    setPendingChanges(new Map());
    setBatchEditingEnabled(false);
    setCancelDialogOpen(false);
  };

  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border-2 border-primary/20 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">
              Work Logs Management
            </h2>
            <p className="text-muted-foreground">
              Enhanced spreadsheet-like interface for work log management
            </p>
          </div>
          <div className="flex gap-2">
            {!batchEditingEnabled ? (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setBatchEditingEnabled(true)}
                >
                  一括編集
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setSelectedWorkLog(null);
                    setFormOpen(true);
                  }}
                >
                  Add Work Log
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleBatchSave}
                  disabled={isSubmitting || pendingChanges.size === 0}
                >
                  {isSubmitting
                    ? "保存中..."
                    : `保存 (${pendingChanges.size}件)`}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleCancelBatchEditing}
                  disabled={isSubmitting}
                >
                  キャンセル
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading work logs...</div>
      ) : (
        <div className="ag-theme-quartz h-[600px] w-full border rounded-lg">
          <AgGridReact
            className="h-full w-full"
            theme="legacy"
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            onCellEditingStopped={onCellEditingStopped}
            rowSelection="single"
            animateRows={true}
            suppressRowClickSelection={true}
            singleClickEdit={batchEditingEnabled}
            stopEditingWhenCellsLoseFocus={true}
            enterNavigatesVertically={true}
            undoRedoCellEditing={true}
          />
        </div>
      )}

      <WorkLogFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setSelectedWorkLog(null);
          }
        }}
        onSubmit={handleFormSubmit}
        projects={projects}
        categories={categories}
        workLog={selectedWorkLog}
        isSubmitting={isSubmitting}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Work Log</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this work log? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>未保存の変更を破棄しますか？</DialogTitle>
            <DialogDescription>
              {pendingChanges.size}件の未保存の変更があります。
              キャンセルすると、これらの変更は失われます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              編集を継続
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>
              変更を破棄
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
