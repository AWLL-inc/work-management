/**
 * Custom hook for fetching work category data
 *
 * @module lib/hooks/use-category-data
 */

import useSWR from "swr";
import type { WorkCategory } from "@/drizzle/schema";
import { getWorkCategories } from "@/lib/api/work-categories";

/**
 * Hook return type
 */
export interface UseCategoryDataResult {
  /**
   * Array of work categories (empty array if loading or no data)
   */
  categories: WorkCategory[];
  /**
   * Loading state
   */
  isLoading: boolean;
  /**
   * Error object if fetch failed
   */
  error: Error | undefined;
  /**
   * Function to refresh/revalidate the data
   */
  refresh: () => Promise<WorkCategory[] | undefined>;
}

/**
 * Hook options
 */
export interface UseCategoryDataOptions {
  /**
   * Only fetch active categories (default: true)
   */
  activeOnly?: boolean;
  /**
   * Whether to revalidate on focus (default: false)
   */
  revalidateOnFocus?: boolean;
  /**
   * Whether to revalidate on reconnect (default: false)
   */
  revalidateOnReconnect?: boolean;
}

/**
 * Custom hook for fetching work category data
 *
 * @param options - Hook options for filtering and SWR configuration
 * @returns Categories data, loading state, error, and refresh function
 *
 * @example
 * ```typescript
 * function CategorySelector() {
 *   const { categories, isLoading } = useCategoryData({ activeOnly: true });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <select>
 *       {categories.map(category => (
 *         <option key={category.id} value={category.id}>
 *           {category.name}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
export function useCategoryData(
  options: UseCategoryDataOptions = {},
): UseCategoryDataResult {
  const {
    activeOnly = true,
    revalidateOnFocus = false,
    revalidateOnReconnect = false,
  } = options;

  const cacheKey = activeOnly
    ? "/api/work-categories?active=true"
    : "/api/work-categories";

  const {
    data: categories,
    error,
    isLoading,
    mutate,
  } = useSWR<WorkCategory[]>(cacheKey, () => getWorkCategories(activeOnly), {
    revalidateOnFocus,
    revalidateOnReconnect,
  });

  return {
    categories: categories || [],
    isLoading,
    error,
    refresh: mutate,
  };
}
