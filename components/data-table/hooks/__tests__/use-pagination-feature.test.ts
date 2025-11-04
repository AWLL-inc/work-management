import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePaginationFeature } from "../use-pagination-feature";

describe("usePaginationFeature", () => {
  it("should initialize with default config", () => {
    const { result } = renderHook(() => usePaginationFeature({}, 100));

    expect(result.current.config.mode).toBe("client");
    expect(result.current.config.pageSize).toBe(20);
    expect(result.current.config.pageSizeOptions).toEqual([10, 20, 50, 100]);
    expect(result.current.config.initialPage).toBe(0);
    expect(result.current.state.currentPage).toBe(0);
    expect(result.current.state.pageSize).toBe(20);
    expect(result.current.state.totalRows).toBe(100);
    expect(result.current.state.totalPages).toBe(5); // 100 / 20 = 5
  });

  it("should initialize with custom config", () => {
    const { result } = renderHook(() =>
      usePaginationFeature(
        {
          mode: "client",
          pageSize: 50,
          pageSizeOptions: [25, 50, 100],
          initialPage: 2,
        },
        200,
      ),
    );

    expect(result.current.config.pageSize).toBe(50);
    expect(result.current.config.pageSizeOptions).toEqual([25, 50, 100]);
    expect(result.current.state.currentPage).toBe(2);
    expect(result.current.state.totalPages).toBe(4); // 200 / 50 = 4
  });

  it("should go to specific page", () => {
    const { result } = renderHook(() => usePaginationFeature({}, 100));

    act(() => {
      result.current.actions.goToPage(2);
    });

    expect(result.current.state.currentPage).toBe(2);
  });

  it("should not go beyond last page", () => {
    const { result } = renderHook(() => usePaginationFeature({}, 100));

    act(() => {
      result.current.actions.goToPage(10); // Total pages is 5
    });

    expect(result.current.state.currentPage).toBe(4); // Last page (0-indexed)
  });

  it("should not go before first page", () => {
    const { result } = renderHook(() => usePaginationFeature({}, 100));

    act(() => {
      result.current.actions.goToPage(-5);
    });

    expect(result.current.state.currentPage).toBe(0);
  });

  it("should go to next page", () => {
    const { result } = renderHook(() => usePaginationFeature({}, 100));

    act(() => {
      result.current.actions.nextPage();
    });

    expect(result.current.state.currentPage).toBe(1);

    act(() => {
      result.current.actions.nextPage();
    });

    expect(result.current.state.currentPage).toBe(2);
  });

  it("should not go beyond last page when calling nextPage", () => {
    const { result } = renderHook(() => usePaginationFeature({}, 100));

    act(() => {
      result.current.actions.goToPage(4); // Last page
      result.current.actions.nextPage();
    });

    expect(result.current.state.currentPage).toBe(4);
  });

  it("should go to previous page", () => {
    const { result } = renderHook(() => usePaginationFeature({}, 100));

    act(() => {
      result.current.actions.goToPage(3);
      result.current.actions.previousPage();
    });

    expect(result.current.state.currentPage).toBe(2);
  });

  it("should not go before first page when calling previousPage", () => {
    const { result } = renderHook(() => usePaginationFeature({}, 100));

    act(() => {
      result.current.actions.previousPage();
    });

    expect(result.current.state.currentPage).toBe(0);
  });

  it("should go to first page", () => {
    const { result } = renderHook(() => usePaginationFeature({}, 100));

    act(() => {
      result.current.actions.goToPage(3);
      result.current.actions.firstPage();
    });

    expect(result.current.state.currentPage).toBe(0);
  });

  it("should go to last page", () => {
    const { result } = renderHook(() => usePaginationFeature({}, 100));

    act(() => {
      result.current.actions.lastPage();
    });

    expect(result.current.state.currentPage).toBe(4);
  });

  it("should change page size and reset to first page", () => {
    const { result } = renderHook(() => usePaginationFeature({}, 100));

    act(() => {
      result.current.actions.goToPage(2);
    });

    expect(result.current.state.currentPage).toBe(2);
    expect(result.current.state.pageSize).toBe(20);

    act(() => {
      result.current.actions.setPageSize(50);
    });

    // Should reset to first page
    expect(result.current.state.currentPage).toBe(0);
    expect(result.current.state.pageSize).toBe(50);
    expect(result.current.state.totalPages).toBe(2); // 100 / 50 = 2
  });

  it("should adjust current page when totalRows decreases", () => {
    const { result, rerender } = renderHook(
      ({ totalRows }) => usePaginationFeature({}, totalRows),
      {
        initialProps: { totalRows: 100 },
      },
    );

    act(() => {
      result.current.actions.goToPage(4); // Last page
    });

    expect(result.current.state.currentPage).toBe(4);

    // Decrease totalRows
    rerender({ totalRows: 40 });

    // Should adjust to new last page
    expect(result.current.state.currentPage).toBe(1); // 40 / 20 = 2 pages, last is page 1
  });

  it("should provide correct gridProps for client mode", () => {
    const { result } = renderHook(() =>
      usePaginationFeature({ mode: "client" }, 100),
    );

    expect(result.current.gridProps?.pagination).toBe(true);
    expect(result.current.gridProps?.paginationPageSize).toBe(20);
    expect(result.current.gridProps?.paginationPageSizeSelector).toEqual([
      10, 20, 50, 100,
    ]);
    // Client mode should not set rowModelType
    expect(result.current.gridProps?.rowModelType).toBeUndefined();
  });

  it("should provide correct toolbarProps", () => {
    const { result } = renderHook(() => usePaginationFeature({}, 100));

    expect(result.current.toolbarProps?.showPagination).toBe(true);
    expect(result.current.toolbarProps?.currentPage).toBe(0);
    expect(result.current.toolbarProps?.pageSize).toBe(20);
    expect(result.current.toolbarProps?.totalRows).toBe(100);
    expect(result.current.toolbarProps?.totalPages).toBe(5);
    expect(result.current.toolbarProps?.pageSizeOptions).toEqual([
      10, 20, 50, 100,
    ]);
    expect(result.current.toolbarProps?.onPageChange).toBeDefined();
    expect(result.current.toolbarProps?.onPageSizeChange).toBeDefined();
    expect(result.current.toolbarProps?.onNextPage).toBeDefined();
    expect(result.current.toolbarProps?.onPreviousPage).toBeDefined();
    expect(result.current.toolbarProps?.onFirstPage).toBeDefined();
    expect(result.current.toolbarProps?.onLastPage).toBeDefined();
  });

  it("should handle zero total rows", () => {
    const { result } = renderHook(() => usePaginationFeature({}, 0));

    expect(result.current.state.totalPages).toBe(0);
    expect(result.current.state.currentPage).toBe(0);

    act(() => {
      result.current.actions.nextPage();
    });

    expect(result.current.state.currentPage).toBe(0);
  });
});
