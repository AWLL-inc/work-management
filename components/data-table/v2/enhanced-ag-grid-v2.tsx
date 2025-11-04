"use client";

/**
 * EnhancedAGGridV2 - Pluggable Architecture Version
 *
 * This is the next generation of EnhancedAGGrid, built on a pluggable feature architecture.
 * Unlike the original monolithic component, V2 composes individual feature hooks to provide
 * a more flexible, testable, and maintainable data table implementation.
 *
 * Key improvements over V1:
 * - Modular feature system with individual hooks
 * - Better separation of concerns
 * - Easier to test (each feature can be tested in isolation)
 * - More flexible configuration
 * - Improved performance through optimized hook composition
 *
 * @example
 * ```typescript
 * <EnhancedAGGridV2
 *   data={workLogs}
 *   columns={columnDefs}
 *   enableBatchEditing={true}
 *   enableUndoRedo={true}
 *   enableRowActions={true}
 *   onRowAdd={handleAdd}
 *   onRowDelete={handleDelete}
 *   onRowUpdate={handleUpdate}
 * />
 * ```
 */

import type {
  CellKeyDownEvent,
  ColDef,
  GridOptions,
  GridReadyEvent,
} from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Import styles
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "../ag-grid-styles.css";

// Import types
import type {
  EditingFeature,
  RowActionsFeature,
  SelectionFeature,
  UndoRedoFeature,
} from "../hooks/types";
// Import feature hooks
import { useDataTable } from "../hooks/use-data-table";
import { useEditingFeature } from "../hooks/use-editing-feature";
import { useFilteringFeature } from "../hooks/use-filtering-feature";
import { usePaginationFeature } from "../hooks/use-pagination-feature";
import { useRowActionsFeature } from "../hooks/use-row-actions-feature";
import { useSelectionFeature } from "../hooks/use-selection-feature";
import { useSortingFeature } from "../hooks/use-sorting-feature";
import { useUndoRedoFeature } from "../hooks/use-undo-redo-feature";

// Import toolbar
import { GridToolbar } from "../toolbar/grid-toolbar";

/**
 * Props for EnhancedAGGridV2 component
 */
export interface EnhancedAGGridV2Props<T extends { id: string }> {
  // Data and columns
  /** Row data */
  data: T[];

  /** Column definitions */
  columns: ColDef[];

  // Feature enablement
  /** Enable sorting feature */
  enableSorting?: boolean;

  /** Enable filtering feature */
  enableFiltering?: boolean;

  /** Enable pagination feature */
  enablePagination?: boolean;

  /** Enable selection feature */
  enableSelection?: boolean;

  /** Enable batch editing feature */
  enableBatchEditing?: boolean;

  /** Enable undo/redo feature */
  enableUndoRedo?: boolean;

  /** Enable row actions (add/delete/duplicate) */
  enableRowActions?: boolean;

  /** Show toolbar */
  enableToolbar?: boolean;

  /** Enable clipboard (copy/paste) functionality */
  enableClipboard?: boolean;

  // Feature configuration
  /** Initial sort configuration */
  initialSort?: Array<{ column: string; direction: "asc" | "desc" }>;

  /** Page size for pagination */
  pageSize?: number;

  /** Maximum undo/redo steps */
  maxUndoRedoSteps?: number;

  // Callbacks
  /** Callback when row is added */
  onRowAdd?: (row: T) => void | Promise<void>;

  /** Callback when row is deleted */
  onRowDelete?: (rowId: string) => void | Promise<void>;

  /** Callback when multiple rows are deleted */
  onRowDeleteBatch?: (rowIds: string[]) => void | Promise<void>;

  /** Callback when row is duplicated */
  onRowDuplicate?: (row: T) => void | Promise<void>;

  /** Callback when data changes (for editing) */
  onDataChange?: (editedRows: Map<string, T>) => Promise<void>;

  /** Callback when grid is ready */
  onGridReady?: (params: GridReadyEvent) => void;

  /** Callback when selection changes */
  onSelectionChange?: (selectedRows: T[]) => void;

  // Custom grid options
  /** Additional AG Grid options */
  gridOptions?: GridOptions;

  /** Default column definition */
  defaultColDef?: ColDef;

