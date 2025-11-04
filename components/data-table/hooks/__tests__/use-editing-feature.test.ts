import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEditingFeature } from "../use-editing-feature";

interface TestData {
	id: string;
	name: string;
	value: number;
}

describe("useEditingFeature", () => {
	const mockRow1: TestData = { id: "1", name: "Row 1", value: 100 };
	const mockRow2: TestData = { id: "2", name: "Row 2", value: 200 };

	it("should initialize with default config", () => {
		const { result } = renderHook(() => useEditingFeature<TestData>());

		expect(result.current.config.mode).toBe("batch");
		expect(result.current.config.enableAutoSave).toBe(false);
		expect(result.current.config.validateOnChange).toBe(true);
		expect(result.current.state.editingRows.size).toBe(0);
		expect(result.current.state.dirtyRows.size).toBe(0);
		expect(result.current.state.isEditing).toBe(false);
		expect(result.current.state.hasChanges).toBe(false);
	});

	it("should initialize with custom config", () => {
		const onSave = vi.fn();
		const { result } = renderHook(() =>
			useEditingFeature<TestData>({
				mode: "inline",
				enableAutoSave: true,
				validateOnChange: false,
				onSave,
			}),
		);

		expect(result.current.config.mode).toBe("inline");
		expect(result.current.config.enableAutoSave).toBe(true);
		expect(result.current.config.validateOnChange).toBe(false);
		expect(result.current.config.onSave).toBe(onSave);
	});

	it("should start editing a row", () => {
		const { result } = renderHook(() => useEditingFeature<TestData>());

		act(() => {
			result.current.actions.startEdit("1", mockRow1);
		});

		expect(result.current.state.editingRows.size).toBe(1);
		expect(result.current.state.editingRows.get("1")).toEqual(mockRow1);
		expect(result.current.state.isEditing).toBe(true);
	});

	it("should stop editing a row", () => {
		const { result } = renderHook(() => useEditingFeature<TestData>());

		act(() => {
			result.current.actions.startEdit("1", mockRow1);
		});

		act(() => {
			result.current.actions.stopEdit("1");
		});

		expect(result.current.state.editingRows.size).toBe(0);
		expect(result.current.state.isEditing).toBe(false);
	});

	it("should update cell value and mark row as dirty", () => {
		const { result } = renderHook(() => useEditingFeature<TestData>());

		act(() => {
			result.current.actions.startEdit("1", mockRow1);
		});

		act(() => {
			result.current.actions.updateCell("1", "name", "Updated Row 1");
		});

		const editedRow = result.current.state.editingRows.get("1");
		expect(editedRow).toBeDefined();
		expect(editedRow?.name).toBe("Updated Row 1");
		expect(result.current.state.dirtyRows.has("1")).toBe(true);
		expect(result.current.state.hasChanges).toBe(true);
	});

	it("should update multiple fields on a row", () => {
		const { result } = renderHook(() => useEditingFeature<TestData>());

		act(() => {
			result.current.actions.startEdit("1", mockRow1);
		});

		act(() => {
			result.current.actions.updateCell("1", "name", "Updated Row 1");
			result.current.actions.updateCell("1", "value", 999);
		});

		const editedRow = result.current.state.editingRows.get("1");
		expect(editedRow?.name).toBe("Updated Row 1");
		expect(editedRow?.value).toBe(999);
	});

	it("should handle editing multiple rows", () => {
		const { result } = renderHook(() => useEditingFeature<TestData>());

		act(() => {
			result.current.actions.startEdit("1", mockRow1);
			result.current.actions.startEdit("2", mockRow2);
		});

		expect(result.current.state.editingRows.size).toBe(2);

		act(() => {
			result.current.actions.updateCell("1", "name", "Updated Row 1");
			result.current.actions.updateCell("2", "name", "Updated Row 2");
		});

		expect(result.current.state.dirtyRows.size).toBe(2);
		expect(result.current.state.hasChanges).toBe(true);
	});

	it("should save changes and call onSave callback", async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const { result } = renderHook(() =>
			useEditingFeature<TestData>({ onSave }),
		);

		act(() => {
			result.current.actions.startEdit("1", mockRow1);
			result.current.actions.updateCell("1", "name", "Updated Row 1");
		});

		await act(async () => {
			await result.current.actions.saveChanges();
		});

		expect(onSave).toHaveBeenCalledTimes(1);
		const savedMap = onSave.mock.calls[0][0] as Map<string, TestData>;
		expect(savedMap.get("1")?.name).toBe("Updated Row 1");
		expect(result.current.state.hasChanges).toBe(false);
		expect(result.current.state.dirtyRows.size).toBe(0);
	});

	it("should not save when there are no changes", async () => {
		const onSave = vi.fn();
		const { result } = renderHook(() =>
			useEditingFeature<TestData>({ onSave }),
		);

		await act(async () => {
			await result.current.actions.saveChanges();
		});

		expect(onSave).not.toHaveBeenCalled();
	});

	it("should clear editing rows in batch mode after save", async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const { result } = renderHook(() =>
			useEditingFeature<TestData>({ mode: "batch", onSave }),
		);

		act(() => {
			result.current.actions.startEdit("1", mockRow1);
			result.current.actions.updateCell("1", "name", "Updated Row 1");
		});

		await act(async () => {
			await result.current.actions.saveChanges();
		});

		expect(result.current.state.editingRows.size).toBe(0);
		expect(result.current.state.isEditing).toBe(false);
	});

	it("should not clear editing rows in inline mode after save", async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const { result } = renderHook(() =>
			useEditingFeature<TestData>({ mode: "inline", onSave }),
		);

		act(() => {
			result.current.actions.startEdit("1", mockRow1);
			result.current.actions.updateCell("1", "name", "Updated Row 1");
		});

		await act(async () => {
			await result.current.actions.saveChanges();
		});

		expect(result.current.state.editingRows.size).toBe(1);
		expect(result.current.state.isEditing).toBe(true);
		expect(result.current.state.dirtyRows.size).toBe(0);
	});

	it("should discard changes", () => {
		const { result } = renderHook(() => useEditingFeature<TestData>());

		act(() => {
			result.current.actions.startEdit("1", mockRow1);
			result.current.actions.updateCell("1", "name", "Updated Row 1");
		});

		expect(result.current.state.hasChanges).toBe(true);

		act(() => {
			result.current.actions.discardChanges();
		});

		expect(result.current.state.editingRows.size).toBe(0);
		expect(result.current.state.dirtyRows.size).toBe(0);
		expect(result.current.state.hasChanges).toBe(false);
		expect(result.current.state.isEditing).toBe(false);
	});

	it("should reset editing state", () => {
		const { result } = renderHook(() => useEditingFeature<TestData>());

		act(() => {
			result.current.actions.startEdit("1", mockRow1);
			result.current.actions.startEdit("2", mockRow2);
			result.current.actions.updateCell("1", "name", "Updated Row 1");
		});

		act(() => {
			result.current.actions.reset();
		});

		expect(result.current.state.editingRows.size).toBe(0);
		expect(result.current.state.dirtyRows.size).toBe(0);
		expect(result.current.state.isEditing).toBe(false);
		expect(result.current.state.hasChanges).toBe(false);
	});

	it("should provide correct gridProps for inline mode", () => {
		const { result } = renderHook(() =>
			useEditingFeature<TestData>({ mode: "inline" }),
		);

		expect(result.current.gridProps).toBeDefined();
		expect(result.current.gridProps?.editType).toBe("fullRow");
		expect(result.current.gridProps?.singleClickEdit).toBe(true);
		expect(result.current.gridProps?.stopEditingWhenCellsLoseFocus).toBe(true);
	});

	it("should provide correct gridProps for batch mode", () => {
		const { result } = renderHook(() =>
			useEditingFeature<TestData>({ mode: "batch" }),
		);

		expect(result.current.gridProps?.editType).toBeUndefined();
		expect(result.current.gridProps?.singleClickEdit).toBe(false);
	});

	it("should provide correct toolbarProps", () => {
		const { result } = renderHook(() =>
			useEditingFeature<TestData>({ mode: "batch" }),
		);

		expect(result.current.toolbarProps).toBeDefined();
		expect(result.current.toolbarProps?.showSaveButton).toBe(false);
		expect(result.current.toolbarProps?.showDiscardButton).toBe(false);

		act(() => {
			result.current.actions.startEdit("1", mockRow1);
			result.current.actions.updateCell("1", "name", "Updated");
		});

		expect(result.current.toolbarProps?.showSaveButton).toBe(true);
		expect(result.current.toolbarProps?.showDiscardButton).toBe(true);
		expect(result.current.toolbarProps?.hasChanges).toBe(true);
	});
});
