/**
 * Data table hooks - Pluggable feature system
 *
 * This module exports all data table feature hooks and types.
 * Use these to build composable, type-safe data tables with AG Grid.
 *
 * @example
 * ```typescript
 * import {
 *   useDataTable,
 *   useSortingFeature,
 *   useFilteringFeature,
 *   usePaginationFeature,
 *   useSelectionFeature,
 *   useEditingFeature,
 *   useUndoRedoFeature,
 *   useRowActionsFeature
 * } from '@/components/data-table/hooks';
 *
 * const table = useDataTable({
 *   data: projects,
 *   columns: columnDefs,
 *   features: {
 *     sorting: useSortingFeature({ multiSort: true }),
 *     filtering: useFilteringFeature({ mode: 'both' }),
 *     pagination: usePaginationFeature({ pageSize: 20 }, projects.length),
 *     selection: useSelectionFeature({ mode: 'multiple' }),
 *     editing: useEditingFeature({ mode: 'batch' }),
 *     undoRedo: useUndoRedoFeature({ maxSteps: 20 }),
 *     rowActions: useRowActionsFeature({ confirmDelete: true })
 *   }
 * });
 * ```
 */

// Type exports
export type {
  ActionType,
  DataTableConfig,
  DataTableReturn,
  EditingActions,
  EditingConfig,
  EditingFeature,
  EditingMode,
  EditingState,
  FilteringActions,
  FilteringConfig,
  FilteringFeature,
  FilteringState,
  FilterMode,
  HistoryAction,
  PaginationActions,
  PaginationConfig,
  PaginationFeature,
  PaginationMode,
  PaginationState,
  RowActionsActions,
  RowActionsConfig,
  RowActionsFeature,
  RowActionsState,
  SelectionActions,
  SelectionConfig,
  SelectionFeature,
  SelectionMode,
  SelectionState,
  SortDirection,
  SortingActions,
  SortingConfig,
  SortingFeature,
  SortingState,
  SortModel,
  TableFeatureHook,
  TableFeatures,
  UndoRedoActions,
  UndoRedoConfig,
  UndoRedoFeature,
  UndoRedoState,
} from "./types";

// Main integration hook
export { useDataTable } from "./use-data-table";
// Phase 2: Advanced feature hooks
export { useEditingFeature } from "./use-editing-feature";
// Phase 1: Core feature hooks
export { useFilteringFeature } from "./use-filtering-feature";
export { usePaginationFeature } from "./use-pagination-feature";
export { useRowActionsFeature } from "./use-row-actions-feature";
export { useSelectionFeature } from "./use-selection-feature";
export { useSortingFeature } from "./use-sorting-feature";
export { useUndoRedoFeature } from "./use-undo-redo-feature";
