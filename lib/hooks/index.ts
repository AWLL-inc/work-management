/**
 * Custom hooks barrel export
 *
 * Centralized exports for all custom hooks in the application.
 *
 * @module lib/hooks
 */

export {
  type UseCategoryDataOptions,
  type UseCategoryDataResult,
  useCategoryData,
} from "./use-category-data";
// Utility hooks
export { useIncrementalSearch } from "./use-incremental-search";
export { type MediaQueryState, useMediaQuery } from "./use-media-query";
export {
  type UseProjectDataOptions,
  type UseProjectDataResult,
  useProjectData,
} from "./use-project-data";
// Data fetching hooks
export {
  type UseWorkLogDataOptions,
  type UseWorkLogDataResult,
  useWorkLogData,
} from "./use-work-log-data";
// Mutation hooks
export {
  type CreateWorkLogData,
  type UpdateWorkLogData,
  type UseWorkLogMutationsOptions,
  type UseWorkLogMutationsResult,
  useWorkLogMutations,
} from "./use-work-log-mutations";
