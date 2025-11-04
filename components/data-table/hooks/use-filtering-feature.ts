"use client";

/**
 * Filtering feature hook for data tables
 *
 * Provides filtering functionality with support for quick filter (global search)
 * and advanced column-level filtering. Integrates with AG Grid's native filtering
 * capabilities while maintaining a clean, composable API.
 *
 * @example
 * ```typescript
 * const filtering = useFilteringFeature({
 *   mode: 'both',
 *   debounce: 300,
 *   enableFloatingFilter: true
 * });
 *
 * // Access state
 * console.log(filtering.state.quickFilterText);
 *
 * // Use actions
 * filtering.actions.setQuickFilter('search term');
 * filtering.actions.setColumnFilter('name', { type: 'contains', filter: 'John' });
 * filtering.actions.clearFilters();
 * ```
 */

import { useCallback, useEffect, useState } from "react";
import type {
  FilteringActions,
  FilteringConfig,
  FilteringFeature,
  FilteringState,
} from "./types";

/**
 * Default filtering configuration
 */
const DEFAULT_CONFIG: Required<FilteringConfig> = {
  /** Enable both quick and advanced filtering */
  mode: "both",
  /** 300ms debounce delay for search input to reduce re-renders */
  debounce: 300,
  /** Floating filters disabled by default (shown in column headers) */
  enableFloatingFilter: false,
  /** Filter tool panel disabled by default (sidebar with advanced filters) */
  enableFilterToolPanel: false,
};

/**
 * Custom hook for filtering feature
 *
 * @param config - Filtering configuration options
 * @returns Filtering feature object with config, state, and actions
 *
 * @example
 * ```typescript
 * // Basic usage
 * const filtering = useFilteringFeature();
 *
 * // With configuration
 * const filtering = useFilteringFeature({
 *   mode: 'quick',
 *   debounce: 500,
 *   enableFloatingFilter: true,
 *   enableFilterToolPanel: true
 * });
 * ```
 */
export function useFilteringFeature(
  config: FilteringConfig = {},
): FilteringFeature {
  // Merge config with defaults
  const mergedConfig: Required<FilteringConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Initialize state
  const [quickFilterText, setQuickFilterText] = useState<string>("");
  const [debouncedQuickFilterText, setDebouncedQuickFilterText] =
    useState<string>("");
  const [filterModel, setFilterModel] = useState<Record<string, unknown>>({});

  /**
   * Debounce quick filter text
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuickFilterText(quickFilterText);
    }, mergedConfig.debounce);

    return () => clearTimeout(timer);
  }, [quickFilterText, mergedConfig.debounce]);

  /**
   * Set quick filter text
   *
   * @param text - Filter text for global search
   */
  const setQuickFilter = useCallback((text: string) => {
    setQuickFilterText(text);
  }, []);

  /**
   * Clear all filters (both quick and advanced)
   */
  const clearFilters = useCallback(() => {
    setQuickFilterText("");
    setDebouncedQuickFilterText("");
    setFilterModel({});
  }, []);

  /**
   * Set column filter
   *
   * @param column - Column field name
   * @param filter - Filter configuration (AG Grid format)
   */
  const setColumnFilter = useCallback((column: string, filter: unknown) => {
    setFilterModel((prev) => ({
      ...prev,
      [column]: filter,
    }));
  }, []);

  // Prepare state
  const state: FilteringState = {
    quickFilterText: debouncedQuickFilterText,
    filterModel,
  };

  // Prepare actions
  const actions: FilteringActions = {
    setQuickFilter,
    clearFilters,
    setColumnFilter,
  };

  // Prepare AG Grid props
  const gridProps: Record<string, unknown> = {};

  // Quick filter props
  if (mergedConfig.mode === "quick" || mergedConfig.mode === "both") {
    gridProps.quickFilterText = debouncedQuickFilterText;
  }

  // Advanced filter props
  if (mergedConfig.mode === "advanced" || mergedConfig.mode === "both") {
    gridProps.floatingFilter = mergedConfig.enableFloatingFilter;
  }

  // Filter tool panel
  if (mergedConfig.enableFilterToolPanel) {
    gridProps.sideBar = {
      toolPanels: [
        {
          id: "filters",
          labelDefault: "Filters",
          labelKey: "filters",
          iconKey: "filter",
          toolPanel: "agFiltersToolPanel",
        },
      ],
    };
  }

  // Prepare toolbar props
  const toolbarProps: Record<string, unknown> = {
    showQuickFilter:
      mergedConfig.mode === "quick" || mergedConfig.mode === "both",
    quickFilterValue: quickFilterText,
    onQuickFilterChange: setQuickFilter,
    showClearFilters: true,
    onClearFilters: clearFilters,
  };

  return {
    config: mergedConfig,
    state,
    actions,
    gridProps,
    toolbarProps,
  };
}
