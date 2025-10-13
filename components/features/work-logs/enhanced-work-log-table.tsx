"use client";

import type {
  CellEditingStoppedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  RowClassParams,
} from "ag-grid-community";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EnhancedAGGrid } from "@/components/data-table/enhanced/enhanced-ag-grid";
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
import { WorkLogFormDialog } from "./work-log-form-dialog";

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
    }>,
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
  const [failedWorkLogIds, setFailedWorkLogIds] = useState<Set<string>>(
    new Set(),
  );

  // Batch editing state
  const [batchEditingEnabled, setBatchEditingEnabled] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<
    Map<string, Partial<WorkLog>>
  >(new Map());
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

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
      // Ensure date is consistently formatted as YYYY-MM-DD string (no time)
      date: workLog.date instanceof Date 
        ? workLog.date.toISOString().split('T')[0] 
        : typeof workLog.date === 'string' 
          ? workLog.date.split('T')[0] // Remove time part if present
          : new Date(workLog.date).toISOString().split('T')[0],
      // Ensure both ID and name fields are always available
      projectId: workLog.projectId || "",
      projectName: projectsMap.get(workLog.projectId) || "Unknown",
      categoryId: workLog.categoryId || "",
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
    const columns: ColDef[] = [];

    // Add checkbox column for selection when not in batch editing mode
    if (!batchEditingEnabled) {
      columns.push({
        headerName: "",
        checkboxSelection: true,
        headerCheckboxSelection: true,
        width: 50,
        pinned: "left",
        lockPosition: "left",
        sortable: false,
        filter: false,
      });
    }

    columns.push({
      headerName: "Date",
      field: "date",
      width: COLUMN_WIDTHS.DATE,
      editable: batchEditingEnabled,
      cellEditor: "agDateCellEditor",
      cellEditorParams: {
        format: "yyyy-mm-dd",
      },
      valueFormatter: (params) => {
        if (batchEditingEnabled) {
          // In batch editing mode, show raw date value for editing
          return params.value || "";
        } else {
          // In view mode, format for display
          return formatDateForDisplay(params.value);
        }
      },
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
      valueSetter: (params) => {
        // Ensure the value is stored as string in YYYY-MM-DD format only
        const { newValue } = params;
        if (newValue instanceof Date) {
          params.data.date = newValue.toISOString().split('T')[0];
        } else if (typeof newValue === 'string') {
          // Remove time part if present
          params.data.date = newValue.split('T')[0];
        } else {
          params.data.date = newValue;
        }
        return true;
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
    });

    columns.push({
      headerName: "Hours",
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
        if (!batchEditingEnabled) return "";
        const validation = validateHours(params.value);
        return validation.valid ? "" : "ag-cell-invalid";
      },
      tooltipValueGetter: (params) => {
        if (!batchEditingEnabled) return "";
        const validation = validateHours(params.value);
        return validation.message || "";
      },
    });

    columns.push({
      headerName: "Project",
      field: "projectId", // Always use projectId field
      width: COLUMN_WIDTHS.PROJECT,
      editable: batchEditingEnabled,
      cellEditor: batchEditingEnabled ? "agSelectCellEditor" : undefined,
      cellEditorParams: batchEditingEnabled
        ? {
            values: projects.filter((p) => p.isActive).map((p) => p.id),
            formatValue: (value: string) => {
              return projectsMap.get(value) || value;
            },
            valueListGap: 0,
            valueListMaxHeight: 200,
          }
        : undefined,
      valueFormatter: (params) => {
        if (batchEditingEnabled) {
          // In edit mode, ensure we show the name but maintain the ID value
          const projectName = projectsMap.get(params.value);
          return projectName || "プロジェクトを選択してください";
        } else {
          // In view mode, show project name
          return projectsMap.get(params.value) || "Unknown";
        }
      },
      valueGetter: (params) => {
        // Ensure we always return the projectId for editing
        return params.data.projectId;
      },
      valueSetter: (params) => {
        // Ensure the projectId is stored correctly
        const { newValue } = params;
        params.data.projectId = newValue;
        // Also update projectName for consistency
        params.data.projectName = projectsMap.get(newValue) || "Unknown";
        return true;
      },
      cellRenderer: batchEditingEnabled ? undefined : ((params) => {
        // In view mode, show project name
        return projectsMap.get(params.value) || "Unknown";
      }),
      filter: true,
    });

    columns.push({
      headerName: "Category",
      field: "categoryId", // Always use categoryId field
      width: COLUMN_WIDTHS.CATEGORY,
      editable: batchEditingEnabled,
      cellEditor: batchEditingEnabled ? "agSelectCellEditor" : undefined,
      cellEditorParams: batchEditingEnabled
        ? {
            values: categories.filter((c) => c.isActive).map((c) => c.id),
            formatValue: (value: string) => {
              return categoriesMap.get(value) || value;
            },
            valueListGap: 0,
            valueListMaxHeight: 200,
          }
        : undefined,
      valueFormatter: (params) => {
        if (batchEditingEnabled) {
          // In edit mode, ensure we show the name but maintain the ID value
          const categoryName = categoriesMap.get(params.value);
          return categoryName || "カテゴリを選択してください";
        } else {
          // In view mode, show category name
          return categoriesMap.get(params.value) || "Unknown";
        }
      },
      valueGetter: (params) => {
        // Ensure we always return the categoryId for editing
        return params.data.categoryId;
      },
      valueSetter: (params) => {
        // Ensure the categoryId is stored correctly
        const { newValue } = params;
        params.data.categoryId = newValue;
        // Also update categoryName for consistency
        params.data.categoryName = categoriesMap.get(newValue) || "Unknown";
        return true;
      },
      cellRenderer: batchEditingEnabled ? undefined : ((params) => {
        // In view mode, show category name
        return categoriesMap.get(params.value) || "Unknown";
      }),
      filter: true,
    });

    columns.push({
      headerName: "Details",
      field: "details",
      flex: 1,
      editable: batchEditingEnabled,
      cellEditor: "agLargeTextCellEditor",
      cellEditorParams: {
        maxLength: WORK_LOG_CONSTRAINTS.DETAILS.MAX_LENGTH,
        rows: 2,
        cols: 40,
      },
      tooltipField: "details",
      wrapText: false,
      cellStyle: {
        lineHeight: "1.2",
        padding: "4px 8px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
      cellRenderer: (params: { value: string }) => {
        const value = params.value || "";
        if (value.length > 50) {
          return `${value.substring(0, 50)}...`;
        }
        return value;
      },
    });

    // Add Actions column only when not in batch editing mode
    if (!batchEditingEnabled) {
      columns.push({
        headerName: "Actions",
        cellRenderer: ActionsCellRenderer,
        width: COLUMN_WIDTHS.ACTIONS,
        sortable: false,
        filter: false,
        pinned: "right",
        editable: false,
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

  // Handle row addition (local only, no API call)
  const handleRowAdd = useCallback(async (newRows: WorkLog[]) => {
    // Add rows locally to the grid, API save will happen when user actually saves
    // Add new rows to pending changes so save button becomes active
    setPendingChanges((prev) => {
      const newChanges = new Map(prev);
      for (const row of newRows) {
        // Mark as new row with empty values that need to be filled
        newChanges.set(row.id, {
          date: row.date || "",
          hours: row.hours || "",
          projectId: row.projectId || "",
          categoryId: row.categoryId || "",
          details: row.details || "",
        });
      }
      return newChanges;
    });

    toast.success(
      `${newRows.length}行を追加しました（各項目を入力して保存してください）`,
    );
  }, []);

  // Handle row updates
  const handleRowUpdate = useCallback(
    async (updates: Array<{ id: string; data: Partial<WorkLog> }>) => {
      try {
        if (onBatchUpdateWorkLogs) {
          await onBatchUpdateWorkLogs(updates);
        } else {
          // Fall back to individual updates
          for (const update of updates) {
            const updateData = {
              ...update.data,
              date:
                typeof update.data.date === "string"
                  ? update.data.date
                  : update.data.date?.toISOString().split("T")[0],
            };
            // Remove undefined values to match expected interface
            const cleanedData = Object.fromEntries(
              Object.entries(updateData).filter(
                ([_, value]) => value !== undefined,
              ),
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
    },
    [onBatchUpdateWorkLogs, onUpdateWorkLog, onRefresh],
  );

  // Handle row deletion
  const handleRowDelete = useCallback(
    async (ids: string[]) => {
      try {
        for (const id of ids) {
          await onDeleteWorkLog(id);
        }
        onRefresh?.();
      } catch (error) {
        console.error("Failed to delete rows:", error);
        throw error;
      }
    },
    [onDeleteWorkLog, onRefresh],
  );

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

  // Handle cell editing - store changes instead of immediate save
  const onCellEditingStopped = useCallback((event: CellEditingStoppedEvent) => {
    const { data, colDef, newValue, oldValue } = event;

    if (newValue === oldValue) return;

    const field = colDef.field;
    if (!field) return;

    // Update related fields for consistency
    if (field === "projectId") {
      // Update projectName when projectId changes
      data.projectName = projectsMap.get(newValue) || "Unknown";
    } else if (field === "categoryId") {
      // Update categoryName when categoryId changes
      data.categoryName = categoriesMap.get(newValue) || "Unknown";
    }

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
  }, [projectsMap, categoriesMap]);

  // Validate work log data
  const validateWorkLogData = useCallback((data: Partial<WorkLog>) => {
    const errors: string[] = [];

    if (!data.date) {
      errors.push("日付は必須です");
    }

    if (!data.hours || data.hours.trim() === "") {
      errors.push("時間は必須です");
    } else {
      const hours = parseFloat(data.hours);
      if (Number.isNaN(hours) || hours <= 0 || hours > 168) {
        errors.push("時間は0〜168の範囲で入力してください");
      }
      // Check pattern
      if (!WORK_LOG_CONSTRAINTS.HOURS.PATTERN.test(data.hours)) {
        errors.push("時間は数値で入力してください（例: 8 または 8.5）");
      }
    }

    if (!data.projectId || data.projectId.trim() === "") {
      errors.push("プロジェクトを選択してください");
    } else {
      // Check if it's a valid UUID format (basic check)
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(data.projectId)) {
        errors.push("有効なプロジェクトを選択してください");
      }
    }

    if (!data.categoryId || data.categoryId.trim() === "") {
      errors.push("カテゴリを選択してください");
    } else {
      // Check if it's a valid UUID format (basic check)
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(data.categoryId)) {
        errors.push("有効なカテゴリを選択してください");
      }
    }

    // Check details length if provided
    if (
      data.details &&
      data.details.length > WORK_LOG_CONSTRAINTS.DETAILS.MAX_LENGTH
    ) {
      errors.push(
        `詳細は${WORK_LOG_CONSTRAINTS.DETAILS.MAX_LENGTH}文字以下で入力してください`,
      );
    }

    return errors;
  }, []);

  // Handle batch save
  const handleBatchSave = useCallback(async () => {
    // Determine which changes to process
    let changesToProcess = pendingChanges;
    
    // In batch editing mode, if no changes were made, use current grid data
    if (pendingChanges.size === 0) {
      const currentPendingChanges = new Map<string, Partial<WorkLog>>();
      gridApi?.forEachNode((node) => {
        if (node.data) {
          currentPendingChanges.set(node.data.id, {
            date: node.data.date,
            hours: node.data.hours,
            projectId: node.data.projectId,
            categoryId: node.data.categoryId,
            details: node.data.details || "",
          });
        }
      });
      
      if (currentPendingChanges.size === 0) {
        toast.info("データがありません");
        return;
      }
      
      changesToProcess = currentPendingChanges;
    }

    // Validate all changes before saving
    const validationErrors = new Map<string, string[]>();

    for (const [id, data] of changesToProcess.entries()) {
      // Get complete row data from grid
      const gridRow = gridApi?.getRowNode(id)?.data;
      const completeData = { ...gridRow, ...data };

      const errors = validateWorkLogData(completeData);
      if (errors.length > 0) {
        validationErrors.set(id, errors);
      }
    }

    // If there are validation errors, show them and mark failed rows
    if (validationErrors.size > 0) {
      const errorMessages = Array.from(validationErrors.entries())
        .map(
          ([id, errors]) => `ID: ${id.slice(0, 8)}... - ${errors.join(", ")}`,
        )
        .join("\n");

      toast.error(`バリデーションエラー:\n${errorMessages}`);
      setFailedWorkLogIds(new Set(validationErrors.keys()));
      return;
    }

    setIsSubmitting(true);

    try {
      // Separate new rows from existing rows
      const pendingEntries = Array.from(changesToProcess.entries());
      const newRows: Array<{ id: string; data: Partial<WorkLog> }> = [];
      const existingRows: Array<{ id: string; data: Partial<WorkLog> }> = [];

      for (const [id, data] of pendingEntries) {
        // Check if this is a new row by looking at the current rowData
        const foundInRowData = rowData.find((row) => row.id === id);
        const isNewRow = !foundInRowData;

        if (isNewRow) {
          // For new rows, we need the complete data from the grid
          const gridRow = gridApi?.getRowNode(id)?.data;

          if (gridRow) {
            // Got data from grid node
            newRows.push({
              id,
              data: {
                date: gridRow.date,
                hours: gridRow.hours,
                projectId: gridRow.projectId,
                categoryId: gridRow.categoryId,
                details: gridRow.details,
                ...data, // Apply any pending changes
              },
            });
          } else {
            // Grid node not found, try to construct from pending changes
            // This happens when the row was added but grid hasn't updated yet

            // Check if we have all required fields in pending changes
            if (data.date && data.hours && data.projectId && data.categoryId) {
              newRows.push({
                id,
                data: {
                  date: data.date,
                  hours: data.hours,
                  projectId: data.projectId,
                  categoryId: data.categoryId,
                  details: data.details || "",
                },
              });
            }
          }
        } else {
          existingRows.push({ id, data });
        }
      }

      // Handle new rows first (create)
      if (newRows.length > 0) {
        const createPromises = newRows.map(({ data }) => {
          const dateStr =
            data.date instanceof Date
              ? data.date.toISOString().split("T")[0]
              : data.date || new Date().toISOString().split("T")[0];

          // Validate that required fields have actual values (not empty strings)
          if (!data.projectId || data.projectId.trim() === "") {
            throw new Error("プロジェクトを選択してください");
          }
          if (!data.categoryId || data.categoryId.trim() === "") {
            throw new Error("カテゴリを選択してください");
          }
          if (!data.hours || data.hours.trim() === "") {
            throw new Error("時間を入力してください");
          }

          const createData = {
            date: dateStr,
            hours: data.hours,
            projectId: data.projectId,
            categoryId: data.categoryId,
            details: data.details || "",
          };

          return onCreateWorkLog(createData);
        });

        await Promise.all(createPromises);
      }

      // Handle existing rows (update)
      if (existingRows.length > 0) {
        const response = await fetch("/api/work-logs/batch", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(existingRows),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error("Batch update failed:", {
            status: response.status,
            statusText: response.statusText,
            result,
          });
          throw new Error(result.error?.message || "Batch update failed");
        }

        if (!result.success) {
          throw new Error(result.error?.message || "Batch update failed");
        }
      }

      // Success - all operations completed
      toast.success(`${changesToProcess.size}件の変更を保存しました`);
      setPendingChanges(new Map());
      setFailedWorkLogIds(new Set());
      setBatchEditingEnabled(false);
      // Data refresh
      onRefresh?.();
    } catch (error) {
      console.error("Batch save error:", error);

      // Parse validation errors if available
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (
          errorMessage.includes("validation") ||
          errorMessage.includes("Invalid")
        ) {
          toast.error("バリデーションエラー: データを確認してください");
        } else {
          toast.error(`保存に失敗しました: ${errorMessage}`);
        }
      } else {
        toast.error("保存に失敗しました");
      }

      // Mark failed rows for visual indication
      const failedIds = Array.from(changesToProcess.keys());
      setFailedWorkLogIds(new Set(failedIds));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    pendingChanges,
    onRefresh,
    rowData,
    gridApi,
    onCreateWorkLog,
    validateWorkLogData,
  ]);

  // Handle cancel batch editing
  const handleCancelBatchEditing = useCallback(() => {
    if (pendingChanges.size > 0) {
      setCancelDialogOpen(true);
    } else {
      setBatchEditingEnabled(false);
    }
  }, [pendingChanges.size]);

  const handleConfirmCancel = () => {
    // Remove new rows that haven't been saved to the database
    const newRowIds = Array.from(pendingChanges.keys()).filter(
      (id) => !rowData.find((row) => row.id === id),
    );

    if (newRowIds.length > 0 && gridApi) {
      // Remove new rows from the grid
      const rowsToRemove = newRowIds
        .map((id) => gridApi.getRowNode(id)?.data)
        .filter(Boolean);
      gridApi.applyTransaction({ remove: rowsToRemove });
    }

    setPendingChanges(new Map());
    setFailedWorkLogIds(new Set());
    setBatchEditingEnabled(false);
    setCancelDialogOpen(false);
  };

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  // Sync data when batch editing mode changes
  const [prevBatchEditingEnabled, setPrevBatchEditingEnabled] = useState(batchEditingEnabled);
  
  useEffect(() => {
    if (batchEditingEnabled !== prevBatchEditingEnabled && gridApi) {
      // Force grid refresh to ensure proper data sync
      setTimeout(() => {
        gridApi.refreshCells({ force: true });
        gridApi.sizeColumnsToFit();
        
        // If entering batch editing mode, ensure all rows have complete data
        if (batchEditingEnabled) {
          // Pre-populate pendingChanges with all existing row data
          // This ensures existing values are recognized during validation
          const newPendingChanges = new Map<string, Partial<WorkLog>>();
          
          gridApi.forEachNode((node) => {
            if (node.data) {
              // Ensure projectId and categoryId are properly set
              if (!node.data.projectId && node.data.projectName) {
                // Try to find projectId from projectName
                const project = projects.find(p => p.name === node.data.projectName);
                if (project) {
                  node.data.projectId = project.id;
                }
              }
              if (!node.data.categoryId && node.data.categoryName) {
                // Try to find categoryId from categoryName
                const category = categories.find(c => c.name === node.data.categoryName);
                if (category) {
                  node.data.categoryId = category.id;
                }
              }
              
              // Ensure projectName and categoryName are set from IDs
              if (node.data.projectId && !node.data.projectName) {
                node.data.projectName = projectsMap.get(node.data.projectId) || "Unknown";
              }
              if (node.data.categoryId && !node.data.categoryName) {
                node.data.categoryName = categoriesMap.get(node.data.categoryId) || "Unknown";
              }

              // Add existing row data to pendingChanges so validation recognizes existing values
              newPendingChanges.set(node.data.id, {
                date: node.data.date,
                hours: node.data.hours,
                projectId: node.data.projectId,
                categoryId: node.data.categoryId,
                details: node.data.details || "",
              });
            }
          });
          
          // Set the pre-populated pending changes
          setPendingChanges(newPendingChanges);
          
          // Force another refresh after data sync
          gridApi.refreshCells({ force: true });
        } else {
          // When exiting batch editing mode, clear pending changes
          setPendingChanges(new Map());
        }
      }, 100);
      
      setPrevBatchEditingEnabled(batchEditingEnabled);
    }
  }, [batchEditingEnabled, prevBatchEditingEnabled, gridApi, projects, categories, projectsMap, categoriesMap]);

  if (isLoading) {
    return <div className="text-center py-8">Loading work logs...</div>;
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
                  Add Work Log (Dialog)
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

      <EnhancedAGGrid<WorkLog>
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowClass={getRowClass}
        onGridReady={onGridReady}
        onCellEditingStopped={onCellEditingStopped}
        onRowAdd={handleRowAdd}
        onDataChange={(_newData) => {
          // When data changes locally, we don't need to do anything
          // The actual save will happen when user uses the form dialog or batch save
        }}
        onRowUpdate={handleRowUpdate}
        onRowDelete={handleRowDelete}
        enableToolbar={true}
        batchEditingEnabled={batchEditingEnabled}
        enableUndoRedo={true}
        maxUndoRedoSteps={20}
        gridOptions={{
          rowSelection: "multiple",
          suppressRowClickSelection: batchEditingEnabled,
          singleClickEdit: batchEditingEnabled,
          stopEditingWhenCellsLoseFocus: true,
          enterNavigatesVertically: true,
          suppressColumnVirtualisation: true, // Prevent column virtualization issues
          ensureDomOrder: true, // Ensure DOM order matches logical order
        }}
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

      {/* Cancel batch editing confirmation dialog */}
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
