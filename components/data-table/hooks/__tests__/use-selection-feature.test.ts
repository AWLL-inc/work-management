import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSelectionFeature } from "../use-selection-feature";

interface TestData {
  id: string;
  name: string;
}

describe("useSelectionFeature", () => {
  const mockRow1: TestData = { id: "1", name: "Row 1" };
  const mockRow2: TestData = { id: "2", name: "Row 2" };
  const mockRow3: TestData = { id: "3", name: "Row 3" };

  it("should initialize with default config", () => {
    const { result } = renderHook(() => useSelectionFeature<TestData>());

    expect(result.current.config.mode).toBe("multiple");
    expect(result.current.config.enableSelectAll).toBe(true);
    expect(result.current.config.selectOnRowClick).toBe(false);
    expect(result.current.state.selectedRows).toEqual([]);
    expect(result.current.state.selectedRowIds.size).toBe(0);
    expect(result.current.state.isAllSelected).toBe(false);
  });

  it("should initialize with custom config", () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useSelectionFeature<TestData>({
        mode: "single",
        enableSelectAll: false,
        selectOnRowClick: true,
        onSelectionChange,
      }),
    );

    expect(result.current.config.mode).toBe("single");
    expect(result.current.config.enableSelectAll).toBe(false);
    expect(result.current.config.selectOnRowClick).toBe(true);
    expect(result.current.config.onSelectionChange).toBe(onSelectionChange);
  });

  it("should select a row in multiple mode", () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useSelectionFeature<TestData>({
        mode: "multiple",
        onSelectionChange,
      }),
    );

    act(() => {
      result.current.actions.selectRow(mockRow1);
    });

    expect(result.current.state.selectedRows).toEqual([mockRow1]);
    expect(result.current.state.selectedRowIds.has("1")).toBe(true);
    expect(onSelectionChange).toHaveBeenCalledWith([mockRow1]);
  });

  it("should replace selection in single mode", () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useSelectionFeature<TestData>({
        mode: "single",
        onSelectionChange,
      }),
    );

    act(() => {
      result.current.actions.selectRow(mockRow1);
    });

    expect(result.current.state.selectedRows).toEqual([mockRow1]);
    expect(onSelectionChange).toHaveBeenCalledWith([mockRow1]);

    // Selecting another row should replace the previous selection
    act(() => {
      result.current.actions.selectRow(mockRow2);
    });

    expect(result.current.state.selectedRows).toEqual([mockRow2]);
    expect(result.current.state.selectedRowIds.has("1")).toBe(false);
    expect(result.current.state.selectedRowIds.has("2")).toBe(true);
    expect(onSelectionChange).toHaveBeenCalledWith([mockRow2]);
  });

  it("should add multiple rows in multiple mode", () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useSelectionFeature<TestData>({
        mode: "multiple",
        onSelectionChange,
      }),
    );

    act(() => {
      result.current.actions.selectRow(mockRow1);
      result.current.actions.selectRow(mockRow2);
    });

    expect(result.current.state.selectedRows).toEqual([mockRow1, mockRow2]);
    expect(result.current.state.selectedRowIds.has("1")).toBe(true);
    expect(result.current.state.selectedRowIds.has("2")).toBe(true);
  });

  it("should not duplicate selections", () => {
    const { result } = renderHook(() =>
      useSelectionFeature<TestData>({ mode: "multiple" }),
    );

    act(() => {
      result.current.actions.selectRow(mockRow1);
      result.current.actions.selectRow(mockRow1); // Try to select again
    });

    expect(result.current.state.selectedRows).toEqual([mockRow1]);
    expect(result.current.state.selectedRows.length).toBe(1);
  });

  it("should deselect a row", () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useSelectionFeature<TestData>({
        mode: "multiple",
        onSelectionChange,
      }),
    );

    act(() => {
      result.current.actions.selectRow(mockRow1);
      result.current.actions.selectRow(mockRow2);
    });

    act(() => {
      result.current.actions.deselectRow(mockRow1);
    });

    expect(result.current.state.selectedRows).toEqual([mockRow2]);
    expect(result.current.state.selectedRowIds.has("1")).toBe(false);
    expect(result.current.state.selectedRowIds.has("2")).toBe(true);
    expect(onSelectionChange).toHaveBeenLastCalledWith([mockRow2]);
  });

  it("should toggle row selection", () => {
    const { result } = renderHook(() =>
      useSelectionFeature<TestData>({ mode: "multiple" }),
    );

    // First toggle: select
    act(() => {
      result.current.actions.toggleRowSelection(mockRow1);
    });

    expect(result.current.state.selectedRows).toEqual([mockRow1]);

    // Second toggle: deselect
    act(() => {
      result.current.actions.toggleRowSelection(mockRow1);
    });

    expect(result.current.state.selectedRows).toEqual([]);
  });

  it("should select all rows in multiple mode", () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useSelectionFeature<TestData>({
        mode: "multiple",
        onSelectionChange,
      }),
    );

    const allRows = [mockRow1, mockRow2, mockRow3];

    act(() => {
      result.current.actions.selectAll(allRows);
    });

    expect(result.current.state.selectedRows).toEqual(allRows);
    expect(result.current.state.selectedRowIds.size).toBe(3);
    expect(onSelectionChange).toHaveBeenCalledWith(allRows);
  });

  it("should not select all in single mode", () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useSelectionFeature<TestData>({
        mode: "single",
        onSelectionChange,
      }),
    );

    const allRows = [mockRow1, mockRow2, mockRow3];

    act(() => {
      result.current.actions.selectAll(allRows);
    });

    expect(result.current.state.selectedRows).toEqual([]);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it("should deselect all rows", () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useSelectionFeature<TestData>({
        mode: "multiple",
        onSelectionChange,
      }),
    );

    act(() => {
      result.current.actions.selectRow(mockRow1);
      result.current.actions.selectRow(mockRow2);
    });

    act(() => {
      result.current.actions.deselectAll();
    });

    expect(result.current.state.selectedRows).toEqual([]);
    expect(result.current.state.selectedRowIds.size).toBe(0);
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
  });

  it("should set selected rows directly in multiple mode", () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useSelectionFeature<TestData>({
        mode: "multiple",
        onSelectionChange,
      }),
    );

    const newSelection = [mockRow1, mockRow2];

    act(() => {
      result.current.actions.setSelectedRows(newSelection);
    });

    expect(result.current.state.selectedRows).toEqual(newSelection);
    expect(onSelectionChange).toHaveBeenCalledWith(newSelection);
  });

  it("should limit to first row when setting multiple rows in single mode", () => {
    const onSelectionChange = vi.fn();
    const { result } = renderHook(() =>
      useSelectionFeature<TestData>({
        mode: "single",
        onSelectionChange,
      }),
    );

    const newSelection = [mockRow1, mockRow2, mockRow3];

    act(() => {
      result.current.actions.setSelectedRows(newSelection);
    });

    expect(result.current.state.selectedRows).toEqual([mockRow1]);
    expect(result.current.state.selectedRowIds.size).toBe(1);
    expect(onSelectionChange).toHaveBeenCalledWith([mockRow1]);
  });

  it("should provide correct gridProps for multiple mode", () => {
    const { result } = renderHook(() =>
      useSelectionFeature<TestData>({ mode: "multiple" }),
    );

    expect(result.current.gridProps).toBeDefined();
    expect(result.current.gridProps?.rowSelection).toBe("multiple");
    expect(result.current.gridProps?.suppressRowClickSelection).toBe(true);
    expect(result.current.gridProps?.suppressRowDeselection).toBe(false);
  });

  it("should provide correct gridProps for single mode with row click", () => {
    const { result } = renderHook(() =>
      useSelectionFeature<TestData>({
        mode: "single",
        selectOnRowClick: true,
      }),
    );

    expect(result.current.gridProps?.rowSelection).toBe("single");
    expect(result.current.gridProps?.suppressRowClickSelection).toBe(false);
  });

  it("should provide correct toolbarProps", () => {
    const { result } = renderHook(() =>
      useSelectionFeature<TestData>({
        mode: "multiple",
        enableSelectAll: true,
      }),
    );

    expect(result.current.toolbarProps).toBeDefined();
    expect(result.current.toolbarProps?.showSelectAll).toBe(true);
    expect(result.current.toolbarProps?.selectedCount).toBe(0);

    act(() => {
      result.current.actions.selectRow(mockRow1);
    });

    expect(result.current.toolbarProps?.selectedCount).toBe(1);
  });

  it("should not show select all in single mode", () => {
    const { result } = renderHook(() =>
      useSelectionFeature<TestData>({
        mode: "single",
        enableSelectAll: true,
      }),
    );

    expect(result.current.toolbarProps?.showSelectAll).toBe(false);
  });
});
