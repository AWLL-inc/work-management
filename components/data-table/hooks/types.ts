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
 * Collection of enabled features
 */
export interface TableFeatures {
  sorting?: SortingFeature;
  filtering?: FilteringFeature;
  pagination?: PaginationFeature;
  // Future features will be added here
  // selection?: SelectionFeature;
  // editing?: EditingFeature;
  // undoRedo?: UndoRedoFeature;
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
