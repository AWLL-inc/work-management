import type { GridApi } from "ag-grid-community";
import type { Project, WorkCategory, WorkLog } from "@/drizzle/schema";

export interface GridTransaction<T = unknown> {
  add?: T[];
  remove?: T[];
  update?: T[];
  addIndex?: number;
}

export interface EnhancedGridProps<T = unknown> {
  rowData: T[];
  onDataChange?: (data: T[]) => void;
  onRowAdd?: (newRows: T[]) => Promise<void>;
  onRowUpdate?: (
    updates: Array<{ id: string; data: Partial<T> }>,
  ) => Promise<void>;
  onRowDelete?: (ids: string[]) => Promise<void>;
  enableToolbar?: boolean;
  enableClipboard?: boolean;
  enableUndoRedo?: boolean;
  maxUndoRedoSteps?: number;
}

export interface WorkLogGridProps extends EnhancedGridProps<WorkLog> {
  projects: Project[];
  categories: WorkCategory[];
}

export interface GridAction {
  type: "ADD" | "UPDATE" | "DELETE" | "PASTE";
  timestamp: number;
  data: {
    id?: string;
    field?: string;
    oldValue?: unknown;
    newValue?: unknown;
    newRow?: unknown;
    duplicatedRows?: unknown[];
    deletedRows?: unknown[];
    originalRows?: unknown[];
  };
}

export interface GridHistoryStack {
  undoStack: GridAction[];
  redoStack: GridAction[];
  maxSize: number;
}

export interface ToolbarProps {
  gridApi?: GridApi;
  onAddRow: () => void;
  onDuplicateRows: () => void;
  onDeleteRows: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedRowCount: number;
  batchEditingEnabled?: boolean;
  enableQuickFilter?: boolean;
  quickFilterText?: string;
  onQuickFilterChange?: (filterText: string) => void;
  enableFilterToolPanel?: boolean;
  // Additional buttons for work log table
  onToggleBatchEdit?: () => void;
  onAddWorkLog?: () => void;
  onBatchSave?: () => void;
  onCancelBatchEdit?: () => void;
  isSavingBatch?: boolean;
}
