/**
 * Type definitions for pluggable table features
 *
 * This module defines the core interfaces and types for the composable table feature system.
 * Each feature hook implements a consistent interface to enable modular functionality.
 *
 * @see use-data-table.ts - Main integration hook
 * @see use-sorting-feature.ts - Sorting functionality
 * @see use-filtering-feature.ts - Filtering functionality
 * @see use-pagination-feature.ts - Pagination functionality
 */

/**
 * Base interface for all table feature hooks
 *
 * Each feature hook returns an object conforming to this interface,
 * providing configuration, state, and actions for that feature.
 *
 * @template TConfig - Configuration options for the feature
 * @template TState - State managed by the feature
 * @template TActions - Actions provided by the feature
 *
 * @example
 * ```typescript
 * interface SortingConfig {
 *   multiSort: boolean;
 * }
 *
 * interface SortingState {
 *   sortModel: Array<{ column: string; direction: 'asc' | 'desc' }>;
 * }
 *
 * interface SortingActions {
 *   setSort: (column: string, direction: 'asc' | 'desc') => void;
 *   clearSort: () => void;
 * }
 *
 * type SortingFeature = TableFeatureHook<SortingConfig, SortingState, SortingActions>;
 * ```
 */
export interface TableFeatureHook<
  TConfig = Record<string, unknown>,
  TState = Record<string, unknown>,
  TActions = Record<string, (...args: unknown[]) => unknown>,
> {
  /** Feature configuration (read-only) */
  config: Readonly<TConfig>;

  /** Current feature state */
  state: TState;

  /** Feature actions/methods */
  actions: TActions;

  /** Optional: Feature-specific AG Grid props */
  gridProps?: Record<string, unknown>;

  /** Optional: Feature-specific toolbar props */
  toolbarProps?: Record<string, unknown>;
}

/**
 * Sorting direction
 */
export type SortDirection = "asc" | "desc";

/**
 * Sort model for a single column
 */
export interface SortModel {
  /** Column field name */
  column: string;

  /** Sort direction */
  direction: SortDirection;
}

/**
 * Configuration for sorting feature
 */
export interface SortingConfig {
  /** Enable multi-column sorting */
  multiSort?: boolean;

  /** Initial sort configuration */
  initialSort?: SortModel[];

  /** Maximum number of simultaneous sorts (when multiSort is true) */
  maxSortColumns?: number;
}

/**
 * State for sorting feature
 */
export interface SortingState {
  /** Current sort model */
  sortModel: SortModel[];
}

/**
 * Actions for sorting feature
 */
export interface SortingActions {
  /** Set sort for a column */
  setSort: (column: string, direction: SortDirection) => void;

  /** Toggle sort direction for a column */
  toggleSort: (column: string) => void;

  /** Clear all sorting */
  clearSort: () => void;

  /** Clear sort for a specific column */
  clearColumnSort: (column: string) => void;
}

/**
 * Sorting feature hook type
 */
export type SortingFeature = TableFeatureHook<
  SortingConfig,
  SortingState,
  SortingActions
>;

/**
 * Filter mode
 */
export type FilterMode = "quick" | "advanced" | "both";

/**
 * Configuration for filtering feature
 */
export interface FilteringConfig {
  /** Filter mode */
  mode?: FilterMode;

  /** Debounce delay in milliseconds */
  debounce?: number;

  /** Enable floating filters */
  enableFloatingFilter?: boolean;

  /** Enable filter tool panel */
  enableFilterToolPanel?: boolean;
}

/**
 * State for filtering feature
 */
export interface FilteringState {
  /** Quick filter text */
  quickFilterText: string;

  /** Advanced filter model (AG Grid format) */
  filterModel: Record<string, unknown>;
}

/**
 * Actions for filtering feature
 */
export interface FilteringActions {
  /** Set quick filter text */
  setQuickFilter: (text: string) => void;

  /** Clear all filters */
  clearFilters: () => void;

  /** Set column filter */
  setColumnFilter: (column: string, filter: unknown) => void;
}

/**
 * Filtering feature hook type
 */
export type FilteringFeature = TableFeatureHook<
  FilteringConfig,
  FilteringState,
  FilteringActions
>;

/**
 * Pagination mode
 */
export type PaginationMode = "client" | "server";

/**
 * Configuration for pagination feature
 */