  /** Custom row class */
  getRowClass?: (params: unknown) => string;

  /** Custom row height */
  getRowHeight?: (params: unknown) => number;

  // Children (for additional elements like dialogs)
  children?: React.ReactNode;
}

/**
 * EnhancedAGGridV2 Component
 *
 * A composable, feature-rich data table built on AG Grid with pluggable architecture.
 */
export function EnhancedAGGridV2<T extends { id: string }>({
  data,
  columns,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = false,
  enableSelection = true,
  enableBatchEditing = false,
  enableUndoRedo = true,
  enableRowActions = true,
  enableToolbar = true,
  enableClipboard = true,
  initialSort,
  pageSize = 50,
  maxUndoRedoSteps = 20,
  onRowAdd,
  onRowDelete,
  onRowDeleteBatch,
  onRowDuplicate,
  onDataChange,
  onGridReady,
  onSelectionChange,
  gridOptions,
  defaultColDef,
  getRowClass,
  getRowHeight,
  children,
}: EnhancedAGGridV2Props<T>) {
  const gridRef = useRef<AgGridReact>(null);
  const [isBatchEditMode, setIsBatchEditMode] = useState(enableBatchEditing);

  /**
   * Clipboard handler for cell copy/paste
   * Only active when clipboard is enabled and batch edit mode is on
   */
  const onCellKeyDown = useCallback(
    (event: CellKeyDownEvent) => {
      if (!enableClipboard || !isBatchEditMode) return;

      const { event: keyboardEvent, node, column } = event;

      // Type guard for keyboard event
      if (!keyboardEvent || !(keyboardEvent instanceof KeyboardEvent)) {
        return;
      }

      // Handle Ctrl+C (or Cmd+C on Mac) for cell copy
      if (
        (keyboardEvent.ctrlKey || keyboardEvent.metaKey) &&
        keyboardEvent.key === "c"
      ) {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();

        // Get the current cell value
        const cellValue = node.data?.[column.getId()];
        const textToCopy = cellValue != null ? String(cellValue) : "";

        // Try clipboard API
        if (navigator.clipboard?.writeText) {
          navigator.clipboard
            .writeText(textToCopy)
            .then(() => {
              toast.success(
                `セル値をコピーしました: "${textToCopy.length > 20 ? `${textToCopy.substring(0, 20)}...` : textToCopy}"`,
              );
            })
            .catch((err) => {
              console.error("Failed to copy to clipboard:", err);
              toast.error("コピーに失敗しました");
            });
        } else {
          toast.error(
            "このブラウザではクリップボード機能がサポートされていません",
          );
        }
      }

      // Handle Ctrl+V (or Cmd+V on Mac) for cell paste
      if (
        (keyboardEvent.ctrlKey || keyboardEvent.metaKey) &&
        keyboardEvent.key === "v"
      ) {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();

        // Check if current column is editable
        if (!column.getColDef().editable) {
          toast.warning("このセルは編集できません");
          return;
        }

        if (navigator.clipboard?.readText) {
          navigator.clipboard
            .readText()
            .then((clipboardText) => {
              if (!clipboardText) return;

              // Check if this is a Details field that supports multi-line content
              const columnId = column.getId();
              const isDetailsField = columnId === "details";

              let valueToSet: string;
              if (isDetailsField) {
                // For Details field, preserve the full multi-line content
                valueToSet = clipboardText.replace(/\t/g, " ");
              } else {
                // For other fields, take only the first value
                valueToSet = clipboardText.split(/[\t\n]/)[0];
              }

              // Set the value to current cell
              node.setDataValue(columnId, valueToSet);

              toast.success("セルに貼り付けました");
            })
            .catch((err) => {
              console.error("Failed to read clipboard:", err);
              toast.error("クリップボードの読み取りに失敗しました");
            });
        } else {
          toast.error(
            "このブラウザではクリップボード機能がサポートされていません",
          );
        }
      }
    },
    [enableClipboard, isBatchEditMode],
  );

  // Initialize feature hooks (always call all hooks, even if disabled)
  const sorting = useSortingFeature({
    multiSort: true,
    initialSort: initialSort || [],
  });

  const filtering = useFilteringFeature({
    mode: "both",
    enableFloatingFilter: true,
    enableFilterToolPanel: false,
  });

  const pagination = usePaginationFeature(
    {
      mode: "client",
      pageSize,
      pageSizeOptions: [25, 50, 100, 200],
    },
    data.length,
  );

  const selection = useSelectionFeature<T>({
    mode: "multiple",
    enableSelectAll: true,
    selectOnRowClick: false,
    onSelectionChange: onSelectionChange as <TData>(
      selectedRows: TData[],
    ) => void,
  });

  const editing = useEditingFeature<T>({
    mode: "batch",
    enableAutoSave: false,
    validateOnChange: true,
    onSave: onDataChange as <TData>(
      editedRows: Map<string, TData>,
    ) => Promise<void>,
  });

  const undoRedo = useUndoRedoFeature<T>({
    maxSteps: maxUndoRedoSteps,
    trackingTypes: ["UPDATE", "ADD", "DELETE"],
    enableKeyboardShortcuts: true,
  });

  const rowActions = useRowActionsFeature<T>({
    enableAdd: true,
    enableDelete: true,
    enableDuplicate: true,
    confirmDelete: true,
    onAdd: onRowAdd as <TData>(row: TData) => void | Promise<void>,
    onDelete: onRowDelete,
    onDeleteBatch: onRowDeleteBatch,
    onDuplicate: onRowDuplicate as <TData>(row: TData) => void | Promise<void>,
  });

  // Compose features with useDataTable hook (only include enabled features)
  const dataTable = useDataTable<T>({
    data,
    columns,
    features: {
      sorting: enableSorting ? sorting : undefined,
      filtering: enableFiltering ? filtering : undefined,
      pagination: enablePagination ? pagination : undefined,
      selection: enableSelection
        ? (selection as SelectionFeature | undefined)
        : undefined,
      editing: enableBatchEditing
        ? (editing as EditingFeature | undefined)
        : undefined,
      undoRedo: enableUndoRedo
        ? (undoRedo as UndoRedoFeature | undefined)
        : undefined,
      rowActions: enableRowActions
        ? (rowActions as RowActionsFeature | undefined)
        : undefined,
    },
    gridOptions: {
      // Base grid options
      animateRows: true,
      rowSelection: "multiple",
      suppressMenuHide: false,
      enableCellTextSelection: true,
      getRowHeight,
      getRowClass,

      // Merge custom gridOptions
      ...gridOptions,
    },
  });

  // Enhanced gridOptions with defaults
  const enhancedGridOptions: GridOptions = {
    ...dataTable.gridProps,

    // Column definition
    defaultColDef: {
      sortable: enableSorting,
      filter: enableFiltering,
      resizable: true,
      editable: isBatchEditMode,
      ...defaultColDef,
    },

    // Clipboard configuration
    onCellKeyDown: enableClipboard ? onCellKeyDown : undefined,
    enableCellTextSelection: enableClipboard,
    suppressCopyRowsToClipboard: enableClipboard,
    suppressClipboardPaste: enableClipboard,
    suppressClipboardApi: false,

    // Grid ready handler
    onGridReady: (params) => {
      params.api.sizeColumnsToFit();
      onGridReady?.(params);
    },
  };

  // Batch edit toggle handler
  const handleToggleBatchEdit = useCallback(() => {
    setIsBatchEditMode((prev) => !prev);
  }, []);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Toolbar */}
      {enableToolbar && (
        <GridToolbar
          {
            /* biome-ignore lint/suspicious/noExplicitAny: toolbarProps is dynamically aggregated from feature hooks */
            ...(dataTable.toolbarProps as any)
          }
          gridApi={gridRef.current?.api}
          batchEditingEnabled={isBatchEditMode}
          onToggleBatchEdit={
            enableBatchEditing ? handleToggleBatchEdit : undefined
          }
        />
      )}

      {/* AG Grid */}
      <div className="ag-theme-quartz flex-1 min-h-[400px] w-full overflow-auto">
        <AgGridReact
          ref={gridRef}
          className="h-full w-full"
          theme="legacy"
          {...enhancedGridOptions}
        />
      </div>

      {/* Additional children (dialogs, etc.) */}
      {children}
    </div>
  );
}
