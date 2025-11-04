"use client";

/**
 * Row actions feature hook for data tables
 *
 * Provides row manipulation functionality including add, delete, and duplicate operations.
 * Integrates with AG Grid's data management while maintaining a clean, composable API.
 *
 * @example
 * ```typescript
 * const rowActions = useRowActionsFeature({
 *   enableAdd: true,
 *   enableDelete: true,
 *   enableDuplicate: true,
 *   confirmDelete: true
 * });
 *
 * // Access state
 * console.log(rowActions.state.canAdd);
 * console.log(rowActions.state.canDelete);
 *
 * // Use actions
 * rowActions.actions.addRow(newRow);
 * rowActions.actions.deleteRow('row-id');
 * rowActions.actions.duplicateRow(row);
 * ```
 */

import { useCallback, useState } from "react";
import type {
  RowActionsActions,
  RowActionsConfig,
  RowActionsFeature,
  RowActionsState,
} from "./types";

/**
 * Default row actions configuration
 */
const DEFAULT_CONFIG: Required<RowActionsConfig> = {
  /** Enable add by default */
  enableAdd: true,
  /** Enable delete by default */
  enableDelete: true,
  /** Enable duplicate by default */
  enableDuplicate: true,
  /** Confirm delete by default */
  confirmDelete: true,
};

/**
 * Custom hook for row actions feature
 *
 * @param config - Row actions configuration options
 * @returns Row actions feature object with config, state, and actions
 *
 * @example
 * ```typescript
 * // Basic usage
 * const rowActions = useRowActionsFeature();
 *
 * // With configuration
 * const rowActions = useRowActionsFeature({
 *   enableAdd: true,
 *   enableDelete: true,
 *   enableDuplicate: false,
 *   confirmDelete: false
 * });
 * ```
 */
export function useRowActionsFeature<TData = unknown>(
  config: RowActionsConfig = {},
): RowActionsFeature<TData> {
  // Merge config with defaults
  const mergedConfig: Required<RowActionsConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Initialize state for pending operations
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  /**
   * Add a new row
   * In a real implementation, this would call an API to create the row
   */
  const addRow = useCallback((row: TData) => {
    // TODO: Implement actual add logic
    // This would typically call a callback provided by the parent
    // or dispatch an action to add the row to the grid
    console.log("Adding row:", row);
  }, []);

  /**
   * Delete a row
   * Shows confirmation dialog if configured
   */
  const deleteRow = useCallback(
    (rowId: string) => {
      if (mergedConfig.confirmDelete) {
        setPendingDeleteId(rowId);
        // TODO: Show confirmation dialog
        // For now, just log
        console.log("Confirm delete for row:", rowId);
      } else {
        // TODO: Implement actual delete logic
        console.log("Deleting row:", rowId);
      }
    },
    [mergedConfig.confirmDelete],
  );

  /**
   * Duplicate a row
   * Creates a copy of the row with a new ID
   */
  const duplicateRow = useCallback(
    (row: TData) => {
      // TODO: Implement actual duplicate logic
      // This would typically create a new row with the same data but a new ID
      const duplicatedRow = {
        ...row,
        id: `${(row as { id?: string })?.id}-copy-${Date.now()}`,
      };
      addRow(duplicatedRow as TData);
    },
    [addRow],
  );

  /**
   * Delete multiple rows
   */
  const deleteRows = useCallback(
    (rowIds: string[]) => {
      if (mergedConfig.confirmDelete) {
        // TODO: Show confirmation dialog for multiple rows
        console.log("Confirm delete for rows:", rowIds);
      } else {
        // TODO: Implement actual delete logic
        console.log("Deleting rows:", rowIds);
      }
    },
    [mergedConfig.confirmDelete],
  );

  /**
   * Confirm pending delete operation
   */
  const confirmDelete = useCallback(() => {
    if (pendingDeleteId) {
      // TODO: Implement actual delete logic
      console.log("Confirmed delete for row:", pendingDeleteId);
      setPendingDeleteId(null);
    }
  }, [pendingDeleteId]);

  /**
   * Cancel pending delete operation
   */
  const cancelDelete = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  // Prepare state
  const state: RowActionsState = {
    canAdd: mergedConfig.enableAdd,
    canDelete: mergedConfig.enableDelete,
    canDuplicate: mergedConfig.enableDuplicate,
  };

  // Prepare actions
  const actions: RowActionsActions<TData> = {
    addRow,
    deleteRow,
    duplicateRow,
    deleteRows,
  };

  // Prepare AG Grid props (no specific AG Grid integration needed)
  const gridProps: Record<string, unknown> = {};

  // Prepare toolbar props
  const toolbarProps: Record<string, unknown> = {
    showAddButton: mergedConfig.enableAdd,
    showDeleteButton: mergedConfig.enableDelete,
    onAdd: addRow,
    onDelete: deleteRow,
    pendingDeleteId,
    onConfirmDelete: confirmDelete,
    onCancelDelete: cancelDelete,
  };

  return {
    config: mergedConfig,
    state,
    actions,
    gridProps,
    toolbarProps,
  };
}
