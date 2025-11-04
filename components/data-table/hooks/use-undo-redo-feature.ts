"use client";

/**
 * Undo/Redo feature hook for data tables
 *
 * Provides undo/redo functionality with action history management and keyboard shortcuts.
 * Tracks data changes and allows users to undo/redo operations.
 *
 * @example
 * ```typescript
 * const undoRedo = useUndoRedoFeature({
 *   maxSteps: 20,
 *   trackingTypes: ['UPDATE', 'ADD', 'DELETE'],
 *   enableKeyboardShortcuts: true
 * });
 *
 * // Access state
 * console.log(undoRedo.state.canUndo);
 * console.log(undoRedo.state.canRedo);
 *
 * // Use actions
 * undoRedo.actions.pushAction(action);
 * undoRedo.actions.undo();
 * undoRedo.actions.redo();
 * ```
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  HistoryAction,
  UndoRedoActions,
  UndoRedoConfig,
  UndoRedoFeature,
  UndoRedoState,
} from "./types";

/**
 * Default undo/redo configuration
 */
const DEFAULT_CONFIG: Required<UndoRedoConfig> = {
  /** Maximum 20 undo steps by default */
  maxSteps: 20,
  /** Track all action types by default */
  trackingTypes: ["UPDATE", "ADD", "DELETE"],
  /** Enable keyboard shortcuts by default */
  enableKeyboardShortcuts: true,
};

/**
 * Custom hook for undo/redo feature
 *
 * @param config - Undo/redo configuration options
 * @returns Undo/redo feature object with config, state, and actions
 *
 * @example
 * ```typescript
 * // Basic usage
 * const undoRedo = useUndoRedoFeature();
 *
 * // With configuration
 * const undoRedo = useUndoRedoFeature({
 *   maxSteps: 50,
 *   trackingTypes: ['UPDATE'],
 *   enableKeyboardShortcuts: false
 * });
 * ```
 */
export function useUndoRedoFeature<TData = unknown>(
  config: UndoRedoConfig = {},
): UndoRedoFeature<TData> {
  // Merge config with defaults
  const mergedConfig: Required<UndoRedoConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Initialize state
  const [undoStack, setUndoStack] = useState<HistoryAction<TData>[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryAction<TData>[]>([]);

  // Refs for stable function references in event handlers
  const undoRef = useRef<() => void>(() => {});
  const redoRef = useRef<() => void>(() => {});

  /**
   * Undo last action
   */
  const undo = useCallback(() => {
    if (undoStack.length === 0) {
      return;
    }

    const action = undoStack[undoStack.length - 1];
    if (!action) {
      return;
    }

    // Move action from undo stack to redo stack
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, action]);

    // TODO: Apply the undo operation to the data
    // This would typically involve calling a callback provided by the parent
  }, [undoStack]);

  /**
   * Redo last undone action
   */
  const redo = useCallback(() => {
    if (redoStack.length === 0) {
      return;
    }

    const action = redoStack[redoStack.length - 1];
    if (!action) {
      return;
    }

    // Move action from redo stack to undo stack
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, action]);

    // TODO: Apply the redo operation to the data
    // This would typically involve calling a callback provided by the parent
  }, [redoStack]);

  /**
   * Push a new action to the undo stack
   */
  const pushAction = useCallback(
    (action: HistoryAction<TData>) => {
      // Check if this action type should be tracked
      if (!mergedConfig.trackingTypes.includes(action.type)) {
        return;
      }

      // Add action to undo stack
      setUndoStack((prev) => {
        const newStack = [...prev, action];
        // Limit stack size
        if (newStack.length > mergedConfig.maxSteps) {
          return newStack.slice(-mergedConfig.maxSteps);
        }
        return newStack;
      });

      // Clear redo stack when a new action is performed
      setRedoStack([]);
    },
    [mergedConfig.trackingTypes, mergedConfig.maxSteps],
  );

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  /**
   * Update refs with latest undo/redo functions
   * This prevents recreating event listeners on every undo/redo change
   */
  useEffect(() => {
    undoRef.current = undo;
    redoRef.current = redo;
  }, [undo, redo]);

  /**
   * Handle keyboard shortcuts
   * Uses refs to avoid recreating listeners when undo/redo functions change
   */
  useEffect(() => {
    if (!mergedConfig.enableKeyboardShortcuts) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Z or Cmd+Z for undo
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "z" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        undoRef.current();
      }

      // Ctrl+Y or Cmd+Shift+Z for redo
      if (
        ((event.ctrlKey || event.metaKey) && event.key === "y") ||
        ((event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          event.key === "z")
      ) {
        event.preventDefault();
        redoRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mergedConfig.enableKeyboardShortcuts]);

  // Prepare state
  const state: UndoRedoState<TData> = {
    undoStack,
    redoStack,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };

  // Prepare actions
  const actions: UndoRedoActions<TData> = {
    undo,
    redo,
    pushAction,
    clearHistory,
  };

  // Prepare AG Grid props (no specific AG Grid integration needed)
  const gridProps: Record<string, unknown> = {};

  // Prepare toolbar props
  const toolbarProps: Record<string, unknown> = {
    showUndoButton: true,
    showRedoButton: true,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    onUndo: undo,
    onRedo: redo,
  };

  return {
    config: mergedConfig,
    state,
    actions,
    gridProps,
    toolbarProps,
  };
}
