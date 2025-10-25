/**
 * Custom hook for fetching work log data with SWR
 *
 * Provides a clean interface for fetching work logs with optional filters,
 * handling loading states, and refreshing data.
 *
 * @module lib/hooks/use-work-log-data
 */

import useSWR from "swr";
import type { WorkLog } from "@/drizzle/schema";
import { type GetWorkLogsOptions, getWorkLogs } from "@/lib/api/work-logs";

/**
 * Build query string from filters
 */
function buildQueryParams(filters: GetWorkLogsOptions): string {
  const params = new URLSearchParams();
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.projectIds) params.set("projectIds", filters.projectIds);
  if (filters.categoryIds) params.set("categoryIds", filters.categoryIds);
  if (filters.userId) params.set("userId", filters.userId);
  return params.toString();
}

/**
 * Hook return type
 */
export interface UseWorkLogDataResult {
  /**
   * Array of work logs (empty array if loading or no data)
   */
  workLogs: WorkLog[];
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
  refresh: () => Promise<WorkLog[] | undefined>;
  /**
   * Function to mutate the data locally (optimistic updates)
   */
  mutate: (
    data?: WorkLog[] | Promise<WorkLog[]>,
    shouldRevalidate?: boolean,
  ) => Promise<WorkLog[] | undefined>;
}

/**
 * Hook options
 */
export interface UseWorkLogDataOptions {
  /**
   * Filters to apply to the work logs query
   */
  filters?: GetWorkLogsOptions;
  /**
   * Whether to revalidate on focus (default: false)
   */
  revalidateOnFocus?: boolean;
  /**
   * Whether to revalidate on reconnect (default: false)
   */
  revalidateOnReconnect?: boolean;
  /**
   * Fallback data to use while loading
   */
  fallbackData?: WorkLog[];
}

/**
 * Custom hook for fetching work log data
 *
 * @param options - Hook options including filters and SWR configuration
 * @returns Work logs data, loading state, error, and mutation functions
 *
 * @example
 * ```typescript
 * function WorkLogsPage() {
 *   const { workLogs, isLoading, refresh } = useWorkLogData({
 *     filters: { startDate: '2025-01-01', endDate: '2025-12-31' }
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {workLogs.map(log => <WorkLogItem key={log.id} log={log} />)}
 *       <button onClick={refresh}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useWorkLogData(
  options: UseWorkLogDataOptions = {},
): UseWorkLogDataResult {
  const {
    filters = {},
    revalidateOnFocus = false,
    revalidateOnReconnect = false,
    fallbackData,
  } = options;

  // Build unique cache key based on filters
  const queryString = buildQueryParams(filters);
  const cacheKey = queryString
    ? `/api/work-logs?${queryString}`
    : "/api/work-logs";

  // Fetch data with SWR
  const {
    data: workLogs,
    error,
    isLoading,
    mutate,
  } = useSWR<WorkLog[]>(cacheKey, () => getWorkLogs(filters), {
    revalidateOnFocus,
    revalidateOnReconnect,
    fallbackData,
  });

  return {
    workLogs: workLogs || [],
    isLoading,
    error,
    refresh: mutate,
    mutate,
  };
}
