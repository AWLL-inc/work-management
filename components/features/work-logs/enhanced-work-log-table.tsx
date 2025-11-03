"use client";

import type {
  CellEditingStartedEvent,
  CellValueChangedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  RowClassParams,
  RowHeightParams,
  SuppressKeyboardEventParams,
} from "ag-grid-community";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
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
import { KeyboardShortcutsDialog } from "@/components/ui/keyboard-shortcuts-dialog";
import { useLiveRegion } from "@/components/ui/live-region";
import type { Project, WorkCategory, WorkLog } from "@/drizzle/schema";
import { ERROR_MESSAGES } from "@/lib/constants/error-messages";
import { useMediaQuery } from "@/lib/hooks";
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
import {
  validateDate,
  validateHours,
} from "@/lib/validations/work-log-validations";

// Column width constants
const COLUMN_WIDTHS = {
  DATE: 120,
  HOURS: 100,
  PROJECT: 200,
  CATEGORY: 180,
  ACTIONS: 100,
} as const;

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
  // Responsive design hook
  const { isMobile, isTablet } = useMediaQuery();

  // Accessibility - Live region announcements
  const { announce } = useLiveRegion();

  // Accessibility - Skip link target ref
  const gridRef = useRef<HTMLElement>(null);

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

  // URL state management
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize search filters from URL parameters
  const [searchFilters, setSearchFilters] = useState<SearchFilters>(() => ({
    dateRange: {
      from: searchParams.get("from")
        ? new Date(searchParams.get("from") as string)
        : undefined,
      to: searchParams.get("to")
        ? new Date(searchParams.get("to") as string)
        : undefined,
    },
    projectIds: searchParams.get("projects")?.split(",").filter(Boolean) || [],
    categoryIds:
      searchParams.get("categories")?.split(",").filter(Boolean) || [],
    userId: searchParams.get("userId") || null,
  }));

  // Update URL when filters change
  const updateUrlWithFilters = useCallback(
    (newFilters: SearchFilters) => {
      const params = new URLSearchParams();

      if (newFilters.dateRange.from) {
        params.set(
          "from",
          newFilters.dateRange.from.toISOString().split("T")[0],
        );
      }
      if (newFilters.dateRange.to) {
        params.set("to", newFilters.dateRange.to.toISOString().split("T")[0]);
      }
      if (newFilters.projectIds.length > 0) {
        params.set("projects", newFilters.projectIds.join(","));
      }
      if (newFilters.categoryIds.length > 0) {
        params.set("categories", newFilters.categoryIds.join(","));
      }
      if (newFilters.userId) {
        params.set("userId", newFilters.userId);
      }

      const newUrl = params.toString()
        ? `?${params.toString()}`
        : window.location.pathname;
      router.push(newUrl, { scroll: false });
    },
    [router],
  );

  // Debounced API filter change to reduce calls
  const debouncedFilterChange = useDebouncedCallback(
    (newFilters: SearchFilters) => {
      if (onFilterChange) {
        try {
          const apiFilters: GetWorkLogsOptions = {
            startDate: newFilters.dateRange.from?.toISOString().split("T")[0],
            endDate: newFilters.dateRange.to?.toISOString().split("T")[0],
            projectIds:
              newFilters.projectIds.length > 0
                ? newFilters.projectIds.join(",")
                : undefined,
            categoryIds:
              newFilters.categoryIds.length > 0
                ? newFilters.categoryIds.join(",")
                : undefined,
            userId: newFilters.userId || undefined,
          };
          onFilterChange(apiFilters);
        } catch (error) {
          console.error("Filter application error:", error);
          toast.error(ERROR_MESSAGES.FILTER.APPLY_FAILED);
        }
      }
    },
    500, // 500ms待機
  );

  // Handle filter changes with URL update and debounced API calls
  const handleFiltersChange = useCallback(
    (newFilters: SearchFilters) => {
      try {
        setSearchFilters(newFilters);
        updateUrlWithFilters(newFilters);
        debouncedFilterChange(newFilters); // デバウンスされたAPI呼び出し
      } catch (error) {
        console.error("Filter state update error:", error);
        toast.error(ERROR_MESSAGES.FILTER.UPDATE_FAILED);
      }
    },
    [updateUrlWithFilters, debouncedFilterChange],
  );

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
      <div className="flex h-full items-center justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="h-7 px-3 text-xs"
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
      hide: isMobile, // Hide on mobile devices
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
      hide: isMobile, // Hide on mobile devices
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
      hide: isMobile || isTablet, // Hide on mobile and tablet devices
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
        minWidth: 100,
        sortable: false,
        filter: false,
        pinned: "right",
        editable: false,
        cellClass: "actions-cell",
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
    isMobile,
    isTablet,
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
        toast.error(ERROR_MESSAGES.GRID.NOT_INITIALIZED);
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
        const message = "新しい行を追加しました（Ctrl+N で連続追加可能）";
        toast.success(message);
        announce(message);

        // Just focus on the new row without starting edit mode for better UX
        setTimeout(() => {
          gridApi.setFocusedCell(0, "date");
          // Don't auto-start editing to allow continuous row addition
          // User can press Enter or double-click to start editing
        }, 100);
      }
    },
    [batchEditingEnabled, gridApi, announce],
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

      const message = `${selectedData.length}行をバッチ削除対象に追加しました（保存時に反映されます）`;
      toast.success(message);
      announce(message);
    },
    [gridApi, announce],
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
      toast.error(ERROR_MESSAGES.GRID.NOT_INITIALIZED);
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

      const validationMessage = `バリデーションエラー:\n${errorMessages}`;
      toast.error(validationMessage);
      announce(
        `バリデーションエラーが${validationErrors.size}件あります`,
        "assertive",
      );
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

      const successMessage = `バッチ処理完了: ${changeDetails.join(", ")}`;
      toast.success(successMessage);
      announce(successMessage);
      setFailedWorkLogIds(new Set());
      setBatchEditingEnabled(false);
      onRefresh?.();
    } catch (error) {
      console.error("Batch save error:", error);

      const errorMessage =
        error instanceof Error
          ? ERROR_MESSAGES.SAVE.FAILED(error.message)
          : ERROR_MESSAGES.SAVE.FAILED();
      toast.error(errorMessage);
      announce(errorMessage, "assertive");

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
    announce,
  ]);

  // AG Grid standard: Simplified cancel batch editing
  const handleCancelBatchEditing = useCallback(() => {
    if (!gridApi) {
      setBatchEditingEnabled(false);
      return;
    }

    // Stop any editing in progress before checking for changes
    gridApi.stopEditing(false);

    // Get current grid data
    const currentGridData: WorkLogGridRow[] = [];
    gridApi.forEachNode((node) => {
      if (node.data) {
        currentGridData.push(node.data);
      }
    });

    const currentRowCount = currentGridData.length;
    const originalRowCount = workLogs.length;

    // Check for row additions or deletions
    const currentIds = new Set(currentGridData.map((row) => row.id));

    const hasDeletedRows = workLogs.some((wl) => !currentIds.has(wl.id));
    const hasNewRows = currentRowCount > originalRowCount;

    // Check for cell value changes
    let hasCellChanges = false;
    if (!hasNewRows && !hasDeletedRows) {
      // Check if any cell values have changed
      for (const currentRow of currentGridData) {
        const originalRow = workLogs.find((wl) => wl.id === currentRow.id);
        if (!originalRow) continue;

        // Normalize dates for comparison
        const normalizeDate = (date: Date | string | unknown): string => {
          if (date instanceof Date) {
            return date.toISOString().split("T")[0];
          }
          if (typeof date === "string") {
            return date.split("T")[0];
          }
          return String(date);
        };

        const currentDate = normalizeDate(currentRow.date);
        const originalDate = normalizeDate(originalRow.date);

        // Compare all editable fields
        if (
          currentDate !== originalDate ||
          String(currentRow.hours) !== String(originalRow.hours) ||
          currentRow.projectId !== originalRow.projectId ||
          currentRow.categoryId !== originalRow.categoryId ||
          (currentRow.details || "") !== (originalRow.details || "")
        ) {
          hasCellChanges = true;
          break;
        }
      }
    }

    // Show confirmation dialog if there are any changes
    if (hasNewRows || hasDeletedRows || hasCellChanges) {
      setCancelDialogOpen(true);
    } else {
      // No changes, just exit batch editing mode
      setBatchEditingEnabled(false);
    }
  }, [gridApi, workLogs]);

  // AG Grid standard: Reset to original data and clear all state
  const handleConfirmCancel = useCallback(() => {
    if (gridApi) {
      // Stop any editing in progress
      gridApi.stopEditing(true);

      // Clear all selections
      gridApi.deselectAll();

      // Reset AG Grid data to original workLogs data
      // Create a fresh copy to ensure AG Grid detects the change
      const freshRowData = workLogs.map((workLog) => {
        const workLogCopy = JSON.parse(JSON.stringify(workLog));
        return {
          ...workLogCopy,
          date:
            workLogCopy.date instanceof Date
              ? workLogCopy.date.toISOString().split("T")[0]
              : typeof workLogCopy.date === "string"
                ? workLogCopy.date.split("T")[0]
                : new Date(workLogCopy.date).toISOString().split("T")[0],
          projectId: workLogCopy.projectId || "",
          projectName: projectsMap.get(workLogCopy.projectId) || "Unknown",
          categoryId: workLogCopy.categoryId || "",
          categoryName: categoriesMap.get(workLogCopy.categoryId) || "Unknown",
        };
      });

      gridApi.setGridOption("rowData", freshRowData);
    }

    // Clear all state
    setFailedWorkLogIds(new Set());
    setBatchEditingEnabled(false);
    setCancelDialogOpen(false);
  }, [gridApi, workLogs, projectsMap, categoriesMap]);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  // AG Grid automatically handles column sizing and refresh

  if (isLoading) {
    return <div className="text-center py-8">Loading work logs...</div>;
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Skip link for keyboard navigation - This is a valid WCAG 2.1 pattern using <a> tag */}
      {/* biome-ignore lint/a11y/useValidAnchor: Skip links are a standard accessibility pattern that use anchor tags */}
      <a
        href="#work-log-grid"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          gridRef.current?.focus();
        }}
      >
        作業ログ一覧へスキップ
      </a>

      {/* Search Controls */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <SearchControls
          filters={searchFilters}
          onFiltersChange={handleFiltersChange}
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
                endDate: searchFilters.dateRange.to
                  ?.toISOString()
                  .split("T")[0],
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
            const clearedFilters: SearchFilters = {
              dateRange: { from: undefined, to: undefined },
              projectIds: [],
              categoryIds: [],
              userId: null,
            };
            handleFiltersChange(clearedFilters);
            if (onFilterChange) {
              onFilterChange({});
            }
          }}
          isLoading={isLoading}
          className="flex-1"
        />

        {/* Keyboard shortcuts help button */}
        <KeyboardShortcutsDialog />
      </div>

      {/* Table - Takes remaining height */}
      <section
        ref={gridRef}
        className="flex-1 min-h-0"
        id="work-log-grid"
        aria-label="作業ログ一覧"
        tabIndex={-1}
      >
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
          onRowDelete={
            batchEditingEnabled ? handleBatchDelete : handleRowDelete
          }
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
            suppressRowClickSelection: batchEditingEnabled, // In batch edit mode, suppress row selection to allow cell editing
            singleClickEdit: batchEditingEnabled,
            stopEditingWhenCellsLoseFocus: true,
            enterNavigatesVertically: true,
            suppressColumnVirtualisation: true, // Prevent column virtualization issues
            ensureDomOrder: true, // Ensure DOM order matches logical order
            suppressCellFocus: false, // Allow cell focus
            suppressRowTransform: false, // Enable smooth row animations
            rowBuffer: 0, // Don't buffer rows to avoid data inconsistencies
            animateRows: true, // Enable smooth row animations for better UX
            // Keyboard shortcuts are now handled globally in EnhancedAGGrid
          }}
        />
      </section>

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