export interface PaginationConfig {
  /** Pagination mode */
  mode?: PaginationMode;

  /** Page size */
  pageSize?: number;

  /** Available page sizes */
  pageSizeOptions?: number[];

  /** Initial page */
  initialPage?: number;
}

/**
 * State for pagination feature
 */
export interface PaginationState {
  /** Current page (0-indexed) */
  currentPage: number;

  /** Page size */
  pageSize: number;

  /** Total number of rows */
  totalRows: number;

  /** Total number of pages */
  totalPages: number;
}

/**
 * Actions for pagination feature
 */
export interface PaginationActions {
  /** Go to specific page */
  goToPage: (page: number) => void;

  /** Go to next page */
  nextPage: () => void;

  /** Go to previous page */
  previousPage: () => void;

  /** Go to first page */
  firstPage: () => void;

  /** Go to last page */
  lastPage: () => void;

  /** Change page size */
  setPageSize: (size: number) => void;
}

/**
 * Pagination feature hook type
 */
export type PaginationFeature = TableFeatureHook<
  PaginationConfig,
  PaginationState,
  PaginationActions
>;

/**
 * Selection mode
 */
export type SelectionMode = "single" | "multiple";

/**
 * Configuration for selection feature
 */
export interface SelectionConfig {
  /** Selection mode */
  mode?: SelectionMode;

  /** Enable select all functionality */
  enableSelectAll?: boolean;

  /** Enable row click for selection */
  selectOnRowClick?: boolean;

  /** Callback when selection changes */
  onSelectionChange?: <TData>(selectedRows: TData[]) => void;
}

/**
 * State for selection feature
 */
export interface SelectionState<TData = unknown> {
  /** Currently selected rows */
  selectedRows: TData[];

  /** IDs of selected rows */
  selectedRowIds: Set<string>;

  /** Whether all rows are selected */
  isAllSelected: boolean;
}

/**
 * Actions for selection feature
 */
export interface SelectionActions<TData = unknown> {
  /** Select a row */
  selectRow: (row: TData) => void;

  /** Deselect a row */
  deselectRow: (row: TData) => void;

  /** Toggle row selection */
  toggleRowSelection: (row: TData) => void;

  /** Select all rows */
  selectAll: (rows: TData[]) => void;

  /** Deselect all rows */
  deselectAll: () => void;

  /** Set selected rows */
  setSelectedRows: (rows: TData[]) => void;
}

/**
 * Selection feature hook type
 */
export type SelectionFeature<TData = unknown> = TableFeatureHook<
  SelectionConfig,
  SelectionState<TData>,
  SelectionActions<TData>
>;

/**
 * Editing mode
 */
export type EditingMode = "inline" | "batch";

/**
 * Configuration for editing feature
 */
export interface EditingConfig {
  /** Editing mode */
  mode?: EditingMode;

  /** Enable auto-save on cell value change */
  enableAutoSave?: boolean;

  /** Validate on change */
  validateOnChange?: boolean;

  /** Callback to save changes (receives edited rows) */
  onSave?: <TData>(editedRows: Map<string, TData>) => Promise<void>;
}

/**
 * State for editing feature
 */
export interface EditingState<TData = unknown> {
  /** Rows being edited */
  editingRows: Map<string, TData>;

  /** Rows with unsaved changes */
  dirtyRows: Set<string>;

  /** Whether any row is being edited */
  isEditing: boolean;

  /** Whether there are unsaved changes */
  hasChanges: boolean;
}

/**
 * Actions for editing feature
 */
export interface EditingActions<TData = unknown> {
  /** Start editing a row */
  startEdit: (rowId: string, row: TData) => void;

  /** Stop editing a row */
  stopEdit: (rowId: string) => void;

  /** Update a cell value */
  updateCell: (rowId: string, field: string, value: unknown) => void;

  /** Save changes */
  saveChanges: () => Promise<void>;

  /** Discard changes */
  discardChanges: () => void;

  /** Reset editing state */
  reset: () => void;
}

/**
 * Editing feature hook type
 */
export type EditingFeature<TData = unknown> = TableFeatureHook<
  EditingConfig,
  EditingState<TData>,
  EditingActions<TData>
>;

/**
 * Action type for undo/redo
 */
export type ActionType = "UPDATE" | "ADD" | "DELETE";

/**
 * History action for undo/redo
 */
