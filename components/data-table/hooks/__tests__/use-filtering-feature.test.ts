import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFilteringFeature } from "../use-filtering-feature";

describe("useFilteringFeature", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize with default config", () => {
    const { result } = renderHook(() => useFilteringFeature());

    expect(result.current.config.mode).toBe("both");
    expect(result.current.config.debounce).toBe(300);
    expect(result.current.config.enableFloatingFilter).toBe(false);
    expect(result.current.config.enableFilterToolPanel).toBe(false);
    expect(result.current.state.quickFilterText).toBe("");
    expect(result.current.state.filterModel).toEqual({});
  });

  it("should initialize with custom config", () => {
    const { result } = renderHook(() =>
      useFilteringFeature({
        mode: "quick",
        debounce: 500,
        enableFloatingFilter: true,
        enableFilterToolPanel: true,
      }),
    );

    expect(result.current.config.mode).toBe("quick");
    expect(result.current.config.debounce).toBe(500);
    expect(result.current.config.enableFloatingFilter).toBe(true);
    expect(result.current.config.enableFilterToolPanel).toBe(true);
  });

  it("should set quick filter text", () => {
    const { result } = renderHook(() => useFilteringFeature());

    act(() => {
      result.current.actions.setQuickFilter("test search");
    });

    // Quick filter text is set immediately
    expect(result.current.toolbarProps?.quickFilterValue).toBe("test search");

    // State quick filter text is debounced
    expect(result.current.state.quickFilterText).toBe("");

    // After debounce delay
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.state.quickFilterText).toBe("test search");
  });

  it("should debounce quick filter text correctly", () => {
    const { result } = renderHook(() => useFilteringFeature({ debounce: 500 }));

    act(() => {
      result.current.actions.setQuickFilter("first");
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Should not update yet
    expect(result.current.state.quickFilterText).toBe("");

    act(() => {
      result.current.actions.setQuickFilter("second");
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should use the latest value after debounce
    expect(result.current.state.quickFilterText).toBe("second");
  });

  it("should set column filter", () => {
    const { result } = renderHook(() => useFilteringFeature());

    act(() => {
      result.current.actions.setColumnFilter("name", {
        type: "contains",
        filter: "John",
      });
    });

    expect(result.current.state.filterModel).toEqual({
      name: { type: "contains", filter: "John" },
    });

    act(() => {
      result.current.actions.setColumnFilter("email", {
        type: "equals",
        filter: "john@example.com",
      });
    });

    expect(result.current.state.filterModel).toEqual({
      name: { type: "contains", filter: "John" },
      email: { type: "equals", filter: "john@example.com" },
    });
  });

  it("should clear all filters", () => {
    const { result } = renderHook(() => useFilteringFeature());

    act(() => {
      result.current.actions.setQuickFilter("search");
      result.current.actions.setColumnFilter("name", { filter: "test" });
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.state.quickFilterText).toBe("search");
    expect(result.current.state.filterModel).toEqual({
      name: { filter: "test" },
    });

    act(() => {
      result.current.actions.clearFilters();
    });

    expect(result.current.state.quickFilterText).toBe("");
    expect(result.current.state.filterModel).toEqual({});
    expect(result.current.toolbarProps?.quickFilterValue).toBe("");
  });

  it("should provide correct gridProps for 'both' mode", () => {
    const { result } = renderHook(() =>
      useFilteringFeature({
        mode: "both",
        enableFloatingFilter: true,
      }),
    );

    expect(result.current.gridProps?.quickFilterText).toBe("");
    expect(result.current.gridProps?.floatingFilter).toBe(true);
  });

  it("should provide correct gridProps for 'quick' mode", () => {
    const { result } = renderHook(() =>
      useFilteringFeature({
        mode: "quick",
      }),
    );

    expect(result.current.gridProps?.quickFilterText).toBe("");
    expect(result.current.gridProps?.floatingFilter).toBeUndefined();
  });

  it("should provide correct gridProps for 'advanced' mode", () => {
    const { result } = renderHook(() =>
      useFilteringFeature({
        mode: "advanced",
        enableFloatingFilter: true,
      }),
    );

    expect(result.current.gridProps?.quickFilterText).toBeUndefined();
    expect(result.current.gridProps?.floatingFilter).toBe(true);
  });

  it("should provide sideBar in gridProps when filter tool panel is enabled", () => {
    const { result } = renderHook(() =>
      useFilteringFeature({
        enableFilterToolPanel: true,
      }),
    );

    expect(result.current.gridProps?.sideBar).toBeDefined();
    expect(result.current.gridProps?.sideBar).toHaveProperty("toolPanels");
    expect((result.current.gridProps?.sideBar as any).toolPanels).toHaveLength(
      1,
    );
  });

  it("should provide correct toolbarProps", () => {
    const { result } = renderHook(() =>
      useFilteringFeature({
        mode: "both",
      }),
    );

    expect(result.current.toolbarProps?.showQuickFilter).toBe(true);
    expect(result.current.toolbarProps?.quickFilterValue).toBe("");
    expect(result.current.toolbarProps?.onQuickFilterChange).toBeDefined();
    expect(result.current.toolbarProps?.showClearFilters).toBe(true);
    expect(result.current.toolbarProps?.onClearFilters).toBeDefined();
  });

  it("should not show quick filter in toolbarProps for 'advanced' mode", () => {
    const { result } = renderHook(() =>
      useFilteringFeature({
        mode: "advanced",
      }),
    );

    expect(result.current.toolbarProps?.showQuickFilter).toBe(false);
  });
});
