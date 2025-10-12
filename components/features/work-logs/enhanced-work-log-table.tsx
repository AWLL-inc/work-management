"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  ColDef,
  CellEditingStoppedEvent,
  RowClassParams,
  GridReadyEvent,
} from "ag-grid-community";
import type { Project, WorkCategory, WorkLog } from "@/drizzle/schema";
import { formatDateForDisplay, parseDate } from "@/lib/utils";
import { WORK_LOG_CONSTRAINTS } from "@/lib/validations";
import { EnhancedAGGrid } from "@/components/data-table/enhanced/enhanced-ag-grid";
import { WorkLogFormDialog } from "./work-log-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Column width constants
const COLUMN_WIDTHS = {
  DATE: 120,
  HOURS: 100,
  PROJECT: 200,
  CATEGORY: 180,
  ACTIONS: 150,
} as const;

// Validation helper functions
interface CellValidationResult {
  valid: boolean;
  message?: string;
}

const validateHours = (value: string): CellValidationResult => {
  if (!value) {
    return { valid: false, message: "時間を入力してください" };
  }
  if (!WORK_LOG_CONSTRAINTS.HOURS.PATTERN.test(value)) {
    return {
      valid: false,
      message: "数値で入力してください（例: 8 または 8.5）",
    };
  }
  const hours = parseFloat(value);
  if (hours <= WORK_LOG_CONSTRAINTS.HOURS.MIN) {
    return { valid: false, message: "0より大きい値を入力してください" };
  }
  if (hours > WORK_LOG_CONSTRAINTS.HOURS.MAX) {
    return { valid: false, message: "168以下で入力してください" };
  }
  return { valid: true };
};

const validateDate = (value: string): CellValidationResult => {
  if (!value) {
    return { valid: false, message: "日付を入力してください" };
  }
  const date = parseDate(value);
  if (!date) {
    return {
      valid: false,
      message: "有効な日付をYYYY-MM-DD形式で入力してください",
    };
  }
  return { valid: true };
};

interface EnhancedWorkLogTableProps {
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
  onBatchUpdateWorkLogs?: (
    updates: Array<{
      id: string;
      data: Partial<WorkLog>;
    }>
  ) => Promise<void>;
  onRefresh?: () => void;
  isLoading: boolean;
}

interface WorkLogGridRow extends WorkLog {
  projectName?: string;
  categoryName?: string;
}

