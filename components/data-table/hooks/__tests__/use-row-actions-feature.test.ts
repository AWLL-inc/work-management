import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useRowActionsFeature } from "../use-row-actions-feature";

interface TestData {
  id: string;
  name: string;
  value: number;
}

describe("useRowActionsFeature", () => {
  const mockRow1: TestData = { id: "1", name: "Row 1", value: 100 };
  const _mockRow2: TestData = { id: "2", name: "Row 2", value: 200 };

  it("should initialize with default config", () => {
    const { result } = renderHook(() => useRowActionsFeature<TestData>());

    expect(result.current.config.enableAdd).toBe(true);
    expect(result.current.config.enableDelete).toBe(true);
    expect(result.current.config.enableDuplicate).toBe(true);
    expect(result.current.config.confirmDelete).toBe(true);
    expect(result.current.state.canAdd).toBe(true);
    expect(result.current.state.canDelete).toBe(true);
    expect(result.current.state.canDuplicate).toBe(true);
  });

  it("should initialize with custom config", () => {
    const onAdd = vi.fn();
    const onDelete = vi.fn();
    const onDuplicate = vi.fn();
    const { result } = renderHook(() =>
      useRowActionsFeature<TestData>({
        enableAdd: false,
        enableDelete: true,
        enableDuplicate: false,
        confirmDelete: false,
        onAdd,
        onDelete,
        onDuplicate,
      }),
    );

    expect(result.current.config.enableAdd).toBe(false);
    expect(result.current.config.enableDelete).toBe(true);
    expect(result.current.config.enableDuplicate).toBe(false);
    expect(result.current.config.confirmDelete).toBe(false);
    expect(result.current.config.onAdd).toBe(onAdd);
    expect(result.current.config.onDelete).toBe(onDelete);
    expect(result.current.config.onDuplicate).toBe(onDuplicate);
  });

  it("should call onAdd when adding a row", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useRowActionsFeature<TestData>({ onAdd }),
    );

    await act(async () => {
      await result.current.actions.addRow(mockRow1);
    });

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(mockRow1);
  });

  it("should not call onAdd when callback is not provided", async () => {
    const { result } = renderHook(() => useRowActionsFeature<TestData>());

    // Should not throw error
    await act(async () => {
      await result.current.actions.addRow(mockRow1);
    });

    // No assertion needed - just ensuring no error is thrown
  });

  it("should delete row immediately when confirmDelete is false", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useRowActionsFeature<TestData>({
        confirmDelete: false,
        onDelete,
      }),
    );

    await act(async () => {
      await result.current.actions.deleteRow("1");
    });

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("1");
  });

  it("should set pending delete state when confirmDelete is true", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useRowActionsFeature<TestData>({
        confirmDelete: true,
        onDelete,
      }),
    );

    await act(async () => {
      await result.current.actions.deleteRow("1");
    });

    // Should NOT call onDelete immediately
    expect(onDelete).not.toHaveBeenCalled();

    // Should set pending delete state
    expect(result.current.toolbarProps?.pendingDeleteId).toBe("1");
  });

  it("should confirm and execute pending delete", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useRowActionsFeature<TestData>({
        confirmDelete: true,
        onDelete,
      }),
    );

    // Set pending delete
    await act(async () => {
      await result.current.actions.deleteRow("1");
    });

    expect(result.current.toolbarProps?.pendingDeleteId).toBe("1");

    // Confirm delete
    await act(async () => {
      await (
        result.current.toolbarProps?.onConfirmDelete as () => Promise<void>
      )();
    });

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("1");
    expect(result.current.toolbarProps?.pendingDeleteId).toBeNull();
  });

  it("should cancel pending delete", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useRowActionsFeature<TestData>({
        confirmDelete: true,
        onDelete,
      }),
    );

    // Set pending delete
    await act(async () => {
      await result.current.actions.deleteRow("1");
    });

    expect(result.current.toolbarProps?.pendingDeleteId).toBe("1");

    // Cancel delete
    act(() => {
      (result.current.toolbarProps?.onCancelDelete as () => void)();
    });

    expect(onDelete).not.toHaveBeenCalled();
    expect(result.current.toolbarProps?.pendingDeleteId).toBeNull();
  });

  it("should call onDuplicate when duplicating a row", async () => {
    const onDuplicate = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useRowActionsFeature<TestData>({ onDuplicate }),
    );

    await act(async () => {
      await result.current.actions.duplicateRow(mockRow1);
    });

    expect(onDuplicate).toHaveBeenCalledTimes(1);
    expect(onDuplicate).toHaveBeenCalledWith(mockRow1);
  });

  it("should fall back to onAdd when onDuplicate is not provided", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useRowActionsFeature<TestData>({ onAdd }),
    );

    await act(async () => {
      await result.current.actions.duplicateRow(mockRow1);
    });

    expect(onAdd).toHaveBeenCalledTimes(1);
    const duplicatedRow = onAdd.mock.calls[0][0] as TestData;
    expect(duplicatedRow.name).toBe("Row 1");
    expect(duplicatedRow.value).toBe(100);
    expect(duplicatedRow.id).toContain("1-copy-");
  });

  it("should delete multiple rows with batch callback", async () => {
    const onDeleteBatch = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useRowActionsFeature<TestData>({
        confirmDelete: false,
        onDeleteBatch,
      }),
    );

    await act(async () => {
      await result.current.actions.deleteRows(["1", "2", "3"]);
    });

    expect(onDeleteBatch).toHaveBeenCalledTimes(1);
    expect(onDeleteBatch).toHaveBeenCalledWith(["1", "2", "3"]);
  });

  it("should fall back to individual deletes when batch callback is not provided", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useRowActionsFeature<TestData>({
        confirmDelete: false,
        onDelete,
      }),
    );

    await act(async () => {
      await result.current.actions.deleteRows(["1", "2"]);
    });

    expect(onDelete).toHaveBeenCalledTimes(2);
    expect(onDelete).toHaveBeenCalledWith("1");
    expect(onDelete).toHaveBeenCalledWith("2");
  });

  it("should handle batch delete with confirmation", async () => {
    const onDeleteBatch = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useRowActionsFeature<TestData>({
        confirmDelete: true,
        onDeleteBatch,
      }),
    );

    await act(async () => {
      await result.current.actions.deleteRows(["1", "2"]);
    });

    // Should call batch delete even with confirmDelete=true
    // The parent is responsible for showing confirmation UI
    expect(onDeleteBatch).toHaveBeenCalledTimes(1);
    expect(onDeleteBatch).toHaveBeenCalledWith(["1", "2"]);
  });

  it("should provide correct state based on config", () => {
    const { result } = renderHook(() =>
      useRowActionsFeature<TestData>({
        enableAdd: false,
        enableDelete: true,
        enableDuplicate: false,
      }),
    );

    expect(result.current.state.canAdd).toBe(false);
    expect(result.current.state.canDelete).toBe(true);
    expect(result.current.state.canDuplicate).toBe(false);
  });

  it("should provide correct toolbarProps", () => {
    const onAdd = vi.fn();
    const onDelete = vi.fn();
    const { result } = renderHook(() =>
      useRowActionsFeature<TestData>({
        enableAdd: true,
        enableDelete: true,
        onAdd,
        onDelete,
      }),
    );

    expect(result.current.toolbarProps).toBeDefined();
    expect(result.current.toolbarProps?.showAddButton).toBe(true);
    expect(result.current.toolbarProps?.showDeleteButton).toBe(true);
    // onAdd in toolbarProps is wrapped in addRow, so we check it's a function
    expect(typeof result.current.toolbarProps?.onAdd).toBe("function");
    expect(typeof result.current.toolbarProps?.onDelete).toBe("function");
    expect(result.current.toolbarProps?.pendingDeleteId).toBeNull();
  });

  it("should update toolbarProps when pending delete changes", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useRowActionsFeature<TestData>({
        confirmDelete: true,
        onDelete,
      }),
    );

    expect(result.current.toolbarProps?.pendingDeleteId).toBeNull();

    // Set pending delete
    await act(async () => {
      await result.current.actions.deleteRow("1");
    });

    expect(result.current.toolbarProps?.pendingDeleteId).toBe("1");

    // Cancel delete
    act(() => {
      (result.current.toolbarProps?.onCancelDelete as () => void)();
    });

    expect(result.current.toolbarProps?.pendingDeleteId).toBeNull();
  });

  it("should handle async add operation", async () => {
    const onAdd = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
    const { result } = renderHook(() =>
      useRowActionsFeature<TestData>({ onAdd }),
    );

    await act(async () => {
      await result.current.actions.addRow(mockRow1);
    });

    expect(onAdd).toHaveBeenCalledWith(mockRow1);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("should handle async delete operation", async () => {
    const onDelete = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
    const { result } = renderHook(() =>
      useRowActionsFeature<TestData>({
        confirmDelete: false,
        onDelete,
      }),
    );

    await act(async () => {
      await result.current.actions.deleteRow("1");
    });

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("1");
  });

  it("should handle async duplicate operation", async () => {
    const onDuplicate = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
    const { result } = renderHook(() =>
      useRowActionsFeature<TestData>({ onDuplicate }),
    );

    await act(async () => {
      await result.current.actions.duplicateRow(mockRow1);
    });

    expect(onDuplicate).toHaveBeenCalledTimes(1);
    expect(onDuplicate).toHaveBeenCalledWith(mockRow1);
  });
});
