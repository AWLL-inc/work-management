import { useCallback, useEffect, useMemo, useState } from "react";

export interface SearchableItem {
  id: string;
  [key: string]: unknown;
}

export interface UseIncrementalSearchOptions<T extends SearchableItem> {
  items: T[];
  searchFields: (keyof T)[];
  pageSize?: number;
  filterFn?: (item: T, query: string) => boolean;
}

export function useIncrementalSearch<T extends SearchableItem>({
  items,
  searchFields,
  pageSize = 20,
  filterFn,
}: UseIncrementalSearchOptions<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }

    const query = searchQuery.toLowerCase();

    return items.filter((item) => {
      if (filterFn) {
        return filterFn(item, query);
      }

      // Default search logic: search in specified fields
      return searchFields.some((field) => {
        const value = item[field];
        if (typeof value === "string") {
          return value.toLowerCase().includes(query);
        }
        if (typeof value === "number") {
          return value.toString().includes(query);
        }
        return false;
      });
    });
  }, [items, searchQuery, searchFields, filterFn]);

  // Paginated results
  const paginatedItems = useMemo(() => {
    const endIndex = currentPage * pageSize;
    return filteredItems.slice(0, endIndex);
  }, [filteredItems, currentPage, pageSize]);

  // Check if there are more items to load
  const hasMore = useMemo(() => {
    return paginatedItems.length < filteredItems.length;
  }, [paginatedItems.length, filteredItems.length]);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Load more items (increment page)
  const loadMore = useCallback(() => {
    if (hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasMore]);

  // Search handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setCurrentPage(1);
  }, []);

  return {
    searchQuery,
    paginatedItems,
    filteredItems,
    hasMore,
    totalCount: filteredItems.length,
    displayCount: paginatedItems.length,
    isSearching: searchQuery.trim().length > 0,
    loadMore,
    handleSearch,
    clearSearch,
  };
}
