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
 *   usePaginationFeature
 * } from '@/components/data-table/hooks';
 *
 * const table = useDataTable({
 *   data: projects,
 *   columns: columnDefs,
 *   features: {
 *     sorting: useSortingFeature({ multiSort: true }),
 *     filtering: useFilteringFeature({ mode: 'both' }),
 *     pagination: usePaginationFeature({ pageSize: 20 }, projects.length)
 *   }
 * });
 * ```
 */

// Type exports
export type {
  DataTableConfig,
  DataTableReturn,
  FilteringActions,
  FilteringConfig,
  FilteringFeature,
  FilteringState,
  FilterMode,
  PaginationActions,
  PaginationConfig,
  PaginationFeature,
  PaginationMode,
  PaginationState,
  SortDirection,
  SortingActions,
  SortingConfig,
  SortingFeature,
  SortingState,
  SortModel,
  TableFeatureHook,
  TableFeatures,
} from "./types";
// Main integration hook
export { useDataTable } from "./use-data-table";
// Feature hooks
export { useFilteringFeature } from "./use-filtering-feature";
export { usePaginationFeature } from "./use-pagination-feature";
export { useSortingFeature } from "./use-sorting-feature";
