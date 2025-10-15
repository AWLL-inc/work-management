/**
 * Custom hook for fetching project data
 *
 * @module lib/hooks/use-project-data
 */

import useSWR from "swr";
import type { Project } from "@/drizzle/schema";
import { getProjects } from "@/lib/api/projects";

/**
 * Hook return type
 */
export interface UseProjectDataResult {
  /**
   * Array of projects (empty array if loading or no data)
   */
  projects: Project[];
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
  refresh: () => Promise<Project[] | undefined>;
}

/**
 * Hook options
 */
export interface UseProjectDataOptions {
  /**
   * Only fetch active projects (default: true)
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
 * Custom hook for fetching project data
 *
 * @param options - Hook options for filtering and SWR configuration
 * @returns Projects data, loading state, error, and refresh function
 *
 * @example
 * ```typescript
 * function ProjectSelector() {
 *   const { projects, isLoading } = useProjectData({ activeOnly: true });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <select>
 *       {projects.map(project => (
 *         <option key={project.id} value={project.id}>
 *           {project.name}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
export function useProjectData(
  options: UseProjectDataOptions = {},
): UseProjectDataResult {
  const {
    activeOnly = true,
    revalidateOnFocus = false,
    revalidateOnReconnect = false,
  } = options;

  const cacheKey = activeOnly ? "/api/projects?active=true" : "/api/projects";

  const {
    data: projects,
    error,
    isLoading,
    mutate,
  } = useSWR<Project[]>(cacheKey, () => getProjects(activeOnly), {
    revalidateOnFocus,
    revalidateOnReconnect,
  });

  return {
    projects: projects || [],
    isLoading,
    error,
    refresh: mutate,
  };
}
