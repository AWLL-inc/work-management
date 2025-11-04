"use client";

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "./ag-grid-styles.css";
import type {
  CellEditingStoppedEvent,
  ColDef,
  GridReadyEvent,
  RowClassParams,
} from "ag-grid-community";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";
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
import { formatDateForDisplay, parseDate } from "@/lib/utils";
import { WORK_LOG_CONSTRAINTS } from "@/lib/validations";
import {
  validateDate,
  validateHours,
} from "@/lib/validations/work-log-validations";
import { WorkLogFormDialog } from "./work-log-form-dialog";

// Column width constants
const COLUMN_WIDTHS = {
  DATE: 120,
  HOURS: 100,
  PROJECT: 200,
  CATEGORY: 180,
  ACTIONS: 150,
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
  onRefresh?: () => void;
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
  onRefresh,
  isLoading,
}: AGGridWorkLogTableProps) {
  const t = useTranslations("workLogs");
  const tCommon = useTranslations("common");
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

  // Track failed work log IDs for visual highlighting
  const [failedWorkLogIds, setFailedWorkLogIds] = useState<Set<string>>(
    new Set(),
  );

  // AG Grid reference for direct API access
  const gridRef = useRef<AgGridReact>(null);

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
      projectName: projectsMap.get(workLog.projectId) || tCommon("unknown"),
      categoryName: categoriesMap.get(workLog.categoryId) || tCommon("unknown"),
    }));
  }, [workLogs, projectsMap, categoriesMap, tCommon]);

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
          {t("buttons.edit")}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="h-7 px-2"
        >
          {t("buttons.delete")}
        </Button>
      </div>
    );
  }, [t]);

  // Column definitions
  const columnDefs: ColDef[] = useMemo(() => {
    const columns: ColDef[] = [
      {
        headerName: t("table.date"),
        field: "date",
        width: COLUMN_WIDTHS.DATE,
        editable: batchEditingEnabled,
        cellEditor: "agDateCellEditor",
        cellEditorParams: {
          format: "yyyy-mm-dd",
        },
        // JST表示 - formatDateForDisplayがタイムゾーンを考慮
        valueFormatter: (params) => formatDateForDisplay(params.value),
        valueParser: (params) => {
          const { newValue, oldValue } = params;

          if (!newValue) {
            return oldValue;
          }

          // Use JST-aware parseDate utility
          // Interpret string in YYYY-MM-DD format as JST
          const date = parseDate(newValue);
          if (!date) {
            toast.error(t("validation.invalidDate"));
            return oldValue;
          }

          // Save as ISO 8601 format string (maintain database compatibility)
          return newValue;
        },
        sort: "desc",
        cellClass: (params) => {
          if (!batchEditingEnabled) return "";
          const validation = validateDate(params.value);
          return validation.valid ? "" : "ag-cell-invalid";
        },
        tooltipValueGetter: (params) => {
          if (!batchEditingEnabled) return "";
          const validation = validateDate(params.value);
          return validation.message || "";
        },
      },
      {
        headerName: t("table.hours"),
        field: "hours",
        width: COLUMN_WIDTHS.HOURS,
        editable: batchEditingEnabled,
        cellEditor: "agTextCellEditor",
        cellEditorParams: {
          maxLength: WORK_LOG_CONSTRAINTS.HOURS.MAX_LENGTH,
        },
        valueParser: (params) => {
          const value = params.newValue;

          if (!value) {
            toast.error(t("validation.hoursRequired"));
            return params.oldValue;
          }

          if (!WORK_LOG_CONSTRAINTS.HOURS.PATTERN.test(value)) {
            toast.error(t("validation.hoursNumeric"));
            return params.oldValue;
          }

          const hours = parseFloat(value);
          if (hours <= WORK_LOG_CONSTRAINTS.HOURS.MIN) {
            toast.error(t("validation.hoursMin"));
            return params.oldValue;
          }

          if (hours > WORK_LOG_CONSTRAINTS.HOURS.MAX) {
            toast.error(t("validation.hoursMax"));
            return params.oldValue;
          }

          return value;
        },
        cellClass: (params) => {
          if (!batchEditingEnabled) return "";
          const validation = validateHours(params.value);
          return validation.valid ? "" : "ag-cell-invalid";
        },
        tooltipValueGetter: (params) => {
          if (!batchEditingEnabled) return "";
          const validation = validateHours(params.value);
          return validation.message || "";
        },
      },
      {
        headerName: t("table.project"),
        field: batchEditingEnabled ? "projectId" : "projectName",
        width: COLUMN_WIDTHS.PROJECT,
        editable: batchEditingEnabled,
        cellEditor: batchEditingEnabled ? "agSelectCellEditor" : undefined,
        cellEditorParams: batchEditingEnabled
          ? {
              values: projects.filter((p) => p.isActive).map((p) => p.id),
            }
          : undefined,
        valueFormatter: (params) => {
          if (batchEditingEnabled) {
            return projectsMap.get(params.value) || tCommon("unknown");
          }
          return params.value;
        },
        filter: true,
      },
      {
        headerName: t("table.category"),
        field: batchEditingEnabled ? "categoryId" : "categoryName",
        width: COLUMN_WIDTHS.CATEGORY,
        editable: batchEditingEnabled,
        cellEditor: batchEditingEnabled ? "agSelectCellEditor" : undefined,
        cellEditorParams: batchEditingEnabled
          ? {
              values: categories.filter((c) => c.isActive).map((c) => c.id),
            }
          : undefined,
        valueFormatter: (params) => {
          if (batchEditingEnabled) {
            return categoriesMap.get(params.value) || tCommon("unknown");
          }
          return params.value;
        },
        filter: true,
      },
      {
        headerName: t("table.details"),
        field: "details",
        flex: 1,
        editable: batchEditingEnabled,
        cellEditor: "agLargeTextCellEditor",
        cellEditorParams: {
          maxLength: WORK_LOG_CONSTRAINTS.DETAILS.MAX_LENGTH,
          rows: 5,
          cols: 50,
        },
        tooltipField: "details",
        wrapText: true,
        autoHeight: true,
        cellStyle: {
          lineHeight: "1.4",
          padding: "8px",
          whiteSpace: "normal",
          wordWrap: "break-word",
        },
      },
    ];

    // Add Actions column only when batch editing is disabled
    if (!batchEditingEnabled) {
      columns.push({
        headerName: t("table.actions"),
        cellRenderer: ActionsCellRenderer,
        width: COLUMN_WIDTHS.ACTIONS,
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
    t,
    tCommon,
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

  // Row class function for highlighting failed records
  const getRowClass = useCallback(
    (params: RowClassParams) => {
      if (failedWorkLogIds.has(params.data.id)) {
        return "ag-row-error";
      }
      return "";
    },
    [failedWorkLogIds],
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
      toast.info(t("noChanges"));
      return;
    }

    setIsSubmitting(true);

    try {
      // Use batch API endpoint for bulk update within transaction
      const updates = Array.from(pendingChanges.entries()).map(
        ([id, data]) => ({
          id,
          data,
        }),
      );

      const response = await fetch("/api/work-logs/batch", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Batch update failed");
      }

      const result = await response.json();

      if (result.success) {
        toast.success(t("messages.batchSaved", { count: pendingChanges.size }));
        setPendingChanges(new Map());
        setFailedWorkLogIds(new Set());
        setBatchEditingEnabled(false);
        // Refetch data
        onRefresh?.();
      } else {
        throw new Error(result.error?.message || "Batch update failed");
      }
    } catch (error) {
      toast.error(t("messages.batchSaveError"));
      console.error("Batch save error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [pendingChanges, onRefresh, t]);

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
    setFailedWorkLogIds(new Set()); // Clear failed work log highlights
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
              {t("title")}
            </h2>
            <p className="text-muted-foreground">
              {t("subtitle")}
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
                  {t("batchEdit")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setSelectedWorkLog(null);
                    setFormOpen(true);
                  }}
                >
                  {t("addNew")}
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
                    ? t("saving")
                    : t("batchSave", { count: pendingChanges.size })}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleCancelBatchEditing}
                  disabled={isSubmitting}
                >
                  {t("cancel")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">{t("loading")}</div>
      ) : (
        <div
          className={`ag-theme-quartz ag-work-log-table h-[600px] w-full border rounded-lg${batchEditingEnabled ? " batch-editing" : ""}`}
        >
          <AgGridReact
            ref={gridRef}
            className="h-full w-full"
            theme="legacy"
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            getRowClass={getRowClass}
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
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteConfirmation")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? t("buttons.deleting") : t("buttons.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmCancel")}</DialogTitle>
            <DialogDescription>
              {t("unsavedChanges", { count: pendingChanges.size })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              {t("continueEditing")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>
              {t("discardChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
