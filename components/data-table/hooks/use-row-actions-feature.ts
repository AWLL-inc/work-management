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
const DEFAULT_CONFIG: RowActionsConfig = {
  /** Enable add by default */
  enableAdd: true,
  /** Enable delete by default */
  enableDelete: true,
  /** Enable duplicate by default */
  enableDuplicate: true,
  /** Confirm delete by default */
  confirmDelete: true,
  /** No callbacks by default */
  onAdd: undefined,
  onDelete: undefined,
  onDeleteBatch: undefined,
  onDuplicate: undefined,
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
  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Initialize state for pending operations
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  /**
   * Add a new row
   * Calls the parent's onAdd callback if provided
   */
  const addRow = useCallback(
    async (row: TData) => {
      if (mergedConfig.onAdd) {
        await mergedConfig.onAdd(row);
      }
    },
    [mergedConfig],
  );

  /**
   * Delete a row
   * Shows confirmation dialog if configured, otherwise deletes immediately
   */
  const deleteRow = useCallback(
    async (rowId: string) => {
      if (mergedConfig.confirmDelete) {
        // Set pending delete state for confirmation dialog
        setPendingDeleteId(rowId);
      } else {
        // Delete immediately without confirmation
        if (mergedConfig.onDelete) {
          await mergedConfig.onDelete(rowId);
        }
      }
    },
    [mergedConfig],
  );

  /**
   * Duplicate a row
   * Creates a copy of the row and calls the appropriate callback
   */
  const duplicateRow = useCallback(
    async (row: TData) => {
      // Use onDuplicate callback if provided, otherwise fall back to onAdd
      if (mergedConfig.onDuplicate) {
        await mergedConfig.onDuplicate(row);
      } else if (mergedConfig.onAdd) {
        // Create a copy with a new ID and use onAdd
        const duplicatedRow = {
          ...row,
          id: `${(row as { id?: string })?.id}-copy-${Date.now()}`,
        };
        await mergedConfig.onAdd(duplicatedRow as TData);
      }
    },
    [mergedConfig],
  );

  /**
   * Delete multiple rows
   */
  const deleteRows = useCallback(
    async (rowIds: string[]) => {
      if (mergedConfig.confirmDelete) {
        // For batch delete confirmation, you might want to handle this differently
        // For now, we'll require parent to handle confirmation UI
        // Just call the batch delete callback
        if (mergedConfig.onDeleteBatch) {
          await mergedConfig.onDeleteBatch(rowIds);
        }
      } else {
        // Delete immediately without confirmation
        if (mergedConfig.onDeleteBatch) {
          await mergedConfig.onDeleteBatch(rowIds);
        } else if (mergedConfig.onDelete) {
          // Fall back to individual deletes if batch not available
          await Promise.all(rowIds.map((id) => mergedConfig.onDelete?.(id)));
        }
      }
    },
    [mergedConfig],
  );

  /**
   * Confirm pending delete operation
   */
  const confirmDelete = useCallback(async () => {
    if (pendingDeleteId) {
      // Call the delete callback
      if (mergedConfig.onDelete) {
        await mergedConfig.onDelete(pendingDeleteId);
      }
      // Clear pending state after successful delete
      setPendingDeleteId(null);
    }
  }, [pendingDeleteId, mergedConfig]);

  /**
   * Cancel pending delete operation
   */
  const cancelDelete = useCallback(() => {
    setPendingDeleteId(null);
  }, []);

  // Prepare state
  const state: RowActionsState = {
    canAdd: mergedConfig.enableAdd ?? true,
    canDelete: mergedConfig.enableDelete ?? true,
    canDuplicate: mergedConfig.enableDuplicate ?? true,
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
