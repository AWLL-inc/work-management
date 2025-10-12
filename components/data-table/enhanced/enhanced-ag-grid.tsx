"use client";

import { 
  AllCommunityModule, 
  ModuleRegistry,
  ClientSideRowModelModule,
  CsvExportModule,
  InfiniteRowModelModule,
} from "ag-grid-community";

// Try to import Enterprise modules, but gracefully handle if not available
let ClipboardModule: any = null;
let CellSelectionModule: any = null;
let ColumnMenuModule: any = null;
let ContextMenuModule: any = null;
let RangeSelectionModule: any = null;
let RowGroupingModule: any = null;

try {
  const enterprise = require("ag-grid-enterprise");
  ClipboardModule = enterprise.ClipboardModule;
  CellSelectionModule = enterprise.CellSelectionModule;
  ColumnMenuModule = enterprise.ColumnMenuModule;
  ContextMenuModule = enterprise.ContextMenuModule;
  RangeSelectionModule = enterprise.RangeSelectionModule;
  RowGroupingModule = enterprise.RowGroupingModule;
} catch (e) {
  console.warn("AG Grid Enterprise modules not available, some features will be limited");
}
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
  ProcessDataFromClipboardParams,
  GridOptions,
} from "ag-grid-community";

// Register AG Grid modules
const modules = [
  AllCommunityModule,
  ClientSideRowModelModule,
  CsvExportModule,
  InfiniteRowModelModule,
];

// Add Enterprise modules if available
if (ClipboardModule) modules.push(ClipboardModule);
if (CellSelectionModule) modules.push(CellSelectionModule);
if (ColumnMenuModule) modules.push(ColumnMenuModule);
if (ContextMenuModule) modules.push(ContextMenuModule);
if (RangeSelectionModule) modules.push(RangeSelectionModule);
if (RowGroupingModule) modules.push(RowGroupingModule);

ModuleRegistry.registerModules(modules);

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
  ...gridProps
}: EnhancedGridProps<T> & {
  children?: React.ReactNode;
  columnDefs: ColDef[];
  defaultColDef?: ColDef;
  getRowClass?: (params: RowClassParams) => string;
  onGridReady?: (params: GridReadyEvent) => void;
  onCellEditingStopped?: (event: CellEditingStoppedEvent) => void;
  gridOptions?: GridOptions;
}) {
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
    gridProps.onGridReady?.(params);
  }, [gridProps]);

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
    
    gridProps.onCellEditingStopped?.(event);
  }, [addToHistory, gridProps]);

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
        gridApi?.setFocusedCell(0, gridProps.columnDefs[0].field || '');
        gridApi?.startEditingCell({ rowIndex: 0, colKey: gridProps.columnDefs[0].field || '' });
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
  }, [onRowAdd, gridApi, rowData, onDataChange, addToHistory, gridProps.columnDefs]);

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

  // Process clipboard data for paste operations
  const processDataFromClipboard = useCallback((params: ProcessDataFromClipboardParams) => {
    if (!enableClipboard) return [];
    
    const data = params.data;
    const focusedCell = gridApi?.getFocusedCell();
    
    if (!focusedCell) return data;
    
    // If pasting more rows than available, add new rows
    const focusedRowIndex = focusedCell.rowIndex;
    const currentRowCount = gridApi?.getDisplayedRowCount() || 0;
    const resultLastIndex = focusedRowIndex + data.length - 1;
    
    if (resultLastIndex >= currentRowCount) {
      const numRowsToAdd = resultLastIndex - currentRowCount + 1;
      const newRows = Array.from({ length: numRowsToAdd }, (_, i) => ({
        id: `new-${Date.now()}-${i}`,
        // Add default values for new rows based on your data structure
      })) as unknown as T[];
      
      // Add new rows to grid
      gridApi?.applyTransaction({ add: newRows });
      
      // Track paste action
      const action: GridAction = {
        type: 'PASTE',
        timestamp: Date.now(),
        data: {
          pastedData: data,
          newRows,
          focusedCell,
        },
      };
      addToHistory(action);
    }
    
    return data;
  }, [enableClipboard, gridApi, addToHistory]);

  // Context menu configuration
  const getContextMenuItems = useCallback((params: any) => {
    const result: any[] = [
      'copy',
      'paste',
      'separator',
      {
        name: '行を追加',
        action: () => handleAddRow(),
        icon: '<span class="ag-icon ag-icon-plus"></span>',
      },
    ];

    if (selectedNodes.length > 0) {
      result.push(
        {
          name: '行を複製',
          action: () => handleDuplicateRows(),
          icon: '<span class="ag-icon ag-icon-copy"></span>',
        },
        'separator',
        {
          name: '行を削除',
          action: () => handleDeleteRows(),
          icon: '<span class="ag-icon ag-icon-delete"></span>',
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

  // Enhanced grid options
  const enhancedGridOptions: GridOptions = useMemo(() => {
    const options: GridOptions = {
      ...gridProps.gridOptions,
      rowSelection: 'multiple',
      animateRows: true,
      suppressRowClickSelection: false,
      suppressMenuHide: false,
      allowContextMenuWithControlKey: true,
      undoRedoCellEditing: enableUndoRedo,
      undoRedoCellEditingLimit: maxUndoRedoSteps,
      onCellKeyPress,
    };

    // Add Enterprise features only if available
    if (ClipboardModule && enableClipboard) {
      options.enableCellTextSelection = true;
      options.enableRangeSelection = true;
      options.getContextMenuItems = getContextMenuItems;
      options.processDataFromClipboard = processDataFromClipboard;
      options.clipboardDelimiter = '\t';
      options.suppressCopyRowsToClipboard = false;
      options.suppressCopySingleCellRanges = false;
    }

    return options;
  }, [
    gridProps.gridOptions,
    enableClipboard,
    enableUndoRedo,
    maxUndoRedoSteps,
    getContextMenuItems,
    processDataFromClipboard,
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
          columnDefs={gridProps.columnDefs}
          defaultColDef={gridProps.defaultColDef}
          getRowClass={gridProps.getRowClass}
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