"use client";

import type {
  CellEditingStartedEvent,
  CellKeyDownEvent,
  CellValueChangedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  RowClassParams,
  RowHeightParams,
  SuppressKeyboardEventParams,
} from "ag-grid-community";
import { useCallback, useMemo, useState } from "react";
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
import { parseDate } from "@/lib/utils";
import { WORK_LOG_CONSTRAINTS } from "@/lib/validations";
import { CustomDateEditor } from "./custom-date-editor";
import { SearchControls } from "./search/search-controls";
import { WorkLogFormDialog } from "./work-log-form-dialog";

// Search filters type
interface SearchFilters {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  projectIds: string[];
  categoryIds: string[];
  userId: string | null;
}

// Import from API file for consistency
import type { GetWorkLogsOptions } from "@/lib/api/work-logs";

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
  onFilterChange?: (filters: GetWorkLogsOptions) => void;
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
  onFilterChange,
  isLoading,
}: EnhancedWorkLogTableProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedWorkLog, setSelectedWorkLog] = useState<WorkLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failedWorkLogIds, setFailedWorkLogIds] = useState<Set<string>>(
    new Set(),
  );

  // Simplified AG Grid state management
  const [batchEditingEnabled, setBatchEditingEnabled] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Search filters state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    dateRange: {
      from: undefined,
      to: undefined,
    },
    projectIds: [],
    categoryIds: [],
    userId: null,
  });

  // Create project and category lookup maps
  const projectsMap = useMemo(() => {
    return new Map(projects.map((p) => [p.id, p.name]));
  }, [projects]);

  const categoriesMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  // Prepare data with project and category names (deep copy to prevent mutation)
  const rowData: WorkLogGridRow[] = useMemo(() => {
    return workLogs.map((workLog) => {
      // Create a deep copy to prevent external mutations affecting the grid
      const workLogCopy = JSON.parse(JSON.stringify(workLog));
      return {
        ...workLogCopy,
        // Ensure date is consistently formatted as YYYY-MM-DD string (no time)
        date:
          workLogCopy.date instanceof Date
            ? workLogCopy.date.toISOString().split("T")[0]
            : typeof workLogCopy.date === "string"
              ? workLogCopy.date.split("T")[0] // Remove time part if present
              : new Date(workLogCopy.date).toISOString().split("T")[0],
        // Ensure both ID and name fields are always available
        projectId: workLogCopy.projectId || "",
        projectName: projectsMap.get(workLogCopy.projectId) || "Unknown",
        categoryId: workLogCopy.categoryId || "",
        categoryName: categoriesMap.get(workLogCopy.categoryId) || "Unknown",
      };
    });
  }, [workLogs, projectsMap, categoriesMap]);

  // AG Grid handles data management internally - no manual sync needed

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

    // Add checkbox column for selection (always available)
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

    columns.push({
      headerName: "Date",
      field: "date",
      width: COLUMN_WIDTHS.DATE,
      editable: batchEditingEnabled,
      cellEditor: CustomDateEditor,
      cellEditorParams: {},
      // Use inline editing for better UX
      cellEditorPopup: false,
      valueGetter: (params) => {
        const value = params.data.date;
        if (!value) return null;

        // For the date editor, we need to provide a consistent format
        if (value instanceof Date) {
          return value.toISOString().split("T")[0];
        }

        if (typeof value === "string") {
          // Remove time component if present
          return value.split("T")[0];
        }

        return value;
      },
      valueFormatter: (params) => {
        const dateValue = params.value;
        if (!dateValue) return "";

        // Handle different date formats
        if (dateValue instanceof Date) {
          return dateValue.toISOString().split("T")[0].replace(/-/g, "/");
        }

        // Always format as YYYY/MM/DD for consistent display
        if (typeof dateValue === "string") {
          // Remove time part if present, then convert to display format
          const dateOnly = dateValue.split("T")[0];
          if (dateOnly.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return dateOnly.replace(/-/g, "/"); // Convert YYYY-MM-DD to YYYY/MM/DD
          }
        }

        return dateValue;
      },
      valueSetter: (params) => {
        const { newValue } = params;

        // Convert any input to YYYY-MM-DD string format
        if (newValue instanceof Date) {
          params.data.date = newValue.toISOString().split("T")[0];
        } else if (typeof newValue === "string") {
          // Handle various string formats and convert to YYYY-MM-DD
          if (newValue.includes("/")) {
            // Convert YYYY/MM/DD to YYYY-MM-DD
            params.data.date = newValue.replace(/\//g, "-");
          } else {
            // Remove time part if present
            params.data.date = newValue.split("T")[0];
          }
        } else {
          params.data.date = newValue;
        }

        return true;
      },
      valueParser: (params) => {
        const { newValue, oldValue } = params;
        if (!newValue) return newValue;

        // Convert various date formats to YYYY-MM-DD
        let dateString: string;

        if (
          newValue &&
          typeof newValue === "object" &&
          "toISOString" in newValue
        ) {
          // Handle Date object
          dateString = (newValue as Date).toISOString().split("T")[0];
        } else if (typeof newValue === "string") {
          // Handle YYYY/MM/DD format
          if (newValue.includes("/")) {
            dateString = newValue.replace(/\//g, "-");
          } else {
            // Remove time part if present
            dateString = newValue.split("T")[0];
          }
        } else {
          dateString = String(newValue);
        }

        // Validate the parsed date
        const date = parseDate(dateString);
        return date ? dateString : oldValue;
      },
      // Let AG Grid handle value setting automatically
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
        if (!value) return value; // Let validation handle empty values

        // Basic parsing - validation handled elsewhere
        if (WORK_LOG_CONSTRAINTS.HOURS.PATTERN.test(value)) {
          const hours = parseFloat(value);
          if (hours > 0 && hours <= WORK_LOG_CONSTRAINTS.HOURS.MAX) {
            return value;
          }
        }

        // Return original value if invalid - validation will catch it
        return params.oldValue;
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
      cellRenderer: batchEditingEnabled
        ? undefined
        : (params: ICellRendererParams) => {
            // In view mode, show project name
            return projectsMap.get(params.value) || "Unknown";
          },
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
      cellRenderer: batchEditingEnabled
        ? undefined
        : (params: ICellRendererParams) => {
            // In view mode, show category name
            return categoriesMap.get(params.value) || "Unknown";
          },
    });

    columns.push({
      headerName: "Details",
      field: "details",
      flex: 1,
      editable: batchEditingEnabled,
      cellEditor: "agLargeTextCellEditor",
      cellEditorParams: {
        maxLength: WORK_LOG_CONSTRAINTS.DETAILS.MAX_LENGTH,
        rows: 3,
        cols: 50,
      },
      cellEditorPopup: true,
      tooltipField: "details",
      wrapText: true,
      autoHeight: true,
      cellStyle: {
        lineHeight: "1.4",
        padding: "8px",
        whiteSpace: "pre-wrap", // 改行文字を表示
        wordWrap: "break-word",
        overflow: "visible",
        display: "block",
        textAlign: "left",
      },
      cellClass: "details-cell",
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

  // Row height calculation for multi-line details
  const getRowHeight = useCallback((params: RowHeightParams) => {
    const details = params.data?.details;
    if (!details) return 50; // Default height

    // Count line breaks and estimate height
    const lineBreaks = (details.match(/\n/g) || []).length;
    if (lineBreaks > 0) {
      // Base height + extra height per line (roughly 20px per line)
      return Math.max(50, 40 + (lineBreaks + 1) * 20);
    }

    return 50; // Default height
  }, []);

  // Default column properties
  const defaultColDef: ColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: false, // Disable filtering for all columns
      floatingFilter: false, // Disable floating filters
      suppressKeyboardEvent: (params: SuppressKeyboardEventParams) => {
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

  // AG Grid standard: Handle row addition with applyTransaction
  const handleRowAdd = useCallback(
    async (_newRows: WorkLogGridRow[]) => {
      if (!batchEditingEnabled) {
        toast.info("一括編集モードを有効にしてください");
        return;
      }

      if (!gridApi) {
        toast.error("グリッドが初期化されていません");
        return;
      }

      // Create new row with empty values for user to fill
      const newRow: WorkLogGridRow = {
        id: crypto.randomUUID(),
        date: new Date(), // Default to current date
        hours: "", // Empty - user will fill in
        projectId: "",
        projectName: "",
        categoryId: "",
        categoryName: "",
        details: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "", // Will be set by backend
      };

      // AG Grid standard: Add row using applyTransaction
      const result = gridApi.applyTransaction({
        add: [newRow],
        addIndex: 0, // Add at top
      });

      if (result?.add && result.add.length > 0) {
        toast.success("新しい行を追加しました（Ctrl+N で連続追加可能）");

        // Just focus on the new row without starting edit mode for better UX
        setTimeout(() => {
          gridApi.setFocusedCell(0, "date");
          // Don't auto-start editing to allow continuous row addition
          // User can press Enter or double-click to start editing
        }, 100);
      }
    },
    [batchEditingEnabled, gridApi],
  );

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

  // Handle immediate row deletion (non-batch mode)
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

  // Handle batch deletion (batch editing mode)
  const handleBatchDelete = useCallback(
    async (_ids: string[]) => {
      if (!gridApi) return;

      // Get selected rows for deletion
      const selectedNodes = gridApi.getSelectedNodes();
      if (selectedNodes.length === 0) {
        toast.info("削除する行を選択してください");
        return;
      }

      const selectedData = selectedNodes
        .map((node) => node.data)
        .filter(Boolean);

      // Remove from AG Grid only (don't call API)
      gridApi.applyTransaction({ remove: selectedData });

      toast.success(
        `${selectedData.length}行をバッチ削除対象に追加しました（保存時に反映されます）`,
      );
    },
    [gridApi],
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

  // AG Grid standard: Simple cell value change handler
  const _onCellValueChanged = useCallback(
    (event: CellValueChangedEvent) => {
      const { data, colDef, newValue } = event;
      const field = colDef.field;

      if (!field) return;

      // Update related fields for consistency (project/category names)
      if (field === "projectId") {
        data.projectName = projectsMap.get(newValue) || "Unknown";
      } else if (field === "categoryId") {
        data.categoryName = categoriesMap.get(newValue) || "Unknown";
      }

      // AG Grid handles the data internally - no manual state sync needed
    },
    [projectsMap, categoriesMap],
  );

  // AG Grid standard: Minimal cell editing start handler
  const _onCellEditingStarted = useCallback(
    (_event: CellEditingStartedEvent) => {
      // Let AG Grid handle the date editor with the current value
      // No manual intervention needed
    },
    [],
  );

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

  // AG Grid standard: Simplified batch save with validation
  const handleBatchSave = useCallback(async () => {
    if (!gridApi) {
      toast.error("グリッドが初期化されていません");
      return;
    }

    // Get current data from AG Grid (source of truth)
    const currentGridData: WorkLogGridRow[] = [];
    gridApi.forEachNode((node) => {
      if (node.data) {
        currentGridData.push(node.data);
      }
    });

    if (currentGridData.length === 0) {
      toast.info("データがありません");
      return;
    }

    // Separate new, updated, and deleted rows
    const originalIds = new Set(workLogs.map((wl) => wl.id));
    const currentIds = new Set(currentGridData.map((row) => row.id));

    const newRows: WorkLogGridRow[] = [];
    const updatedRows: WorkLogGridRow[] = [];
    const deletedRows: string[] = [];
    const validationErrors = new Map<string, string[]>();

    // Find deleted rows (in original but not in current)
    for (const originalRow of workLogs) {
      if (!currentIds.has(originalRow.id)) {
        deletedRows.push(originalRow.id);
      }
    }

    // Categorize and validate current rows
    for (const row of currentGridData) {
      const errors = validateWorkLogData(row);
      if (errors.length > 0) {
        validationErrors.set(row.id, errors);
        continue;
      }

      if (!originalIds.has(row.id)) {
        newRows.push(row);
      } else {
        updatedRows.push(row);
      }
    }

    // Show validation errors if any
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
      // Delete removed rows
      if (deletedRows.length > 0) {
        const deletePromises = deletedRows.map((id) => onDeleteWorkLog(id));
        await Promise.all(deletePromises);
      }

      // Create new rows
      if (newRows.length > 0) {
        const createPromises = newRows.map((row) => {
          const createData = {
            date:
              row.date instanceof Date
                ? row.date.toISOString().split("T")[0]
                : row.date,
            hours: row.hours,
            projectId: row.projectId,
            categoryId: row.categoryId,
            details: row.details || "",
          };
          return onCreateWorkLog(createData);
        });
        await Promise.all(createPromises);
      }

      // Update existing rows
      if (updatedRows.length > 0) {
        const updatePromises = updatedRows.map((row) => {
          const updateData = {
            date:
              row.date instanceof Date
                ? row.date.toISOString().split("T")[0]
                : row.date,
            hours: row.hours,
            projectId: row.projectId,
            categoryId: row.categoryId,
            details: row.details || "",
          };
          return onUpdateWorkLog(row.id, updateData);
        });
        await Promise.all(updatePromises);
      }

      // Success
      const _totalChanges =
        newRows.length + updatedRows.length + deletedRows.length;
      const changeDetails = [];
      if (newRows.length > 0) changeDetails.push(`${newRows.length}件追加`);
      if (updatedRows.length > 0)
        changeDetails.push(`${updatedRows.length}件更新`);
      if (deletedRows.length > 0)
        changeDetails.push(`${deletedRows.length}件削除`);

      toast.success(`バッチ処理完了: ${changeDetails.join(", ")}`);
      setFailedWorkLogIds(new Set());
      setBatchEditingEnabled(false);
      onRefresh?.();
    } catch (error) {
      console.error("Batch save error:", error);

      if (error instanceof Error) {
        toast.error(`保存に失敗しました: ${error.message}`);
      } else {
        toast.error("保存に失敗しました");
      }

      // Mark all changed rows as failed (for new/updated rows)
      const failedIds = [...newRows, ...updatedRows].map((row) => row.id);
      setFailedWorkLogIds(new Set(failedIds));

      // Note: Deleted rows can't be highlighted as they're no longer in the grid
    } finally {
      setIsSubmitting(false);
    }
  }, [
    gridApi,
    workLogs,
    validateWorkLogData,
    onCreateWorkLog,
    onUpdateWorkLog,
    onDeleteWorkLog,
    onRefresh,
  ]);

  // AG Grid standard: Simplified cancel batch editing
  const handleCancelBatchEditing = useCallback(() => {
    if (!gridApi) {
      setBatchEditingEnabled(false);
      return;
    }

    // Check for any changes (additions or deletions)
    const currentRowCount = gridApi.getDisplayedRowCount();
    const originalRowCount = workLogs.length;

    // Also check if any rows were deleted
    const currentIds = new Set<string>();
    gridApi.forEachNode((node) => {
      if (node.data?.id) currentIds.add(node.data.id);
    });

    const _originalIds = new Set(workLogs.map((wl) => wl.id));
    const hasDeletedRows = workLogs.some((wl) => !currentIds.has(wl.id));
    const hasNewRows = currentRowCount > originalRowCount;

    if (hasNewRows || hasDeletedRows) {
      setCancelDialogOpen(true);
    } else {
      setBatchEditingEnabled(false);
    }
  }, [gridApi, workLogs]);

  // AG Grid standard: Reset to original data
  const handleConfirmCancel = () => {
    if (gridApi) {
      // Reset AG Grid data to original workLogs data
      gridApi.setGridOption("rowData", rowData);
    }

    setFailedWorkLogIds(new Set());
    setBatchEditingEnabled(false);
    setCancelDialogOpen(false);
  };

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  // AG Grid automatically handles column sizing and refresh

  if (isLoading) {
    return <div className="text-center py-8">Loading work logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border-2 border-primary/20 p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-primary mb-2">
            Enhanced Work Logs Management
          </h2>
          <p className="text-muted-foreground">
            Advanced spreadsheet-like interface with Excel-compatible features
          </p>
        </div>
      </div>

      {/* Search Controls */}
      <SearchControls
        filters={searchFilters}
        onFiltersChange={setSearchFilters}
        projects={projects}
        categories={categories}
        // users={users} // Will be added when user API is available
        showUserFilter={false} // Will be true when user role checking is implemented
        onApplyFilters={() => {
          if (onFilterChange) {
            const apiFilters: GetWorkLogsOptions = {
              startDate: searchFilters.dateRange.from
                ?.toISOString()
                .split("T")[0],
              endDate: searchFilters.dateRange.to?.toISOString().split("T")[0],
              projectIds:
                searchFilters.projectIds.length > 0
                  ? searchFilters.projectIds.join(",")
                  : undefined,
              categoryIds:
                searchFilters.categoryIds.length > 0
                  ? searchFilters.categoryIds.join(",")
                  : undefined,
              userId: searchFilters.userId ?? undefined,
            };
            onFilterChange(apiFilters);
          }
        }}
        onClearFilters={() => {
          if (onFilterChange) {
            onFilterChange({});
          }
        }}
        isLoading={isLoading}
        className="mb-4"
      />

      <EnhancedAGGrid<WorkLog>
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowClass={getRowClass}
        getRowHeight={getRowHeight}
        onGridReady={onGridReady}
        // Cell value changes handled via column definitions
        // onCellEditingStarted handled at column level
        onRowAdd={handleRowAdd} // Pass our handleRowAdd to toolbar
        onDataChange={undefined} // Disable data change callback to prevent external interference
        onRowUpdate={handleRowUpdate}
        onRowDelete={batchEditingEnabled ? handleBatchDelete : handleRowDelete}
        enableToolbar={true}
        batchEditingEnabled={batchEditingEnabled}
        enableUndoRedo={true}
        maxUndoRedoSteps={20}
        // Filtering features
        enableQuickFilter={false}
        enableFloatingFilter={false}
        enableFilterToolPanel={false}
        // Work Log specific toolbar buttons
        onToggleBatchEdit={() => setBatchEditingEnabled(true)}
        onAddWorkLog={() => {
          setSelectedWorkLog(null);
          setFormOpen(true);
        }}
        onBatchSave={handleBatchSave}
        onCancelBatchEdit={handleCancelBatchEditing}
        isSavingBatch={isSubmitting}
        gridOptions={{
          rowSelection: "multiple",
          suppressRowClickSelection: false, // Always allow row selection
          singleClickEdit: batchEditingEnabled,
          stopEditingWhenCellsLoseFocus: true,
          enterNavigatesVertically: true,
          suppressColumnVirtualisation: true, // Prevent column virtualization issues
          ensureDomOrder: true, // Ensure DOM order matches logical order
          suppressCellFocus: false, // Allow cell focus
          suppressRowTransform: true, // Prevent row transformation that might affect data
          rowBuffer: 0, // Don't buffer rows to avoid data inconsistencies
          animateRows: false, // Disable row animation to prevent data conflicts
          onCellKeyDown: (event: CellKeyDownEvent) => {
            const keyboardEvent = event.event as KeyboardEvent;
            const key = keyboardEvent?.key?.toLowerCase();
            const ctrlKey = keyboardEvent?.ctrlKey;

            if (ctrlKey && key === "n" && batchEditingEnabled) {
              keyboardEvent?.preventDefault();
              handleRowAdd([]);
            } else if (
              key === "delete" &&
              !event.api.getEditingCells().length
            ) {
              // Delete selected rows when not editing
              keyboardEvent?.preventDefault();
              handleRowDelete([]);
            } else if (ctrlKey && key === "d" && batchEditingEnabled) {
              // Duplicate selected rows handled by toolbar
              keyboardEvent?.preventDefault();
            }
          },
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
              未保存の変更があります。
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
