"use client";

/**
 * Selection feature hook for data tables
 *
 * Provides row selection functionality with support for single and multiple selection modes.
 * Integrates with AG Grid's native selection capabilities while maintaining a clean,
 * composable API.
 *
 * @example
 * ```typescript
 * const selection = useSelectionFeature({
 *   mode: 'multiple',
 *   enableSelectAll: true,
 *   selectOnRowClick: true
 * });
 *
 * // Access state
 * console.log(selection.state.selectedRows);
 * console.log(selection.state.isAllSelected);
 *
 * // Use actions
 * selection.actions.selectRow(row);
 * selection.actions.selectAll(allRows);
 * selection.actions.deselectAll();
 * ```
 */

import { useCallback, useState } from "react";
import type {
  SelectionActions,
  SelectionConfig,
  SelectionFeature,
  SelectionState,
} from "./types";

/**
 * Default selection configuration
 */
const DEFAULT_CONFIG: SelectionConfig = {
  /** Multiple selection by default */
  mode: "multiple",
  /** Select all enabled by default */
  enableSelectAll: true,
  /** Row click for selection disabled by default (use checkbox instead) */
  selectOnRowClick: false,
  /** No callback by default */
  onSelectionChange: undefined,
};

/**
 * Custom hook for selection feature
 *
 * @param config - Selection configuration options
 * @returns Selection feature object with config, state, and actions
 *
 * @example
 * ```typescript
 * // Basic usage
 * const selection = useSelectionFeature();
 *
 * // With configuration
 * const selection = useSelectionFeature({
 *   mode: 'single',
 *   enableSelectAll: false,
 *   selectOnRowClick: true
 * });
 * ```
 */
export function useSelectionFeature<TData = unknown>(
  config: SelectionConfig = {},
): SelectionFeature<TData> {
  // Merge config with defaults
  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Initialize state
  const [selectedRows, setSelectedRows] = useState<TData[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  /**
   * Get row ID from row data
   * Assumes row has an 'id' property
   */
  const getRowId = useCallback((row: TData): string => {
    return (row as { id?: string })?.id || String(row);
  }, []);

  /**
   * Select a row
   */
  const selectRow = useCallback(
    (row: TData) => {
      const rowId = getRowId(row);

      if (mergedConfig.mode === "single") {
        // Single mode: Replace selection
        const newSelection = [row];
        setSelectedRows(newSelection);
        setSelectedRowIds(new Set([rowId]));
        // Notify parent of selection change
        mergedConfig.onSelectionChange?.(newSelection);
      } else {
        // Multiple mode: Add to selection
        setSelectedRows((prev) => {
          if (prev.some((r) => getRowId(r) === rowId)) {
            return prev; // Already selected
          }
          const newSelection = [...prev, row];
          // Notify parent of selection change
          mergedConfig.onSelectionChange?.(newSelection);
          return newSelection;
        });
        setSelectedRowIds((prev) => new Set([...prev, rowId]));
      }
    },
    [mergedConfig, getRowId],
  );

  /**
   * Deselect a row
   */
  const deselectRow = useCallback(
    (row: TData) => {
      const rowId = getRowId(row);

      setSelectedRows((prev) => {
        const newSelection = prev.filter((r) => getRowId(r) !== rowId);
        // Notify parent of selection change
        mergedConfig.onSelectionChange?.(newSelection);
        return newSelection;
      });
      setSelectedRowIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(rowId);
        return newSet;
      });
    },
    [getRowId, mergedConfig],
  );

  /**
   * Toggle row selection
   */
  const toggleRowSelection = useCallback(
    (row: TData) => {
      const rowId = getRowId(row);

      if (selectedRowIds.has(rowId)) {
        deselectRow(row);
      } else {
        selectRow(row);
      }
    },
    [selectedRowIds, deselectRow, selectRow, getRowId],
  );

  /**
   * Select all rows
   */
  const selectAll = useCallback(
    (rows: TData[]) => {
      if (mergedConfig.mode === "single") {
        // Single mode: No-op for selectAll
        return;
      }

      setSelectedRows(rows);
      setSelectedRowIds(new Set(rows.map((row) => getRowId(row))));
      // Notify parent of selection change
      mergedConfig.onSelectionChange?.(rows);
    },
    [mergedConfig, getRowId],
  );

  /**
   * Deselect all rows
   */
  const deselectAll = useCallback(() => {
    setSelectedRows([]);
    setSelectedRowIds(new Set());
    // Notify parent of selection change
    mergedConfig.onSelectionChange?.([]);
  }, [mergedConfig]);

  /**
   * Set selected rows directly
   */
  const setSelectedRowsAction = useCallback(
    (rows: TData[]) => {
      let newSelection: TData[];

      if (mergedConfig.mode === "single" && rows.length > 1) {
        // Single mode: Take first row only
        const firstRow = rows[0];
        if (firstRow) {
          newSelection = [firstRow];
          setSelectedRows(newSelection);
          setSelectedRowIds(new Set([getRowId(firstRow)]));
        } else {
          newSelection = [];
        }
      } else {
        newSelection = rows;
        setSelectedRows(rows);
        setSelectedRowIds(new Set(rows.map((row) => getRowId(row))));
      }

      // Notify parent of selection change
      mergedConfig.onSelectionChange?.(newSelection);
    },
    [mergedConfig, getRowId],
  );

  // Prepare state
  const state: SelectionState<TData> = {
    selectedRows,
    selectedRowIds,
    isAllSelected: false, // This will be updated by parent when data changes
  };

  // Prepare actions
  const actions: SelectionActions<TData> = {
    selectRow,
    deselectRow,
    toggleRowSelection,
    selectAll,
    deselectAll,
    setSelectedRows: setSelectedRowsAction,
  };

  // Prepare AG Grid props
  const gridProps: Record<string, unknown> = {
    rowSelection: mergedConfig.mode,
    suppressRowClickSelection: !mergedConfig.selectOnRowClick,
    suppressRowDeselection: false,
  };

  // Prepare toolbar props
  const toolbarProps: Record<string, unknown> = {
    showSelectAll:
      mergedConfig.enableSelectAll && mergedConfig.mode === "multiple",
    selectedCount: selectedRows.length,
    onSelectAll: selectAll,
    onDeselectAll: deselectAll,
  };

  return {
    config: mergedConfig,
    state,
    actions,
    gridProps,
    toolbarProps,
  };
}