export function EnhancedWorkLogTable({
  workLogs,
  projects,
  categories,
  onCreateWorkLog,
  onUpdateWorkLog,
  onDeleteWorkLog,
  onBatchUpdateWorkLogs,
  onRefresh,
  isLoading,
}: EnhancedWorkLogTableProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedWorkLog, setSelectedWorkLog] = useState<WorkLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failedWorkLogIds, setFailedWorkLogIds] = useState<Set<string>>(new Set());

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
      </div>
    );
  }, []);

  // Column definitions
  const columnDefs: ColDef[] = useMemo(() => {
    return [
      {
        headerName: "Date",
        field: "date",
        width: COLUMN_WIDTHS.DATE,
        editable: true,
        cellEditor: "agDateCellEditor",
        cellEditorParams: {
          format: "yyyy-mm-dd",
        },
        valueFormatter: (params) => formatDateForDisplay(params.value),
        valueParser: (params) => {
          const { newValue, oldValue } = params;

          if (!newValue) {
            return oldValue;
          }

          const date = parseDate(newValue);
          if (!date) {
            toast.error("有効な日付をYYYY-MM-DD形式で入力してください");
            return oldValue;
          }

          return newValue;
        },
        sort: "desc",
        cellClass: (params) => {
          const validation = validateDate(params.value);
          return validation.valid ? "" : "ag-cell-invalid";
        },
        tooltipValueGetter: (params) => {
          const validation = validateDate(params.value);
          return validation.message || "";
        },
      },
      {
        headerName: "Hours",
        field: "hours",
        width: COLUMN_WIDTHS.HOURS,
        editable: true,
        cellEditor: "agTextCellEditor",
        cellEditorParams: {
          maxLength: WORK_LOG_CONSTRAINTS.HOURS.MAX_LENGTH,
        },
        valueParser: (params) => {
          const value = params.newValue;

          if (!value) {
            toast.error("時間を入力してください");
            return params.oldValue;
          }

          if (!WORK_LOG_CONSTRAINTS.HOURS.PATTERN.test(value)) {
            toast.error("時間は数値で入力してください（例: 8 または 8.5）");
            return params.oldValue;
          }

          const hours = parseFloat(value);
          if (hours <= WORK_LOG_CONSTRAINTS.HOURS.MIN) {
            toast.error("時間は0より大きい値を入力してください");
            return params.oldValue;
          }

          if (hours > WORK_LOG_CONSTRAINTS.HOURS.MAX) {
            toast.error("時間は168以下で入力してください");
            return params.oldValue;
          }

          return value;
        },
        cellClass: (params) => {
          const validation = validateHours(params.value);
          return validation.valid ? "" : "ag-cell-invalid";
        },
        tooltipValueGetter: (params) => {
          const validation = validateHours(params.value);
          return validation.message || "";
        },
      },
      {
        headerName: "Project",
        field: "projectId",
        width: COLUMN_WIDTHS.PROJECT,
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: projects.filter((p) => p.isActive).map((p) => p.id),
        },
        valueFormatter: (params) => {
          return projectsMap.get(params.value) || "Unknown";
        },
        filter: true,
      },
      {
        headerName: "Category",
        field: "categoryId",
        width: COLUMN_WIDTHS.CATEGORY,
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: categories.filter((c) => c.isActive).map((c) => c.id),
        },
        valueFormatter: (params) => {
          return categoriesMap.get(params.value) || "Unknown";
        },
        filter: true,
      },
      {
        headerName: "Details",
        field: "details",
        flex: 1,
        editable: true,
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
      {
        headerName: "Actions",
        cellRenderer: ActionsCellRenderer,
        width: COLUMN_WIDTHS.ACTIONS,
        sortable: false,
        filter: false,
        pinned: "right",
        editable: false,
      },
    ];
  }, [
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

  // Handle row addition
  const handleRowAdd = useCallback(async (newRows: WorkLog[]) => {
    try {
      for (const row of newRows) {
        // Create new work log with default values
        await onCreateWorkLog({
          date: typeof row.date === 'string' ? row.date : new Date().toISOString().split('T')[0],
          hours: String(row.hours || "0"),
          projectId: row.projectId || (projects.find(p => p.isActive)?.id || ""),
          categoryId: row.categoryId || (categories.find(c => c.isActive)?.id || ""),
          details: row.details || "",
        });
      }
      onRefresh?.();
    } catch (error) {
      console.error("Failed to add rows:", error);
      throw error;
    }
  }, [onCreateWorkLog, projects, categories, onRefresh]);

  // Handle row updates
  const handleRowUpdate = useCallback(async (updates: Array<{ id: string; data: Partial<WorkLog> }>) => {
    try {
      if (onBatchUpdateWorkLogs) {
        await onBatchUpdateWorkLogs(updates);
      } else {
        // Fall back to individual updates
        for (const update of updates) {
          const updateData = {
            ...update.data,
            date: typeof update.data.date === 'string' ? update.data.date : update.data.date?.toISOString().split('T')[0],
          };
          // Remove undefined values to match expected interface
          const cleanedData = Object.fromEntries(
            Object.entries(updateData).filter(([_, value]) => value !== undefined)
          ) as {
            date?: string;
            hours?: string;
            projectId?: string;
            categoryId?: string;
            details?: string | null;
          };
          await onUpdateWorkLog(update.id, cleanedData);
        }
      }
      setFailedWorkLogIds(new Set());
      onRefresh?.();
    } catch (error) {
      console.error("Failed to update rows:", error);
      throw error;
    }
  }, [onBatchUpdateWorkLogs, onUpdateWorkLog, onRefresh]);

  // Handle row deletion
  const handleRowDelete = useCallback(async (ids: string[]) => {
    try {
      for (const id of ids) {
        await onDeleteWorkLog(id);
      }
      onRefresh?.();
    } catch (error) {
      console.error("Failed to delete rows:", error);
      throw error;
    }
  }, [onDeleteWorkLog, onRefresh]);

  // Handle form submission
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
      onRefresh?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-8">Loading work logs...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border-2 border-primary/20 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary mb-2">
              Enhanced Work Logs Management
            </h2>
            <p className="text-muted-foreground">
              Advanced spreadsheet-like interface with Excel-compatible features
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setSelectedWorkLog(null);
                setFormOpen(true);
              }}
            >
              Add Work Log (Dialog)
            </Button>
          </div>
        </div>
      </div>

      <EnhancedAGGrid<WorkLog>
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowClass={getRowClass}
        onGridReady={onGridReady}
        onRowAdd={handleRowAdd}
        onRowUpdate={handleRowUpdate}
        onRowDelete={handleRowDelete}
        enableToolbar={true}
        enableClipboard={true}
        enableUndoRedo={true}
        maxUndoRedoSteps={20}
      />

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
    </div>
  );
}