import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIncrementalSearch, type SearchableItem } from "../use-incremental-search";

interface TestItem extends SearchableItem {
  id: string;
  name: string;
  email: string;
  age: number;
  category: string;
}

describe("useIncrementalSearch", () => {
  const mockItems: TestItem[] = [
    { id: "1", name: "John Doe", email: "john@example.com", age: 30, category: "admin" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", age: 25, category: "user" },
    { id: "3", name: "Bob Johnson", email: "bob@example.com", age: 35, category: "admin" },
    { id: "4", name: "Alice Brown", email: "alice@example.com", age: 28, category: "user" },
    { id: "5", name: "Charlie Wilson", email: "charlie@example.com", age: 32, category: "admin" },
    { id: "6", name: "Diana Davis", email: "diana@example.com", age: 27, category: "user" },
    { id: "7", name: "Eve Miller", email: "eve@example.com", age: 31, category: "admin" },
    { id: "8", name: "Frank Taylor", email: "frank@example.com", age: 29, category: "user" },
  ];

  const defaultOptions = {
    items: mockItems,
    searchFields: ["name", "email"] as (keyof TestItem)[],
    pageSize: 3,
  };

  describe("initial state", () => {
    it("should initialize with correct default values", () => {
      const { result } = renderHook(() => useIncrementalSearch(defaultOptions));

      expect(result.current.searchQuery).toBe("");
      expect(result.current.paginatedItems).toHaveLength(3); // First page
      expect(result.current.filteredItems).toEqual(mockItems);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.totalCount).toBe(8);
      expect(result.current.displayCount).toBe(3);
      expect(result.current.isSearching).toBe(false);
    });

    it("should handle custom pageSize", () => {
      const { result } = renderHook(() =>
        useIncrementalSearch({
          ...defaultOptions,
          pageSize: 5,
        })
      );

      expect(result.current.paginatedItems).toHaveLength(5);
      expect(result.current.hasMore).toBe(true);
    });

    it("should handle pageSize larger than items count", () => {
      const { result } = renderHook(() =>
        useIncrementalSearch({
          ...defaultOptions,
          pageSize: 20,
        })
      );

      expect(result.current.paginatedItems).toHaveLength(8);
      expect(result.current.hasMore).toBe(false);
    });
  });

  describe("search functionality", () => {
    it("should filter items by name", () => {
      const { result } = renderHook(() => useIncrementalSearch(defaultOptions));

      act(() => {
        result.current.handleSearch("john");
      });

      expect(result.current.searchQuery).toBe("john");
      expect(result.current.filteredItems).toHaveLength(2); // John Doe, Bob Johnson
      expect(result.current.paginatedItems).toHaveLength(2);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.isSearching).toBe(true);
    });

    it("should filter items by email", () => {
      const { result } = renderHook(() => useIncrementalSearch(defaultOptions));

      act(() => {
        result.current.handleSearch("alice@");
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].name).toBe("Alice Brown");
    });

    it("should be case insensitive", () => {
      const { result } = renderHook(() => useIncrementalSearch(defaultOptions));

      act(() => {
        result.current.handleSearch("JANE");
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].name).toBe("Jane Smith");
    });

    it("should handle empty search results", () => {
      const { result } = renderHook(() => useIncrementalSearch(defaultOptions));

      act(() => {
        result.current.handleSearch("nonexistent");
      });

      expect(result.current.filteredItems).toHaveLength(0);
      expect(result.current.paginatedItems).toHaveLength(0);
      expect(result.current.hasMore).toBe(false);
    });

    it("should trim whitespace in search query", () => {
      const { result } = renderHook(() => useIncrementalSearch(defaultOptions));

      act(() => {
        result.current.handleSearch("  ");
      });

      expect(result.current.filteredItems).toEqual(mockItems);
      expect(result.current.isSearching).toBe(false);
    });

    it("should search in number fields", () => {
      const { result } = renderHook(() =>
        useIncrementalSearch({
          ...defaultOptions,
          searchFields: ["age"],
        })
      );

      act(() => {
        result.current.handleSearch("30");
      });

      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].name).toBe("John Doe");
    });

    it("should search in multiple fields", () => {
      const { result } = renderHook(() =>
        useIncrementalSearch({
          ...defaultOptions,
          searchFields: ["name", "email", "category"],
        })
      );

      act(() => {
        result.current.handleSearch("admin");
      });

      expect(result.current.filteredItems).toHaveLength(4); // All admin users
    });
  });

  describe("custom filter function", () => {
    it("should use custom filter function when provided", () => {
      const customFilterFn = (item: TestItem, query: string) => {
        return item.age > parseInt(query, 10);
      };

      const { result } = renderHook(() =>
        useIncrementalSearch({
          ...defaultOptions,
          filterFn: customFilterFn,
        })
      );

      act(() => {
        result.current.handleSearch("30");
      });

      expect(result.current.filteredItems).toHaveLength(3); // age > 30
      expect(result.current.filteredItems.every((item) => item.age > 30)).toBe(true);
    });

    it("should handle custom filter returning no results", () => {
      const customFilterFn = () => false;

      const { result } = renderHook(() =>
        useIncrementalSearch({
          ...defaultOptions,
          filterFn: customFilterFn,
        })
      );

      act(() => {
        result.current.handleSearch("anything");
      });

      expect(result.current.filteredItems).toHaveLength(0);
    });
  });

  describe("pagination", () => {
    it("should load more items when hasMore is true", () => {
      const { result } = renderHook(() => useIncrementalSearch(defaultOptions));

      expect(result.current.paginatedItems).toHaveLength(3);
      expect(result.current.hasMore).toBe(true);

      act(() => {
        result.current.loadMore();
      });

      expect(result.current.paginatedItems).toHaveLength(6);
      expect(result.current.hasMore).toBe(true);

      act(() => {
        result.current.loadMore();
      });

      expect(result.current.paginatedItems).toHaveLength(8);
      expect(result.current.hasMore).toBe(false);
    });

    it("should not load more when hasMore is false", () => {
      const { result } = renderHook(() =>
        useIncrementalSearch({
          ...defaultOptions,
          pageSize: 10, // Larger than items count
        })
      );

      expect(result.current.hasMore).toBe(false);
      const initialLength = result.current.paginatedItems.length;

      act(() => {
        result.current.loadMore();
      });

      expect(result.current.paginatedItems).toHaveLength(initialLength);
    });

    it("should reset pagination when search query changes", () => {
      const { result } = renderHook(() => useIncrementalSearch(defaultOptions));

      // Load more items first
      act(() => {
        result.current.loadMore();
      });

      expect(result.current.paginatedItems).toHaveLength(6);

      // Change search query
      act(() => {
        result.current.handleSearch("john");
      });

      // Should reset to first page
      expect(result.current.paginatedItems).toHaveLength(2); // Only 2 Johns found
    });
  });

  describe("clear search", () => {
    it("should clear search and reset pagination", () => {
      const { result } = renderHook(() => useIncrementalSearch(defaultOptions));

      // Set a search query and load more
      act(() => {
        result.current.handleSearch("john");
        result.current.loadMore();
      });

      expect(result.current.searchQuery).toBe("john");
      expect(result.current.isSearching).toBe(true);

      // Clear search
      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.searchQuery).toBe("");
      expect(result.current.isSearching).toBe(false);
      expect(result.current.filteredItems).toEqual(mockItems);
      expect(result.current.paginatedItems).toHaveLength(3); // Back to first page
    });
  });

  describe("edge cases", () => {
    it("should handle empty items array", () => {
      const { result } = renderHook(() =>
        useIncrementalSearch({
          ...defaultOptions,
          items: [],
        })
      );

      expect(result.current.paginatedItems).toHaveLength(0);
      expect(result.current.filteredItems).toHaveLength(0);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.displayCount).toBe(0);
    });

    it("should handle items without specified search fields", () => {
      const itemsWithMissingFields = [
        { id: "1", name: "Test" },
        { id: "2", email: "test@example.com" },
      ] as TestItem[];

      const { result } = renderHook(() =>
        useIncrementalSearch({
          items: itemsWithMissingFields,
          searchFields: ["name", "email"],
          pageSize: 5,
        })
      );

      act(() => {
        result.current.handleSearch("test");
      });

      expect(result.current.filteredItems).toHaveLength(2); // Both should match
    });

    it("should handle non-string, non-number field values", () => {
      const itemsWithObjectFields = [
        { id: "1", name: "Test", data: { nested: "value" } },
        { id: "2", name: "Another", data: null },
        { id: "3", name: "Third", data: undefined },
      ] as TestItem[];

      const { result } = renderHook(() =>
        useIncrementalSearch({
          items: itemsWithObjectFields,
          searchFields: ["name", "data"],
          pageSize: 5,
        })
      );

      act(() => {
        result.current.handleSearch("value");
      });

      // Should only match name field, not object field
      expect(result.current.filteredItems).toHaveLength(0);
    });
  });

  describe("default pageSize", () => {
    it("should use default pageSize of 20 when not specified", () => {
      const largeItems = Array.from({ length: 50 }, (_, i) => ({
        id: i.toString(),
        name: `Item ${i}`,
        email: `item${i}@example.com`,
        age: 20 + i,
        category: "user",
      }));

      const { result } = renderHook(() =>
        useIncrementalSearch({
          items: largeItems,
          searchFields: ["name"],
        })
      );

      expect(result.current.paginatedItems).toHaveLength(20);
      expect(result.current.hasMore).toBe(true);
    });
  });
});