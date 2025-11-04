"use client";

/**
 * Main data table integration hook
 *
 * Combines all pluggable table features (sorting, filtering, pagination, etc.)
 * into a unified, composable API. This is the primary hook consumers should use
 * to build data tables with AG Grid.
 *
 * @example
 * ```typescript
 * const table = useDataTable({
 *   data: projects,
 *   columns: columnDefs,
 *   features: {
 *     sorting: useSortingFeature({ multiSort: true }),
 *     filtering: useFilteringFeature({ mode: 'both' }),
 *     pagination: usePaginationFeature({ pageSize: 20 }, projects.length)
 *   }
 * });
 *
 * // Use in component
 * <AgGridReact {...table.gridProps} />
 * <DataTableToolbar {...table.toolbarProps} />
 * ```
 */

import { useMemo } from "react";
import type { DataTableConfig, DataTableReturn, TableFeatures } from "./types";

/**
 * Custom hook for data table with pluggable features
 *
 * @param config - Data table configuration with data, columns, and features
 * @returns Object with gridProps, toolbarProps, and feature access
 *
 * @example
 * ```typescript
 * // Minimal usage (no features)
 * const table = useDataTable({
 *   data: users,
 *   columns: userColumns
 * });
 *
 * // With all features
 * const table = useDataTable({
 *   data: workLogs,
 *   columns: workLogColumns,
 *   features: {
 *     sorting: useSortingFeature({
 *       multiSort: true,
 *       initialSort: [{ column: 'date', direction: 'desc' }]
 *     }),
 *     filtering: useFilteringFeature({
 *       mode: 'both',
 *       enableFloatingFilter: true
 *     }),
 *     pagination: usePaginationFeature({
 *       pageSize: 50,
 *       pageSizeOptions: [25, 50, 100]
 *     }, workLogs.length)
 *   },
 *   gridOptions: {
 *     rowHeight: 40,
 *     animateRows: true
 *   }
 * });
 *
 * // Access features
 * table.features.sorting?.actions.setSort('name', 'asc');
 * table.features.filtering?.actions.setQuickFilter('search');
 * table.features.pagination?.actions.nextPage();
 * ```
 */
export function useDataTable<TData>(
  config: DataTableConfig<TData>,
): DataTableReturn {
  const { data, columns, features = {}, gridOptions = {} } = config;

  /**
   * Merge all feature gridProps into a single object
   */
  const gridProps = useMemo(() => {
    const mergedProps: Record<string, unknown> = {
      // Base AG Grid props
      rowData: data,
      columnDefs: columns,

      // Default grid options
      defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true,
      },

      // User-provided grid options (can override defaults)
      ...gridOptions,
    };

    // Merge feature gridProps
    if (features.sorting) {
      Object.assign(mergedProps, features.sorting.gridProps);
    }

    if (features.filtering) {
      Object.assign(mergedProps, features.filtering.gridProps);
    }

    if (features.pagination) {
      Object.assign(mergedProps, features.pagination.gridProps);
    }

    return mergedProps;
  }, [
    data,
    columns,
    features.sorting,
    features.filtering,
    features.pagination,
    gridOptions,
  ]);

  /**
   * Merge all feature toolbarProps into a single object
   */
  const toolbarProps = useMemo(() => {
    const mergedProps: Record<string, unknown> = {};

    // Merge feature toolbarProps
    if (features.sorting) {
      Object.assign(mergedProps, features.sorting.toolbarProps || {});
    }

    if (features.filtering) {
      Object.assign(mergedProps, features.filtering.toolbarProps || {});
    }

    if (features.pagination) {
      Object.assign(mergedProps, features.pagination.toolbarProps || {});
    }

    return mergedProps;
  }, [features.sorting, features.filtering, features.pagination]);

  /**
   * Provide access to individual features
   */
  const enabledFeatures: TableFeatures = {
    sorting: features.sorting,
    filtering: features.filtering,
    pagination: features.pagination,
  };

  return {
    gridProps,
    toolbarProps,
    features: enabledFeatures,
  };
}
