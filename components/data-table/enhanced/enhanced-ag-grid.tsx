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
  GetContextMenuItemsParams,
  GridApi,
  GridOptions,
  GridReadyEvent,
  IRowNode,
  MenuItemDef,
  RowClassParams,
  RowHeightParams,
  SelectionChangedEvent,
} from "ag-grid-community";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

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

  // Context menu configuration (simplified for Community edition)
  const _getContextMenuItems = useCallback(
    (_params: GetContextMenuItemsParams) => {
      const result: MenuItemDef[] = [
        {
          name: "行を追加",
          action: () => handleAddRow(),
        },
      ];

      if (selectedNodes.length > 0) {
        result.push(
          {
            name: "行を複製",
            action: () => handleDuplicateRows(),
          },
          {
            name: "行を削除",
            action: () => handleDeleteRows(),
          },
        );
      }

      return result;
    },
    [selectedNodes.length, handleAddRow, handleDuplicateRows, handleDeleteRows],
  );

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
      ...gridOptions,
      rowSelection: "multiple",
      animateRows: true,
      suppressRowClickSelection: false,
      suppressMenuHide: false,
      undoRedoCellEditing: enableUndoRedo,
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
    }),
    [
      gridOptions,
      enableUndoRedo,
      maxUndoRedoSteps,
      getRowHeight,
      onCellKeyDown,
    ],
  );

  return (
    <div className="space-y-4">
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
        />
      )}

      <div className="ag-theme-quartz h-[600px] w-full border rounded-lg">
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
