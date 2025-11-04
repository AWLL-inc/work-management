import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { HistoryAction } from "../types";
import { useUndoRedoFeature } from "../use-undo-redo-feature";

interface TestData {
	id: string;
	name: string;
	value: number;
}

describe("useUndoRedoFeature", () => {
	const mockRow1: TestData = { id: "1", name: "Row 1", value: 100 };
	const mockRow2: TestData = { id: "2", name: "Row 2", value: 200 };

	const createAction = (
		type: "UPDATE" | "ADD" | "DELETE",
		data: TestData,
	): HistoryAction<TestData> => ({
		type,
		timestamp: Date.now(),
		data,
	});

	it("should initialize with default config", () => {
		const { result } = renderHook(() => useUndoRedoFeature<TestData>());

		expect(result.current.config.maxSteps).toBe(20);
		expect(result.current.config.trackingTypes).toEqual([
			"UPDATE",
			"ADD",
			"DELETE",
		]);
		expect(result.current.config.enableKeyboardShortcuts).toBe(true);
		expect(result.current.state.undoStack).toEqual([]);
		expect(result.current.state.redoStack).toEqual([]);
		expect(result.current.state.canUndo).toBe(false);
		expect(result.current.state.canRedo).toBe(false);
	});

	it("should initialize with custom config", () => {
		const onUndo = vi.fn();
		const onRedo = vi.fn();
		const { result } = renderHook(() =>
			useUndoRedoFeature<TestData>({
				maxSteps: 50,
				trackingTypes: ["UPDATE"],
				enableKeyboardShortcuts: false,
				onUndo,
				onRedo,
			}),
		);

		expect(result.current.config.maxSteps).toBe(50);
		expect(result.current.config.trackingTypes).toEqual(["UPDATE"]);
		expect(result.current.config.enableKeyboardShortcuts).toBe(false);
		expect(result.current.config.onUndo).toBe(onUndo);
		expect(result.current.config.onRedo).toBe(onRedo);
	});

	it("should push action to undo stack", () => {
		const { result } = renderHook(() => useUndoRedoFeature<TestData>());

		const action = createAction("UPDATE", mockRow1);

		act(() => {
			result.current.actions.pushAction(action);
		});

		expect(result.current.state.undoStack).toHaveLength(1);
		expect(result.current.state.undoStack[0]).toEqual(action);
		expect(result.current.state.canUndo).toBe(true);
	});

	it("should push multiple actions to undo stack", () => {
		const { result } = renderHook(() => useUndoRedoFeature<TestData>());

		const action1 = createAction("ADD", mockRow1);
		const action2 = createAction("UPDATE", mockRow2);

		act(() => {
			result.current.actions.pushAction(action1);
			result.current.actions.pushAction(action2);
		});

		expect(result.current.state.undoStack).toHaveLength(2);
		expect(result.current.state.undoStack[0]).toEqual(action1);
		expect(result.current.state.undoStack[1]).toEqual(action2);
	});

	it("should limit undo stack to maxSteps", () => {
		const { result } = renderHook(() =>
			useUndoRedoFeature<TestData>({
				maxSteps: 3,
			}),
		);

		act(() => {
			for (let i = 0; i < 5; i++) {
				result.current.actions.pushAction(
					createAction("UPDATE", { id: `${i}`, name: `Row ${i}`, value: i }),
				);
			}
		});

		expect(result.current.state.undoStack).toHaveLength(3);
		// Should keep the last 3 actions
		expect(result.current.state.undoStack[0]?.data.id).toBe("2");
		expect(result.current.state.undoStack[1]?.data.id).toBe("3");
		expect(result.current.state.undoStack[2]?.data.id).toBe("4");
	});

	it("should only track specified action types", () => {
		const { result } = renderHook(() =>
			useUndoRedoFeature<TestData>({
				trackingTypes: ["UPDATE"],
			}),
		);

		const updateAction = createAction("UPDATE", mockRow1);
		const addAction = createAction("ADD", mockRow2);

		act(() => {
			result.current.actions.pushAction(updateAction);
			result.current.actions.pushAction(addAction);
		});

		// Only UPDATE should be tracked
		expect(result.current.state.undoStack).toHaveLength(1);
		expect(result.current.state.undoStack[0]).toEqual(updateAction);
	});

	it("should undo last action", () => {
		const onUndo = vi.fn();
		const { result } = renderHook(() =>
			useUndoRedoFeature<TestData>({ onUndo }),
		);

		const action = createAction("UPDATE", mockRow1);

		act(() => {
			result.current.actions.pushAction(action);
		});

		act(() => {
			result.current.actions.undo();
		});

		expect(result.current.state.undoStack).toHaveLength(0);
		expect(result.current.state.redoStack).toHaveLength(1);
		expect(result.current.state.canUndo).toBe(false);
		expect(result.current.state.canRedo).toBe(true);
		expect(onUndo).toHaveBeenCalledTimes(1);
		// Verify the action was moved to redo stack
		const redoAction = result.current.state.redoStack[0];
		expect(redoAction?.type).toBe(action.type);
		expect(redoAction?.data).toEqual(action.data);
	});

	it("should not undo when undo stack is empty", () => {
		const onUndo = vi.fn();
		const { result } = renderHook(() =>
			useUndoRedoFeature<TestData>({ onUndo }),
		);

		act(() => {
			result.current.actions.undo();
		});

		expect(result.current.state.undoStack).toHaveLength(0);
		expect(result.current.state.redoStack).toHaveLength(0);
		expect(onUndo).not.toHaveBeenCalled();
	});

	it("should redo last undone action", () => {
		const onRedo = vi.fn();
		const { result } = renderHook(() =>
			useUndoRedoFeature<TestData>({ onRedo }),
		);

		const action = createAction("UPDATE", mockRow1);

		act(() => {
			result.current.actions.pushAction(action);
		});

		act(() => {
			result.current.actions.undo();
		});

		act(() => {
			result.current.actions.redo();
		});

		expect(result.current.state.undoStack).toHaveLength(1);
		expect(result.current.state.redoStack).toHaveLength(0);
		expect(result.current.state.canUndo).toBe(true);
		expect(result.current.state.canRedo).toBe(false);
		expect(onRedo).toHaveBeenCalledTimes(1);
		// Verify the action was moved back to undo stack
		const undoAction = result.current.state.undoStack[0];
		expect(undoAction?.type).toBe(action.type);
		expect(undoAction?.data).toEqual(action.data);
	});

	it("should not redo when redo stack is empty", () => {
		const onRedo = vi.fn();
		const { result } = renderHook(() =>
			useUndoRedoFeature<TestData>({ onRedo }),
		);

		act(() => {
			result.current.actions.redo();
		});

		expect(result.current.state.undoStack).toHaveLength(0);
		expect(result.current.state.redoStack).toHaveLength(0);
		expect(onRedo).not.toHaveBeenCalled();
	});

	it("should clear redo stack when new action is pushed", () => {
		const { result } = renderHook(() => useUndoRedoFeature<TestData>());

		const action1 = createAction("UPDATE", mockRow1);
		const action2 = createAction("UPDATE", mockRow2);

		act(() => {
			result.current.actions.pushAction(action1);
		});

		act(() => {
			result.current.actions.undo();
		});

		expect(result.current.state.redoStack).toHaveLength(1);

		act(() => {
			result.current.actions.pushAction(action2);
		});

		expect(result.current.state.redoStack).toHaveLength(0);
		expect(result.current.state.undoStack).toHaveLength(1);
		const undoAction = result.current.state.undoStack[0];
		expect(undoAction?.type).toBe(action2.type);
		expect(undoAction?.data).toEqual(action2.data);
	});

	it("should handle multiple undo/redo operations", () => {
		const { result } = renderHook(() => useUndoRedoFeature<TestData>());

		const action1 = createAction("ADD", mockRow1);
		const action2 = createAction("UPDATE", mockRow2);

		act(() => {
			result.current.actions.pushAction(action1);
			result.current.actions.pushAction(action2);
		});

		expect(result.current.state.undoStack).toHaveLength(2);

		// Undo twice
		act(() => {
			result.current.actions.undo();
			result.current.actions.undo();
		});

		expect(result.current.state.undoStack).toHaveLength(0);
		expect(result.current.state.redoStack).toHaveLength(2);

		// Redo once
		act(() => {
			result.current.actions.redo();
		});

		expect(result.current.state.undoStack).toHaveLength(1);
		expect(result.current.state.redoStack).toHaveLength(1);
	});

	it("should clear all history", () => {
		const { result } = renderHook(() => useUndoRedoFeature<TestData>());

		act(() => {
			result.current.actions.pushAction(createAction("UPDATE", mockRow1));
			result.current.actions.pushAction(createAction("UPDATE", mockRow2));
		});

		act(() => {
			result.current.actions.undo();
		});

		expect(result.current.state.undoStack).toHaveLength(1);
		expect(result.current.state.redoStack).toHaveLength(1);

		act(() => {
			result.current.actions.clearHistory();
		});

		expect(result.current.state.undoStack).toHaveLength(0);
		expect(result.current.state.redoStack).toHaveLength(0);
		expect(result.current.state.canUndo).toBe(false);
		expect(result.current.state.canRedo).toBe(false);
	});

	it("should provide correct toolbarProps", () => {
		const { result } = renderHook(() => useUndoRedoFeature<TestData>());

		expect(result.current.toolbarProps).toBeDefined();
		expect(result.current.toolbarProps?.showUndoButton).toBe(true);
		expect(result.current.toolbarProps?.showRedoButton).toBe(true);
		expect(result.current.toolbarProps?.canUndo).toBe(false);
		expect(result.current.toolbarProps?.canRedo).toBe(false);

		act(() => {
			result.current.actions.pushAction(createAction("UPDATE", mockRow1));
		});

		expect(result.current.toolbarProps?.canUndo).toBe(true);
		expect(result.current.toolbarProps?.canRedo).toBe(false);

		act(() => {
			result.current.actions.undo();
		});

		expect(result.current.toolbarProps?.canUndo).toBe(false);
		expect(result.current.toolbarProps?.canRedo).toBe(true);
	});

	it("should handle keyboard shortcuts when enabled", () => {
		const onUndo = vi.fn();
		const onRedo = vi.fn();
		const { result } = renderHook(() =>
			useUndoRedoFeature<TestData>({
				enableKeyboardShortcuts: true,
				onUndo,
				onRedo,
			}),
		);

		const action = createAction("UPDATE", mockRow1);

		act(() => {
			result.current.actions.pushAction(action);
		});

		// Simulate Ctrl+Z (undo)
		act(() => {
			const event = new KeyboardEvent("keydown", {
				key: "z",
				ctrlKey: true,
				bubbles: true,
			});
			window.dispatchEvent(event);
		});

		expect(onUndo).toHaveBeenCalledWith(action);

		// Simulate Ctrl+Y (redo)
		act(() => {
			const event = new KeyboardEvent("keydown", {
				key: "y",
				ctrlKey: true,
				bubbles: true,
			});
			window.dispatchEvent(event);
		});

		expect(onRedo).toHaveBeenCalledWith(action);
	});

	it("should not handle keyboard shortcuts when disabled", () => {
		const onUndo = vi.fn();
		const { result } = renderHook(() =>
			useUndoRedoFeature<TestData>({
				enableKeyboardShortcuts: false,
				onUndo,
			}),
		);

		act(() => {
			result.current.actions.pushAction(createAction("UPDATE", mockRow1));
		});

		// Simulate Ctrl+Z (should not trigger undo)
		act(() => {
			const event = new KeyboardEvent("keydown", {
				key: "z",
				ctrlKey: true,
				bubbles: true,
			});
			window.dispatchEvent(event);
		});

		// Callback should not be called because shortcuts are disabled
		expect(onUndo).not.toHaveBeenCalled();
		// But the action should still be in the undo stack
		expect(result.current.state.undoStack).toHaveLength(1);
	});
});
