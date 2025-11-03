"use client";

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "../ag-grid-styles.css";
import type {
  CellEditingStoppedEvent,
  CellKeyDownEvent,
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  IRowNode,
  RowClassParams,
  RowHeightParams,
  SelectionChangedEvent,
} from "ag-grid-community";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { generateUuid } from "@/lib/utils/uuid";
import { GridToolbar } from "../toolbar/grid-toolbar";
import type {
  EnhancedGridProps,
  GridAction,
  GridHistoryStack,
} from "../types/grid-types";

interface EnhancedAGGridProps<T extends { id: string }>
  extends EnhancedGridProps<T> {
  children?: React.ReactNode;
  columnDefs: ColDef[];
  defaultColDef?: ColDef;
  getRowClass?: (params: RowClassParams) => string;
  getRowHeight?: (params: RowHeightParams) => number;
  onGridReady?: (params: GridReadyEvent) => void;
  onCellEditingStopped?: (event: CellEditingStoppedEvent) => void;
  gridOptions?: GridOptions;
  batchEditingEnabled?: boolean;
  quickFilterText?: string;
  onQuickFilterChange?: (filterText: string) => void;
  enableQuickFilter?: boolean;
  enableFloatingFilter?: boolean;
  enableFilterToolPanel?: boolean;
  // Work Log specific toolbar buttons
  onToggleBatchEdit?: () => void;
  onAddWorkLog?: () => void;
  onBatchSave?: () => void;
  onCancelBatchEdit?: () => void;
  isSavingBatch?: boolean;
}