export interface HistoryAction<TData = unknown> {
  /** Action type */
  type: ActionType;

  /** Data before the action */
  before?: TData;

  /** Data after the action */
  after?: TData;

  /** Timestamp */
  timestamp: number;
}

/**
 * Configuration for undo/redo feature
 */
export interface UndoRedoConfig {
  /** Maximum number of undo steps */
  maxSteps?: number;

  /** Action types to track */
  trackingTypes?: ActionType[];

  /** Enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean;

  /** Callback to apply undo operation */
  onUndo?: <TData>(action: HistoryAction<TData>) => void;

  /** Callback to apply redo operation */
  onRedo?: <TData>(action: HistoryAction<TData>) => void;
}

/**
 * State for undo/redo feature
 */
export interface UndoRedoState<TData = unknown> {
  /** Undo stack */
  undoStack: HistoryAction<TData>[];

  /** Redo stack */
  redoStack: HistoryAction<TData>[];

  /** Whether undo is available */
  canUndo: boolean;

  /** Whether redo is available */
  canRedo: boolean;
}

/**
 * Actions for undo/redo feature
 */
export interface UndoRedoActions<TData = unknown> {
  /** Undo last action */
  undo: () => void;

  /** Redo last undone action */
  redo: () => void;

  /** Add action to history */
  pushAction: (action: HistoryAction<TData>) => void;

  /** Clear history */
  clearHistory: () => void;
}

/**
 * Undo/Redo feature hook type
 */
export type UndoRedoFeature<TData = unknown> = TableFeatureHook<
  UndoRedoConfig,
  UndoRedoState<TData>,
  UndoRedoActions<TData>
>;

/**
 * Configuration for row actions feature
 */
export interface RowActionsConfig {
  /** Enable add row functionality */
  enableAdd?: boolean;

  /** Enable delete row functionality */
  enableDelete?: boolean;

  /** Enable duplicate row functionality */
  enableDuplicate?: boolean;

  /** Show confirmation dialog before delete */
  confirmDelete?: boolean;

  /** Callback to add a new row */
  onAdd?: <TData>(row: TData) => void | Promise<void>;

  /** Callback to delete a row */
  onDelete?: (rowId: string) => void | Promise<void>;

  /** Callback to delete multiple rows */
  onDeleteBatch?: (rowIds: string[]) => void | Promise<void>;

  /** Callback to duplicate a row */
  onDuplicate?: <TData>(row: TData) => void | Promise<void>;
}

/**
 * State for row actions feature
 */
export interface RowActionsState {
  /** Whether add action is available */
  canAdd: boolean;

  /** Whether delete action is available */
  canDelete: boolean;

  /** Whether duplicate action is available */
  canDuplicate: boolean;
}

/**
 * Actions for row actions feature
 */
export interface RowActionsActions<TData = unknown> {
  /** Add a new row */
  addRow: (row: TData) => void;

  /** Delete a row */
  deleteRow: (rowId: string) => void;

  /** Duplicate a row */
  duplicateRow: (row: TData) => void;

  /** Delete multiple rows */
  deleteRows: (rowIds: string[]) => void;
}

/**
 * Row actions feature hook type
 */
export type RowActionsFeature<TData = unknown> = TableFeatureHook<
  RowActionsConfig,
  RowActionsState,
  RowActionsActions<TData>
>;

/**
 * Collection of enabled features
 */
export interface TableFeatures {
  sorting?: SortingFeature;
  filtering?: FilteringFeature;
  pagination?: PaginationFeature;
  selection?: SelectionFeature;
  editing?: EditingFeature;
  undoRedo?: UndoRedoFeature;
  rowActions?: RowActionsFeature;
}

/**
 * Configuration for useDataTable hook
 */
export interface DataTableConfig<TData> {
  /** Table data */
  data: TData[];

  /** Column definitions */
  columns: unknown[]; // AG Grid ColDef[], but keeping generic for now

  /** Enabled features */
  features?: TableFeatures;

  /** Optional: Custom grid options */
  gridOptions?: Record<string, unknown>;
}

/**
 * Return type for useDataTable hook
 */
export interface DataTableReturn {
  /** Props to spread on AgGridReact component */
  gridProps: Record<string, unknown>;

  /** Props for toolbar component */
  toolbarProps: Record<string, unknown>;

  /** Access to individual features */
  features: TableFeatures;
}
