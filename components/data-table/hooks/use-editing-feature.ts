"use client";

/**
 * Editing feature hook for data tables
 *
 * Provides inline and batch editing functionality with change tracking and validation.
 * Integrates with AG Grid's native editing capabilities while maintaining a clean,
 * composable API.
 *
 * @example
 * ```typescript
 * const editing = useEditingFeature({
 *   mode: 'batch',
 *   enableAutoSave: false,
 *   validateOnChange: true
 * });
 *
 * // Access state
 * console.log(editing.state.isEditing);
 * console.log(editing.state.hasChanges);
 *
 * // Use actions
 * editing.actions.startEdit('row-1', row);
 * editing.actions.updateCell('row-1', 'name', 'New Name');
 * await editing.actions.saveChanges();
 * ```
 */

import { useCallback, useState } from "react";
import type {
  EditingActions,
  EditingConfig,
  EditingFeature,
  EditingState,
} from "./types";

/**
 * Default editing configuration
 */
const DEFAULT_CONFIG: EditingConfig = {
  /** Batch editing mode by default (changes saved manually) */
  mode: "batch",
  /** Auto-save disabled by default */
  enableAutoSave: false,
  /** Validate on change enabled by default */
  validateOnChange: true,
  /** No callback by default */
  onSave: undefined,
};

/**
 * Custom hook for editing feature
 *
 * @param config - Editing configuration options
 * @returns Editing feature object with config, state, and actions
 *
 * @example
 * ```typescript
 * // Basic usage
 * const editing = useEditingFeature();
 *
 * // With configuration
 * const editing = useEditingFeature({
 *   mode: 'inline',
 *   enableAutoSave: true,
 *   validateOnChange: false
 * });
 * ```
 */
export function useEditingFeature<TData = unknown>(
  config: EditingConfig = {},
): EditingFeature<TData> {
  // Merge config with defaults
  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Initialize state
  const [editingRows, setEditingRows] = useState<Map<string, TData>>(new Map());
  const [dirtyRows, setDirtyRows] = useState<Set<string>>(new Set());

  /**
   * Start editing a row
   */
  const startEdit = useCallback((rowId: string, row: TData) => {
    setEditingRows((prev) => {
      const newMap = new Map(prev);
      newMap.set(rowId, row);
      return newMap;
    });
  }, []);

  /**
   * Stop editing a row
   */
  const stopEdit = useCallback((rowId: string) => {
    setEditingRows((prev) => {
      const newMap = new Map(prev);
      newMap.delete(rowId);
      return newMap;
    });
  }, []);

  /**
   * Update a cell value
   */
  const updateCell = useCallback(
    (rowId: string, field: string, value: unknown) => {
      // Update editing rows
      setEditingRows((prev) => {
        const newMap = new Map(prev);
        const row = newMap.get(rowId);

        if (row) {
          const updatedRow = {
            ...row,
            [field]: value,
          };
          newMap.set(rowId, updatedRow);
        }

        return newMap;
      });

      // Mark row as dirty (separated from above setState)
      setDirtyRows((prevDirty) => new Set([...prevDirty, rowId]));
    },
    [],
  );

  /**
   * Save changes
   * Calls the onSave callback with edited rows, then clears state on success
   */
  const saveChanges = useCallback(async () => {
    if (editingRows.size === 0) {
      return; // Nothing to save
    }
    // Call parent's save handler if provided
    if (mergedConfig.onSave) {
      await mergedConfig.onSave(editingRows);
    }

    // Clear state after successful save
    setDirtyRows(new Set());

    if (mergedConfig.mode === "batch") {
      setEditingRows(new Map());
    }
  }, [mergedConfig, editingRows]);

  /**
   * Discard changes
   */
  const discardChanges = useCallback(() => {
    setEditingRows(new Map());
    setDirtyRows(new Set());
  }, []);

  /**
   * Reset editing state
   */
  const reset = useCallback(() => {
    setEditingRows(new Map());
    setDirtyRows(new Set());
  }, []);

  // Prepare state
  const state: EditingState<TData> = {
    editingRows,
    dirtyRows,
    isEditing: editingRows.size > 0,
    hasChanges: dirtyRows.size > 0,
  };

  // Prepare actions
  const actions: EditingActions<TData> = {
    startEdit,
    stopEdit,
    updateCell,
    saveChanges,
    discardChanges,
    reset,
  };

  // Prepare AG Grid props
  const gridProps: Record<string, unknown> = {
    editType: mergedConfig.mode === "inline" ? "fullRow" : undefined,
    singleClickEdit: mergedConfig.mode === "inline",
    stopEditingWhenCellsLoseFocus: mergedConfig.mode === "inline",
  };

  // Prepare toolbar props
  const toolbarProps: Record<string, unknown> = {
    showSaveButton: mergedConfig.mode === "batch" && state.hasChanges,
    showDiscardButton: mergedConfig.mode === "batch" && state.hasChanges,
    onSave: saveChanges,
    onDiscard: discardChanges,
    hasChanges: state.hasChanges,
  };

  return {
    config: mergedConfig,
    state,
    actions,
    gridProps,
    toolbarProps,
  };
}