export function EnhancedAGGrid<T extends { id: string }>({
  rowData,
  onDataChange,
  onRowAdd: _onRowAdd,
  onRowDelete,
  enableToolbar = true,
  enableUndoRedo = true,
  maxUndoRedoSteps = 20,
  children,
  columnDefs,
  defaultColDef,
  getRowClass,
  getRowHeight,
  onGridReady: onGridReadyProp,
  onCellEditingStopped: onCellEditingStoppedProp,
  gridOptions,
  batchEditingEnabled = false,
  quickFilterText,
  onQuickFilterChange,
  enableQuickFilter = true,
  enableFloatingFilter = true,
  enableFilterToolPanel = false,
  onToggleBatchEdit,
  onAddWorkLog,
  onBatchSave,
  onCancelBatchEdit,
  isSavingBatch,
}: EnhancedAGGridProps<T>) {
  // Use ref to get current value in callbacks
  const batchEditingEnabledRef = useRef(batchEditingEnabled);
  batchEditingEnabledRef.current = batchEditingEnabled;

  // Grid references
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Selection and editing state
  const [selectedNodes, setSelectedNodes] = useState<IRowNode<T>[]>([]);
  const [_isEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowsToDelete, setRowsToDelete] = useState<string[]>([]);

  // History management for undo/redo
  const [historyStack, setHistoryStack] = useState<GridHistoryStack>({
    undoStack: [],
    redoStack: [],
    maxSize: maxUndoRedoSteps,
  });

  // Add action to history stack
  const addToHistory = useCallback(
    (action: GridAction) => {
      if (!enableUndoRedo) return;

      setHistoryStack((prev) => ({
        ...prev,
        undoStack: [...prev.undoStack.slice(-prev.maxSize + 1), action],
        redoStack: [], // Clear redo stack when new action is added
      }));
    },
    [enableUndoRedo],
  );

  // Grid ready handler
  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      setGridApi(params.api);
      params.api.sizeColumnsToFit();
      onGridReadyProp?.(params);
    },
    [onGridReadyProp],
  );

  // Selection changed handler
  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    const selectedNodes = event.api.getSelectedNodes();
    setSelectedNodes(selectedNodes);
  }, []);

  // Cell editing stopped handler
  const onCellEditingStopped = useCallback(
    (event: CellEditingStoppedEvent) => {
      const { data, colDef, newValue, oldValue } = event;

      if (newValue !== oldValue) {
        const action: GridAction = {
          type: "UPDATE",
          timestamp: Date.now(),
          data: {
            id: data.id,
            field: colDef.field,
            oldValue,
            newValue,
          },
        };
        addToHistory(action);
      }

      onCellEditingStoppedProp?.(event);
    },
    [addToHistory, onCellEditingStoppedProp],
  );

  // Row addition handler
  const handleAddRow = useCallback(async () => {
    if (!batchEditingEnabled) {
      toast.info("一括編集モードを有効にしてください");
      return;
    }

    const newRow = {
      id: generateUuid(),
      date: new Date(), // Default to current date
      hours: "", // Empty - user should fill in
      projectId: "",
      projectName: "",
      categoryId: "",
      categoryName: "",
      details: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "",
    } as unknown as T;

    // Add to grid using transaction only (don't modify external rowData)
    gridApi?.applyTransaction({ add: [newRow], addIndex: 0 });

    // Force grid refresh for proper column alignment, but avoid affecting existing data
    setTimeout(() => {
      // Only refresh newly added rows to prevent data loss in existing rows
      gridApi?.refreshCells({
        force: true,
        rowNodes: [gridApi?.getRowNode(newRow.id)].filter(
          Boolean,
        ) as IRowNode[],
      });
      gridApi?.sizeColumnsToFit();

      // Focus on the new row for editing
      gridApi?.setFocusedCell(0, columnDefs[0].field || "");
      gridApi?.startEditingCell({
        rowIndex: 0,
        colKey: columnDefs[0].field || "",
      });
    }, 100);

    const action: GridAction = {
      type: "ADD",
      timestamp: Date.now(),
      data: { newRow },
    };
    addToHistory(action);

    // Note: onRowAdd is not called here to avoid double row creation
    // Row addition is handled purely by AG Grid transaction
  }, [batchEditingEnabled, gridApi, addToHistory, columnDefs]);

  // Row duplication handler
  const handleDuplicateRows = useCallback(async () => {
    if (selectedNodes.length === 0) {
      toast.info("複製する行を選択してください");
      return;
    }

    // Only duplicate the first selected row for simplicity
    const nodeToClone = selectedNodes[0];
    if (!nodeToClone.data) {
      toast.error("選択された行のデータが見つかりません");
      return;
    }

    const duplicatedRow = {
      ...nodeToClone.data,
      id: generateUuid(),
      date: new Date().toISOString().split("T")[0], // Set current date
    } as T;

    // Get the row index of the selected row to insert directly below it
    const selectedRowIndex =
      nodeToClone.rowIndex !== null ? nodeToClone.rowIndex + 1 : 0;

    // Add to grid using transaction only (don't modify external rowData)
    gridApi?.applyTransaction({
      add: [duplicatedRow],
      addIndex: selectedRowIndex,
    });

    // Force grid refresh for proper display, but avoid affecting existing data
    setTimeout(() => {
      // Only refresh the newly duplicated row to prevent data loss in existing rows
      const newRowNode = gridApi?.getRowNode(duplicatedRow.id);

      if (newRowNode) {
        gridApi?.refreshCells({
          force: true,
          rowNodes: [newRowNode],
        });
      }
      gridApi?.sizeColumnsToFit();
    }, 100);

    const action: GridAction = {
      type: "ADD",
      timestamp: Date.now(),
      data: {
        duplicatedRows: [duplicatedRow],
        originalRows: [nodeToClone.data],
      },
    };
    addToHistory(action);

    // Note: onRowAdd is not called for row duplication to avoid double creation
    // Row duplication is handled purely by AG Grid transactions

    toast.success("行を複製しました（編集後に保存してください）");
  }, [selectedNodes, gridApi, addToHistory]);

  // Row deletion handler
  const handleDeleteRows = useCallback(() => {
    if (selectedNodes.length === 0) {
      toast.info("削除する行を選択してください");
      return;
    }

    const idsToDelete = selectedNodes
      .map((node) => node.data?.id)
      .filter(Boolean) as string[];
    setRowsToDelete(idsToDelete);
    setDeleteDialogOpen(true);
  }, [selectedNodes]);

  // Confirm deletion
  const confirmDelete = useCallback(async () => {
    try {
      if (onRowDelete) {
        await onRowDelete(rowsToDelete);
      } else {
        const rowsToRemove = selectedNodes.map((node) => node.data);
        gridApi?.applyTransaction({ remove: rowsToRemove });

        // Only call onDataChange if it's expected to update external state
        // For internal grid operations, the transaction handles the updates
        if (onDataChange) {
          const newData = rowData.filter(
            (row) => !rowsToDelete.includes(row.id),
          );
          onDataChange(newData);
        }
      }

      const action: GridAction = {
        type: "DELETE",
        timestamp: Date.now(),
        data: { deletedRows: selectedNodes.map((n) => n.data).filter(Boolean) },
      };
      addToHistory(action);

      toast.success(`${rowsToDelete.length}行を削除しました`);
      setDeleteDialogOpen(false);
      setRowsToDelete([]);
    } catch (error) {
      console.error("Failed to delete rows:", error);
      toast.error("行の削除に失敗しました");
    }
  }, [
    onRowDelete,
    rowsToDelete,
    selectedNodes,
    gridApi,
    rowData,
    onDataChange,
    addToHistory,
  ]);

  // Undo handler
  const handleUndo = useCallback(() => {
    if (historyStack.undoStack.length === 0) return;

    const lastAction =
      historyStack.undoStack[historyStack.undoStack.length - 1];

    // Move action to redo stack
    setHistoryStack((prev) => ({
      ...prev,
      undoStack: prev.undoStack.slice(0, -1),
      redoStack: [...prev.redoStack, lastAction],
    }));

    // Implement undo logic based on action type
    switch (lastAction.type) {
      case "UPDATE": {
        // Revert cell value
        const { id, field, oldValue } = lastAction.data;
        if (id && field) {
          const rowNode = gridApi?.getRowNode(id);
          if (rowNode) {
            rowNode.setDataValue(field, oldValue);
          }
        }
        break;
      }
      case "ADD": {
        // Remove added rows
        const { newRow, duplicatedRows } = lastAction.data;
        const rowsToRemove = newRow ? [newRow] : duplicatedRows;
        gridApi?.applyTransaction({ remove: rowsToRemove });
        break;
      }
      case "DELETE": {
        // Re-add deleted rows
        const { deletedRows } = lastAction.data;
        gridApi?.applyTransaction({ add: deletedRows });
        break;
      }
    }

    toast.info("操作を元に戻しました");
  }, [historyStack.undoStack, gridApi]);

  // Redo handler
  const handleRedo = useCallback(() => {
    if (historyStack.redoStack.length === 0) return;

    const actionToRedo =
      historyStack.redoStack[historyStack.redoStack.length - 1];

    // Move action back to undo stack
    setHistoryStack((prev) => ({
      ...prev,
      redoStack: prev.redoStack.slice(0, -1),
      undoStack: [...prev.undoStack, actionToRedo],
    }));

    // Implement redo logic based on action type
    switch (actionToRedo.type) {
      case "UPDATE": {
        // Apply new value
        const { id, field, newValue } = actionToRedo.data;
        if (id && field) {
          const rowNode = gridApi?.getRowNode(id);
          if (rowNode) {
            rowNode.setDataValue(field, newValue);
          }
        }
        break;
      }
      case "ADD": {
        // Re-add rows
        const { newRow, duplicatedRows } = actionToRedo.data;
        const rowsToAdd = newRow ? [newRow] : duplicatedRows;
        gridApi?.applyTransaction({ add: rowsToAdd });
        break;
      }
      case "DELETE": {
        // Remove rows again
        const { deletedRows } = actionToRedo.data;
        gridApi?.applyTransaction({ remove: deletedRows });
        break;
      }
    }

    toast.info("操作をやり直しました");
  }, [historyStack.redoStack, gridApi]);

  /**
   * Global keyboard shortcuts handler
   *
   * Provides comprehensive keyboard shortcuts for grid operations in batch editing mode.
   *
   * Supported shortcuts:
   * - Ctrl+Z: Undo last operation
   * - Ctrl+Y / Ctrl+Shift+Z: Redo last undone operation
   * - Ctrl+N: Add new row to the grid
   * - Ctrl+D: Duplicate selected rows
   * - Delete: Delete selected rows
   *
   * Key behaviors:
   * 1. Only active when batch editing mode is enabled
   * 2. Automatically disabled during cell editing to allow normal input (e.g., date pickers)
   * 3. Ignores input fields outside the grid to avoid interference
   * 4. Works on both Windows (Ctrl) and Mac (Cmd)
   *
   * @see handleUndo - Undo operation handler
   * @see handleRedo - Redo operation handler
   * @see handleAddRow - Row addition handler
   * @see handleDuplicateRows - Row duplication handler
   * @see handleDeleteRows - Row deletion handler
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when batch editing is enabled
      if (!batchEditingEnabled) return;

      // CRITICAL: Don't handle any shortcuts while editing a cell
      // This allows date pickers, text inputs, etc. to work normally
      const editingCells = gridApi?.getEditingCells();
      if (editingCells && editingCells.length > 0) {
        return; // Cell is being edited - skip all shortcuts
      }

      // Check if focus is within the grid or if no specific input is focused
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.getAttribute("contenteditable") === "true";

      // Don't interfere with regular input fields (outside the grid)
      if (
        isInputFocused &&
        !activeElement?.closest(".ag-theme-quartz") &&
        !activeElement?.classList.contains("ag-cell-editor")
      ) {
        return;
      }

      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      // Ctrl+Z: Undo
      if (isCtrlOrCmd && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        handleUndo();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z: Redo
      if (
        (isCtrlOrCmd && event.key.toLowerCase() === "y") ||
        (isCtrlOrCmd && event.shiftKey && event.key.toLowerCase() === "z")
      ) {
        event.preventDefault();
        event.stopPropagation();
        handleRedo();
        return;
      }

      // Ctrl+N: Add new row
      if (isCtrlOrCmd && event.key.toLowerCase() === "n") {
        event.preventDefault();
        event.stopPropagation();
        handleAddRow();
        return;
      }

      // Ctrl+D: Duplicate rows
      if (isCtrlOrCmd && event.key.toLowerCase() === "d") {
        event.preventDefault();
        event.stopPropagation();
        handleDuplicateRows();
        return;
      }

      // Delete: Delete selected rows
      if (event.key === "Delete" && !isInputFocused) {
        event.preventDefault();
        event.stopPropagation();
        handleDeleteRows();
        return;
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    batchEditingEnabled,
    handleUndo,
    handleRedo,
    handleAddRow,
    handleDuplicateRows,
    handleDeleteRows,
    gridApi,
  ]);

  // Fallback copy function for older browsers
  const fallbackCopyTextToClipboard = useCallback((text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      if (successful) {
        toast.success(
          `セル値をコピーしました: "${text.length > 20 ? `${text.substring(0, 20)}...` : text}"`,
        );
      } else {
        toast.error("コピーに失敗しました");
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
      toast.error("コピーに失敗しました");
    }

    document.body.removeChild(textArea);
  }, []);

  // Cell-level copy & paste handler for Community Edition
  const onCellKeyDown = useCallback(
    (event: CellKeyDownEvent) => {
      const { event: keyboardEvent, node, column } = event;

      // Type guard for keyboard event
      if (!keyboardEvent || !(keyboardEvent instanceof KeyboardEvent)) {
        return;
      }

      const currentBatchEditingEnabled = batchEditingEnabledRef.current;

      // Handle Ctrl+C (or Cmd+C on Mac) for cell copy (only in batch editing mode)
      if (
        (keyboardEvent.ctrlKey || keyboardEvent.metaKey) &&
        keyboardEvent.key === "c" &&
        currentBatchEditingEnabled
      ) {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();

        // Get the current cell value
        const cellValue = node.data[column.getId()];
        const textToCopy = cellValue != null ? String(cellValue) : "";

        // Try multiple methods for clipboard access
        if (navigator.clipboard?.writeText) {
          // Modern clipboard API
          navigator.clipboard
            .writeText(textToCopy)
            .then(() => {
              toast.success(
                `セル値をコピーしました: "${textToCopy.length > 20 ? `${textToCopy.substring(0, 20)}...` : textToCopy}"`,
              );
            })
            .catch((err) => {
              console.error(
                "Failed to write clipboard with navigator.clipboard:",
                err,
              );
              // Fallback to execCommand
              fallbackCopyTextToClipboard(textToCopy);
            });
        } else {
          // Fallback for older browsers
          fallbackCopyTextToClipboard(textToCopy);
        }
      }

      // Handle Ctrl+V (or Cmd+V on Mac) for cell paste (only in batch editing mode)
      if (
        (keyboardEvent.ctrlKey || keyboardEvent.metaKey) &&
        keyboardEvent.key === "v" &&
        currentBatchEditingEnabled
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
                // Remove tabs (for Excel-style data) but keep newlines
                valueToSet = clipboardText.replace(/\t/g, " ");
              } else {
                // For other fields, take only the first value (before tab or newline)
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
    [fallbackCopyTextToClipboard],
  ); // Add the dependency

  // Enhanced grid options (Community edition compatible)
  const enhancedGridOptions: GridOptions = useMemo(
    () => ({
      rowSelection: "multiple",
      animateRows: true,
      suppressMenuHide: false,
      undoRedoCellEditing: false, // Disable AG Grid's default undo/redo to use custom implementation
      undoRedoCellEditingLimit: maxUndoRedoSteps,
      getRowHeight: getRowHeight,
      // Custom keyboard handling for clipboard
      onCellKeyDown: onCellKeyDown,
      // Enable basic text selection
      enableCellTextSelection: true,
      // Suppress default clipboard to use our custom handler
      suppressCopyRowsToClipboard: true,
      suppressClipboardPaste: true,
      suppressClipboardApi: false, // Allow clipboard API access
      // Enable advanced filtering features
      enableFilter: true,
      enableQuickFilter: enableQuickFilter,
      floatingFilter: enableFloatingFilter,
      quickFilterText: quickFilterText,
      // Filter configuration
      defaultFilterParams: {
        filterOptions: ["contains", "startsWith", "endsWith", "equals"],
        suppressAndOrCondition: false,
        alwaysShowBothConditions: false,
      },
      // Tool panel configuration
      sideBar: enableFilterToolPanel
        ? {
            toolPanels: [
              {
                id: "filters",
                labelDefault: "フィルター",
                labelKey: "filters",
                iconKey: "filter",
                toolPanel: "agFiltersToolPanel",
              },
            ],
            defaultToolPanel: "",
            hiddenByDefault: true,
          }
        : undefined,
      // Merge parent gridOptions last to allow overrides
      ...gridOptions,
    }),
    [
      enableUndoRedo,
      maxUndoRedoSteps,
      getRowHeight,
      onCellKeyDown,
      enableQuickFilter,
      enableFloatingFilter,
      enableFilterToolPanel,
      quickFilterText,
      gridOptions,
    ],
  );

  return (
    <div className="flex flex-col h-full space-y-4">
      {enableToolbar && (
        <GridToolbar
          gridApi={gridApi || undefined}
          onAddRow={handleAddRow}
          onDuplicateRows={handleDuplicateRows}
          onDeleteRows={handleDeleteRows}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyStack.undoStack.length > 0}
          canRedo={historyStack.redoStack.length > 0}
          selectedRowCount={selectedNodes.length}
          batchEditingEnabled={batchEditingEnabled}
          enableQuickFilter={enableQuickFilter}
          quickFilterText={quickFilterText}
          onQuickFilterChange={onQuickFilterChange}
          enableFilterToolPanel={enableFilterToolPanel}
          onToggleBatchEdit={onToggleBatchEdit}
          onAddWorkLog={onAddWorkLog}
          onBatchSave={onBatchSave}
          onCancelBatchEdit={onCancelBatchEdit}
          isSavingBatch={isSavingBatch}
        />
      )}

      <div className="ag-theme-quartz flex-1 min-h-[400px] w-full overflow-auto">
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
          onSelectionChanged={onSelectionChanged}
          gridOptions={enhancedGridOptions}
        />
      </div>

      {children}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>行を削除</DialogTitle>
            <DialogDescription>
              選択された{rowsToDelete.length}行を削除しますか？
              この操作は取り消すことができません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
