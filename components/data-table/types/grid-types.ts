import type { GridApi } from "ag-grid-community";
import type { WorkLog, Project, WorkCategory } from "@/drizzle/schema";

export interface GridTransaction<T = any> {
  add?: T[];
  remove?: T[];
  update?: T[];
  addIndex?: number;
}

export interface EnhancedGridProps<T = any> {
  rowData: T[];
  onDataChange?: (data: T[]) => void;
  onRowAdd?: (newRows: T[]) => Promise<void>;
  onRowUpdate?: (updates: Array<{ id: string; data: Partial<T> }>) => Promise<void>;
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
  type: 'ADD' | 'UPDATE' | 'DELETE' | 'PASTE';
  timestamp: number;
  data: any;
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
  disabled?: boolean;
}