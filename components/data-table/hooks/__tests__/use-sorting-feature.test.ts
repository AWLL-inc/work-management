import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSortingFeature } from "../use-sorting-feature";

describe("useSortingFeature", () => {
	it("should initialize with default config", () => {
		const { result } = renderHook(() => useSortingFeature());

		expect(result.current.config.multiSort).toBe(false);
		expect(result.current.config.maxSortColumns).toBe(3);
		expect(result.current.state.sortModel).toEqual([]);
	});

	it("should initialize with custom config", () => {
		const { result } = renderHook(() =>
			useSortingFeature({
				multiSort: true,
				maxSortColumns: 5,
				initialSort: [{ column: "name", direction: "asc" }],
			}),
		);

		expect(result.current.config.multiSort).toBe(true);
		expect(result.current.config.maxSortColumns).toBe(5);
		expect(result.current.state.sortModel).toEqual([
			{ column: "name", direction: "asc" },
		]);
	});

	it("should set sort correctly in single sort mode", () => {
		const { result } = renderHook(() => useSortingFeature());

		act(() => {
			result.current.actions.setSort("name", "asc");
		});

		expect(result.current.state.sortModel).toEqual([
			{ column: "name", direction: "asc" },
		]);

		// Setting another column should replace the previous sort
		act(() => {
			result.current.actions.setSort("email", "desc");
		});

		expect(result.current.state.sortModel).toEqual([
			{ column: "email", direction: "desc" },
		]);
	});

	it("should set sort correctly in multi sort mode", () => {
		const { result } = renderHook(() =>
			useSortingFeature({ multiSort: true }),
		);

		act(() => {
			result.current.actions.setSort("name", "asc");
		});
		expect(result.current.state.sortModel).toEqual([
			{ column: "name", direction: "asc" },
		]);

		act(() => {
			result.current.actions.setSort("email", "desc");
		});
		expect(result.current.state.sortModel).toEqual([
			{ column: "name", direction: "asc" },
			{ column: "email", direction: "desc" },
		]);
	});

	it("should toggle sort direction for single column mode", () => {
		const { result } = renderHook(() => useSortingFeature());

		// First toggle: null -> asc
		act(() => {
			result.current.actions.toggleSort("name");
		});
		expect(result.current.state.sortModel[0]?.direction).toBe("asc");

		// Second toggle: asc -> desc
		act(() => {
			result.current.actions.toggleSort("name");
		});
		expect(result.current.state.sortModel[0]?.direction).toBe("desc");

		// Third toggle in single mode: desc -> asc (cycles back)
		act(() => {
			result.current.actions.toggleSort("name");
		});
		expect(result.current.state.sortModel[0]?.direction).toBe("asc");
	});

	it("should respect maxSortColumns in multi sort mode", () => {
		const { result } = renderHook(() =>
			useSortingFeature({ multiSort: true, maxSortColumns: 2 }),
		);

		act(() => {
			result.current.actions.setSort("a", "asc");
			result.current.actions.setSort("b", "asc");
			result.current.actions.setSort("c", "asc"); // Should remove 'a'
		});

		// Should only keep the last 2 columns
		expect(result.current.state.sortModel).toHaveLength(2);
		expect(result.current.state.sortModel.map((s) => s.column)).toEqual([
			"b",
			"c",
		]);
	});

	it("should clear all sorts", () => {
		const { result } = renderHook(() =>
			useSortingFeature({ multiSort: true }),
		);

		act(() => {
			result.current.actions.setSort("name", "asc");
			result.current.actions.setSort("email", "desc");
		});
		expect(result.current.state.sortModel).toHaveLength(2);

		act(() => {
			result.current.actions.clearSort();
		});
		expect(result.current.state.sortModel).toEqual([]);
	});

	it("should clear sort for specific column", () => {
		const { result } = renderHook(() =>
			useSortingFeature({ multiSort: true }),
		);

		act(() => {
			result.current.actions.setSort("name", "asc");
			result.current.actions.setSort("email", "desc");
		});
		expect(result.current.state.sortModel).toHaveLength(2);

		act(() => {
			result.current.actions.clearColumnSort("name");
		});
		expect(result.current.state.sortModel).toEqual([
			{ column: "email", direction: "desc" },
		]);
	});

	it("should provide correct gridProps", () => {
		const { result } = renderHook(() => useSortingFeature());

		expect(result.current.gridProps).toBeDefined();
		expect(result.current.gridProps?.sortingOrder).toEqual(["asc", "desc", null]);
		expect(result.current.gridProps?.multiSortKey).toBeUndefined();
	});

	it("should provide multiSortKey when multiSort is enabled", () => {
		const { result } = renderHook(() =>
			useSortingFeature({ multiSort: true }),
		);

		expect(result.current.gridProps?.multiSortKey).toBe("ctrl");
	});
});
