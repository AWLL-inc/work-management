"use client";

/**
 * Pagination feature hook for data tables
 *
 * Provides pagination functionality with support for both client-side and server-side
 * pagination modes. Integrates with AG Grid's native pagination capabilities while
 * maintaining a clean, composable API.
 *
 * @example
 * ```typescript
 * const pagination = usePaginationFeature({
 *   mode: 'client',
 *   pageSize: 20,
 *   pageSizeOptions: [10, 20, 50, 100]
 * });
 *
 * // Access state
 * console.log(pagination.state.currentPage);
 * console.log(pagination.state.totalPages);
 *
 * // Use actions
 * pagination.actions.nextPage();
 * pagination.actions.goToPage(5);
 * pagination.actions.setPageSize(50);
 * ```
 */

import { useCallback, useEffect, useState } from "react";
import type {
  PaginationActions,
  PaginationConfig,
  PaginationFeature,
  PaginationState,
} from "./types";

/**
 * Default pagination configuration
 */
const DEFAULT_CONFIG: Required<PaginationConfig> = {
  /** Client-side pagination by default (all data loaded at once) */
  mode: "client",
  /** Show 20 rows per page by default */
  pageSize: 20,
  /** Available page size options for user selection */
  pageSizeOptions: [10, 20, 50, 100],
  /** Start at first page (0-indexed) */
  initialPage: 0,
};

/**
 * Custom hook for pagination feature
 *
 * @param config - Pagination configuration options
 * @param totalRows - Total number of rows (required for calculating total pages)
 * @returns Pagination feature object with config, state, and actions
 *
 * @example
 * ```typescript
 * // Basic usage
 * const pagination = usePaginationFeature({}, 100);
 *
 * // With configuration
 * const pagination = usePaginationFeature({
 *   mode: 'server',
 *   pageSize: 50,
 *   pageSizeOptions: [25, 50, 100],
 *   initialPage: 0
 * }, 1000);
 * ```
 */
export function usePaginationFeature(
  config: PaginationConfig = {},
  totalRows = 0,
): PaginationFeature {
  // Merge config with defaults
  const mergedConfig: Required<PaginationConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Initialize state
  const [currentPage, setCurrentPage] = useState<number>(
    mergedConfig.initialPage,
  );
  const [pageSize, setPageSizeState] = useState<number>(mergedConfig.pageSize);

  // Calculate total pages
  const totalPages = Math.ceil(totalRows / pageSize);

  /**
   * Ensure current page is within valid range when totalRows changes
   */
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [totalRows, currentPage, totalPages]);

  /**
   * Go to a specific page
   *
   * @param page - Target page number (0-indexed)
   */
  const goToPage = useCallback(
    (page: number) => {
      const validPage = Math.max(0, Math.min(page, totalPages - 1));
      setCurrentPage(validPage);
    },
    [totalPages],
  );

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, Math.min(prev + 1, totalPages - 1)));
  }, [totalPages]);

  /**
   * Go to previous page
   */
  const previousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  }, []);

  /**
   * Go to first page
   */
  const firstPage = useCallback(() => {
    setCurrentPage(0);
  }, []);

  /**
   * Go to last page
   */
  const lastPage = useCallback(() => {
    setCurrentPage(Math.max(0, totalPages - 1));
  }, [totalPages]);

  /**
   * Change page size and reset to first page
   *
   * @param size - New page size
   */
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(0);
  }, []);

  // Prepare state
  const state: PaginationState = {
    currentPage,
    pageSize,
    totalRows,
    totalPages,
  };

  // Prepare actions
  const actions: PaginationActions = {
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setPageSize,
  };

  // Prepare AG Grid props
  const gridProps: Record<string, unknown> = {
    pagination: true,
    paginationPageSize: pageSize,
    paginationPageSizeSelector: mergedConfig.pageSizeOptions,
  };

  // Server-side pagination mode
  if (mergedConfig.mode === "server") {
    gridProps.rowModelType = "infinite";
    gridProps.cacheBlockSize = pageSize;
    gridProps.maxBlocksInCache = 2;
  }

  // Prepare toolbar props
  const toolbarProps: Record<string, unknown> = {
    showPagination: true,
    currentPage,
    pageSize,
    totalRows,
    totalPages,
    pageSizeOptions: mergedConfig.pageSizeOptions,
    onPageChange: goToPage,
    onPageSizeChange: setPageSize,
    onNextPage: nextPage,
    onPreviousPage: previousPage,
    onFirstPage: firstPage,
    onLastPage: lastPage,
  };

  return {
    config: mergedConfig,
    state,
    actions,
    gridProps,
    toolbarProps,
  };
}
