"use client";

/**
 * Sorting feature hook for data tables
 *
 * Provides sorting functionality with support for single and multi-column sorting.
 * Integrates with AG Grid's native sorting capabilities while maintaining
 * a clean, composable API.
 *
 * @example
 * ```typescript
 * const sorting = useSortingFeature({
 *   multiSort: true,
 *   initialSort: [{ column: 'date', direction: 'desc' }]
 * });
 *
 * // Access state
 * console.log(sorting.state.sortModel);
 *
 * // Use actions
 * sorting.actions.setSort('name', 'asc');
 * sorting.actions.toggleSort('date');
 * sorting.actions.clearSort();
 * ```
 */

import { useCallback, useState } from "react";
import type {
  SortDirection,
  SortingActions,
  SortingConfig,
  SortingFeature,
  SortingState,
  SortModel,
} from "./types";

/**
 * Default sorting configuration
 */
const DEFAULT_CONFIG: Required<SortingConfig> = {
  /** Single-column sorting by default */
  multiSort: false,
  /** No initial sort applied */
  initialSort: [],
  /** Maximum 3 columns can be sorted simultaneously in multi-sort mode */
  maxSortColumns: 3,
};

/**
 * Custom hook for sorting feature
 *
 * @param config - Sorting configuration options
 * @returns Sorting feature object with config, state, and actions
 *
 * @example
 * ```typescript
 * // Basic usage
 * const sorting = useSortingFeature();
 *
 * // With configuration
 * const sorting = useSortingFeature({
 *   multiSort: true,
 *   initialSort: [{ column: 'date', direction: 'desc' }],
 *   maxSortColumns: 5
 * });
 * ```
 */
export function useSortingFeature(config: SortingConfig = {}): SortingFeature {
  // Merge config with defaults
  const mergedConfig: Required<SortingConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Initialize state
  const [sortModel, setSortModel] = useState<SortModel[]>(
    mergedConfig.initialSort,
  );

  /**
   * Set sort for a specific column
   *
   * @param column - Column field name
   * @param direction - Sort direction ('asc' or 'desc')
   */
  const setSort = useCallback(
    (column: string, direction: SortDirection) => {
      setSortModel((prev) => {
        if (mergedConfig.multiSort) {
          // Multi-column sorting: Add or update column in sort model
          const existingIndex = prev.findIndex((s) => s.column === column);

          if (existingIndex >= 0) {
            // Update existing sort
            const newModel = [...prev];
            newModel[existingIndex] = { column, direction };
            return newModel;
          }

          // Add new sort (respect maxSortColumns limit)
          const newModel = [...prev, { column, direction }];
          return newModel.slice(-mergedConfig.maxSortColumns);
        }

        // Single-column sorting: Replace entire sort model
        return [{ column, direction }];
      });
    },
    [mergedConfig.multiSort, mergedConfig.maxSortColumns],
  );

  /**
   * Toggle sort direction for a column
   *
   * Cycle: no sort → asc → desc → no sort (for multi-column)
   * Cycle: asc → desc → asc (for single-column)
   *
   * @param column - Column field name
   */
  const toggleSort = useCallback(
    (column: string) => {
      setSortModel((prev) => {
        const existingSort = prev.find((s) => s.column === column);

        if (!existingSort) {
          // No existing sort, add ascending
          const ascSort: SortModel = { column, direction: "asc" };
          return mergedConfig.multiSort
            ? [...prev, ascSort].slice(-mergedConfig.maxSortColumns)
            : [ascSort];
        }

        if (existingSort.direction === "asc") {
          // asc → desc
          const descSort: SortModel = { column, direction: "desc" };
          if (mergedConfig.multiSort) {
            return prev.map((s) => (s.column === column ? descSort : s));
          }
          return [descSort];
        }

        // desc → no sort (multi-column) or asc (single-column)
        if (mergedConfig.multiSort) {
          // Remove sort for this column
          return prev.filter((s) => s.column !== column);
        }

        // For single-column, go back to asc
        const ascSort: SortModel = { column, direction: "asc" };
        return [ascSort];
      });
    },
    [mergedConfig.multiSort, mergedConfig.maxSortColumns],
  );

  /**
   * Clear all sorting
   */
  const clearSort = useCallback(() => {
    setSortModel([]);
  }, []);

  /**
   * Clear sort for a specific column
   *
   * @param column - Column field name
   */
  const clearColumnSort = useCallback((column: string) => {
    setSortModel((prev) => prev.filter((s) => s.column !== column));
  }, []);

  // Prepare state
  const state: SortingState = {
    sortModel,
  };

  // Prepare actions
  const actions: SortingActions = {
    setSort,
    toggleSort,
    clearSort,
    clearColumnSort,
  };

  // Prepare AG Grid props
  const gridProps = {
    // AG Grid uses onSortChanged event to notify sorting changes
    // We'll implement this integration in useDataTable
    // Type cast required: AG Grid expects mutable array of union type
    sortingOrder: ["asc", "desc", null] as ("asc" | "desc" | null)[],
    multiSortKey: mergedConfig.multiSort ? "ctrl" : undefined,
  };

  return {
    config: mergedConfig,
    state,
    actions,
    gridProps,
  };
}
