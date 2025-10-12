"use client";

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "../ag-grid-styles.css";
import type {
  CellEditingStoppedEvent,
  ColDef,
  GridReadyEvent,
  RowClassParams,
  GridApi,
  CellValueChangedEvent,
  SelectionChangedEvent,
  GridOptions,
} from "ag-grid-community";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
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
import type { EnhancedGridProps, GridHistoryStack, GridAction } from "../types/grid-types";
import { GridToolbar } from "../toolbar/grid-toolbar";

interface EnhancedAGGridProps<T extends { id: string }> extends EnhancedGridProps<T> {
  children?: React.ReactNode;
  columnDefs: ColDef[];
  defaultColDef?: ColDef;
  getRowClass?: (params: RowClassParams) => string;
  onGridReady?: (params: GridReadyEvent) => void;
  onCellEditingStopped?: (event: CellEditingStoppedEvent) => void;
  gridOptions?: GridOptions;
}

export function EnhancedAGGrid<T extends { id: string }>({
  rowData,
  onDataChange,
  onRowAdd,
  onRowUpdate,
  onRowDelete,
  enableToolbar = true,
  enableClipboard = true,
  enableUndoRedo = true,
  maxUndoRedoSteps = 20,
  children,
  columnDefs,
  defaultColDef,
  getRowClass,
  onGridReady: onGridReadyProp,
  onCellEditingStopped: onCellEditingStoppedProp,
  gridOptions,
}: EnhancedAGGridProps<T>) {
  // Grid references
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Selection and editing state
  const [selectedNodes, setSelectedNodes] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowsToDelete, setRowsToDelete] = useState<string[]>([]);

  // History management for undo/redo
  const [historyStack, setHistoryStack] = useState<GridHistoryStack>({
    undoStack: [],
    redoStack: [],
    maxSize: maxUndoRedoSteps,
  });

  // Add action to history stack
  const addToHistory = useCallback((action: GridAction) => {
    if (!enableUndoRedo) return;
    
    setHistoryStack(prev => ({
      ...prev,
      undoStack: [...prev.undoStack.slice(-prev.maxSize + 1), action],
      redoStack: [], // Clear redo stack when new action is added
    }));
  }, [enableUndoRedo]);

  // Grid ready handler
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
    onGridReadyProp?.(params);
  }, [onGridReadyProp]);

  // Selection changed handler
  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    const selectedNodes = event.api.getSelectedNodes();
    setSelectedNodes(selectedNodes);
  }, []);

  // Cell editing stopped handler
  const onCellEditingStopped = useCallback((event: CellEditingStoppedEvent) => {
    const { data, colDef, newValue, oldValue } = event;
    
    if (newValue !== oldValue) {
      const action: GridAction = {
        type: 'UPDATE',
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
  }, [addToHistory, onCellEditingStoppedProp]);

  // Keyboard event handler for shortcuts
  const onCellKeyPress = useCallback((event: any) => {
    const { event: keyEvent } = event;
    
    if (keyEvent.ctrlKey || keyEvent.metaKey) {
      switch (keyEvent.key) {
        case 'n':
        case 'N':
          keyEvent.preventDefault();
          handleAddRow();
          break;
        case 'd':
        case 'D':
          keyEvent.preventDefault();
          handleDuplicateRows();
          break;
        case 'z':
        case 'Z':
          if (keyEvent.shiftKey) {
            keyEvent.preventDefault();
            handleRedo();
          } else {
            keyEvent.preventDefault();
            handleUndo();
          }
          break;
        case 'y':
        case 'Y':
          keyEvent.preventDefault();
          handleRedo();
          break;
      }
    } else if (keyEvent.key === 'Delete') {
      keyEvent.preventDefault();
      handleDeleteRows();
    }
  }, []);

  // Row addition handler
  const handleAddRow = useCallback(async () => {
    const newRow = {
      id: `new-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      // Add other default values as needed
    } as unknown as T;

    try {
      if (onRowAdd) {
        await onRowAdd([newRow]);
      } else {
        // Add to grid directly
        gridApi?.applyTransaction({ add: [newRow], addIndex: 0 });
        onDataChange?.([newRow, ...rowData]);
      }

      // Focus on the new row for editing
      setTimeout(() => {
        gridApi?.setFocusedCell(0, columnDefs[0].field || '');
        gridApi?.startEditingCell({ rowIndex: 0, colKey: columnDefs[0].field || '' });
      }, 100);

      const action: GridAction = {
        type: 'ADD',
        timestamp: Date.now(),
        data: { newRow },
      };
      addToHistory(action);

      toast.success('新しい行を追加しました');
    } catch (error) {
      console.error('Failed to add row:', error);
      toast.error('行の追加に失敗しました');
    }
  }, [onRowAdd, gridApi, rowData, onDataChange, addToHistory, columnDefs]);

  // Row duplication handler
  const handleDuplicateRows = useCallback(async () => {
    if (selectedNodes.length === 0) {
      toast.info('複製する行を選択してください');
      return;
    }

    const duplicatedRows = selectedNodes.map((node, index) => ({
      ...node.data,
      id: `duplicate-${Date.now()}-${index}`,
      date: new Date().toISOString().split('T')[0], // Set current date
    }));

    try {
      if (onRowAdd) {
        await onRowAdd(duplicatedRows);
      } else {
        gridApi?.applyTransaction({ add: duplicatedRows, addIndex: 0 });
        onDataChange?.([...duplicatedRows, ...rowData]);
      }

      const action: GridAction = {
        type: 'ADD',
        timestamp: Date.now(),
        data: { duplicatedRows, originalRows: selectedNodes.map(n => n.data) },
      };
      addToHistory(action);

      toast.success(`${duplicatedRows.length}行を複製しました`);
    } catch (error) {
      console.error('Failed to duplicate rows:', error);
      toast.error('行の複製に失敗しました');
    }
  }, [selectedNodes, onRowAdd, gridApi, rowData, onDataChange, addToHistory]);

  // Row deletion handler
  const handleDeleteRows = useCallback(() => {
    if (selectedNodes.length === 0) {
      toast.info('削除する行を選択してください');
      return;
    }

    const idsToDelete = selectedNodes.map(node => node.data.id);
    setRowsToDelete(idsToDelete);
    setDeleteDialogOpen(true);
  }, [selectedNodes]);

  // Context menu configuration (simplified for Community edition)
  const getContextMenuItems = useCallback((params: any) => {
    const result: any[] = [
      {
        name: '行を追加',
        action: () => handleAddRow(),
      },
    ];

    if (selectedNodes.length > 0) {
      result.push(
        {
          name: '行を複製',
          action: () => handleDuplicateRows(),
        },
        {
          name: '行を削除',
          action: () => handleDeleteRows(),
        }
      );
    }

    return result;
  }, [selectedNodes.length, handleAddRow, handleDuplicateRows, handleDeleteRows]);

  // Confirm deletion
  const confirmDelete = useCallback(async () => {
    try {
      if (onRowDelete) {
        await onRowDelete(rowsToDelete);
      } else {
        const rowsToRemove = selectedNodes.map(node => node.data);
        gridApi?.applyTransaction({ remove: rowsToRemove });
        
        const newData = rowData.filter(row => !rowsToDelete.includes(row.id));
        onDataChange?.(newData);
      }

      const action: GridAction = {
        type: 'DELETE',
        timestamp: Date.now(),
        data: { deletedRows: selectedNodes.map(n => n.data) },
      };
      addToHistory(action);

      toast.success(`${rowsToDelete.length}行を削除しました`);
      setDeleteDialogOpen(false);
      setRowsToDelete([]);
    } catch (error) {
      console.error('Failed to delete rows:', error);
      toast.error('行の削除に失敗しました');
    }
  }, [onRowDelete, rowsToDelete, selectedNodes, gridApi, rowData, onDataChange, addToHistory]);

  // Undo handler
  const handleUndo = useCallback(() => {
    if (historyStack.undoStack.length === 0) return;

    const lastAction = historyStack.undoStack[historyStack.undoStack.length - 1];
    
    // Move action to redo stack
    setHistoryStack(prev => ({
      ...prev,
      undoStack: prev.undoStack.slice(0, -1),
      redoStack: [...prev.redoStack, lastAction],
    }));

    // Implement undo logic based on action type
    switch (lastAction.type) {
      case 'UPDATE':
        // Revert cell value
        const { id, field, oldValue } = lastAction.data;
        const rowNode = gridApi?.getRowNode(id);
        if (rowNode) {
          rowNode.setDataValue(field, oldValue);
        }
        break;
      case 'ADD':
        // Remove added rows
        const { newRow, duplicatedRows } = lastAction.data;
        const rowsToRemove = newRow ? [newRow] : duplicatedRows;
        gridApi?.applyTransaction({ remove: rowsToRemove });
        break;
      case 'DELETE':
        // Re-add deleted rows
        const { deletedRows } = lastAction.data;
        gridApi?.applyTransaction({ add: deletedRows });
        break;
    }

    toast.info('操作を元に戻しました');
  }, [historyStack.undoStack, gridApi]);

  // Redo handler
  const handleRedo = useCallback(() => {
    if (historyStack.redoStack.length === 0) return;

    const actionToRedo = historyStack.redoStack[historyStack.redoStack.length - 1];
    
    // Move action back to undo stack
    setHistoryStack(prev => ({
      ...prev,
      redoStack: prev.redoStack.slice(0, -1),
      undoStack: [...prev.undoStack, actionToRedo],
    }));

    // Implement redo logic based on action type
    switch (actionToRedo.type) {
      case 'UPDATE':
        // Apply new value
        const { id, field, newValue } = actionToRedo.data;
        const rowNode = gridApi?.getRowNode(id);
        if (rowNode) {
          rowNode.setDataValue(field, newValue);
        }
        break;
      case 'ADD':
        // Re-add rows
        const { newRow, duplicatedRows } = actionToRedo.data;
        const rowsToAdd = newRow ? [newRow] : duplicatedRows;
        gridApi?.applyTransaction({ add: rowsToAdd });
        break;
      case 'DELETE':
        // Remove rows again
        const { deletedRows } = actionToRedo.data;
        gridApi?.applyTransaction({ remove: deletedRows });
        break;
    }

    toast.info('操作をやり直しました');
  }, [historyStack.redoStack, gridApi]);

  // Enhanced grid options (Community edition compatible)
  const enhancedGridOptions: GridOptions = useMemo(() => ({
    ...gridOptions,
    rowSelection: 'multiple',
    animateRows: true,
    suppressRowClickSelection: false,
    suppressMenuHide: false,
    allowContextMenuWithControlKey: true,
    undoRedoCellEditing: enableUndoRedo,
    undoRedoCellEditingLimit: maxUndoRedoSteps,
    onCellKeyPress,
    getContextMenuItems: enableClipboard ? getContextMenuItems : undefined,
  }), [
    gridOptions,
    enableClipboard,
    enableUndoRedo,
    maxUndoRedoSteps,
    getContextMenuItems,
    onCellKeyPress,
  ]);

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
          disabled={isEditing}
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
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}