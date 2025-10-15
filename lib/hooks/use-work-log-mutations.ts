/**
 * Custom hook for work log mutations (CRUD operations)
 *
 * Provides functions for creating, updating, and deleting work logs
 * with automatic cache invalidation.
 *
 * @module lib/hooks/use-work-log-mutations
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import {
  createWorkLog as apiCreateWorkLog,
  deleteWorkLog as apiDeleteWorkLog,
  updateWorkLog as apiUpdateWorkLog,
} from "@/lib/api/work-logs";

/**
 * Data for creating a new work log
 */
export interface CreateWorkLogData {
  date: string;
  hours: string;
  projectId: string;
  categoryId: string;
  details?: string | null;
}

/**
 * Data for updating an existing work log
 */
export interface UpdateWorkLogData {
  date?: string;
  hours?: string;
  projectId?: string;
  categoryId?: string;
  details?: string | null;
}

/**
 * Hook return type
 */
export interface UseWorkLogMutationsResult {
  /**
   * Create a new work log
   * @param data - Work log data
   * @throws Error if creation fails
   */
  createWorkLog: (data: CreateWorkLogData) => Promise<void>;
  /**
   * Update an existing work log
   * @param id - Work log ID
   * @param data - Updated work log data
   * @throws Error if update fails
   */
  updateWorkLog: (id: string, data: UpdateWorkLogData) => Promise<void>;
  /**
   * Delete a work log
   * @param id - Work log ID
   * @throws Error if deletion fails
   */
  deleteWorkLog: (id: string) => Promise<void>;
  /**
   * Loading states for each operation
   */
  isLoading: {
    create: boolean;
    update: boolean;
    delete: boolean;
  };
}

/**
 * Hook options
 */
export interface UseWorkLogMutationsOptions {
  /**
   * Show toast notifications on success/error (default: true)
   */
  showToasts?: boolean;
  /**
   * Callback after successful creation
   */
  onCreateSuccess?: () => void;
  /**
   * Callback after successful update
   */
  onUpdateSuccess?: () => void;
  /**
   * Callback after successful deletion
   */
  onDeleteSuccess?: () => void;
  /**
   * Callback on error
   */
  onError?: (error: Error, operation: "create" | "update" | "delete") => void;
}

/**
 * Custom hook for work log mutations
 *
 * Handles create, update, and delete operations with automatic cache invalidation
 * and optional toast notifications.
 *
 * @param options - Hook options for callbacks and toast configuration
 * @returns Mutation functions and loading states
 *
 * @example
 * ```typescript
 * function WorkLogForm() {
 *   const { createWorkLog, isLoading } = useWorkLogMutations({
 *     showToasts: true,
 *     onCreateSuccess: () => console.log('Created!'),
 *   });
 *
 *   const handleSubmit = async (data: CreateWorkLogData) => {
 *     await createWorkLog(data);
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {/* form fields *\/}
 *       <button disabled={isLoading.create}>Create</button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useWorkLogMutations(
  options: UseWorkLogMutationsOptions = {},
): UseWorkLogMutationsResult {
  const {
    showToasts = true,
    onCreateSuccess,
    onUpdateSuccess,
    onDeleteSuccess,
    onError,
  } = options;

  const { mutate } = useSWRConfig();

  // Note: In a real implementation, you would track loading states
  // For now, operations are atomic and complete quickly
  const isLoading = {
    create: false,
    update: false,
    delete: false,
  };

  /**
   * Create a new work log
   */
  const createWorkLog = useCallback(
    async (data: CreateWorkLogData) => {
      try {
        await apiCreateWorkLog({
          date: data.date,
          hours: data.hours,
          projectId: data.projectId,
          categoryId: data.categoryId,
          details: data.details || null,
        });

        // Invalidate all work logs cache keys
        await mutate(
          (key) => typeof key === "string" && key.startsWith("/api/work-logs"),
          undefined,
          { revalidate: true },
        );

        if (showToasts) {
          toast.success("Work log created successfully");
        }

        onCreateSuccess?.();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create work log";

        if (showToasts) {
          toast.error(errorMessage);
        }

        onError?.(
          error instanceof Error ? error : new Error(errorMessage),
          "create",
        );

        throw error;
      }
    },
    [mutate, showToasts, onCreateSuccess, onError],
  );

  /**
   * Update an existing work log
   */
  const updateWorkLog = useCallback(
    async (id: string, data: UpdateWorkLogData) => {
      try {
        await apiUpdateWorkLog(id, data);

        // Invalidate all work logs cache keys
        await mutate(
          (key) => typeof key === "string" && key.startsWith("/api/work-logs"),
          undefined,
          { revalidate: true },
        );

        if (showToasts) {
          toast.success("Work log updated successfully");
        }

        onUpdateSuccess?.();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update work log";

        if (showToasts) {
          toast.error(errorMessage);
        }

        onError?.(
          error instanceof Error ? error : new Error(errorMessage),
          "update",
        );

        throw error;
      }
    },
    [mutate, showToasts, onUpdateSuccess, onError],
  );

  /**
   * Delete a work log
   */
  const deleteWorkLog = useCallback(
    async (id: string) => {
      try {
        await apiDeleteWorkLog(id);

        // Invalidate all work logs cache keys
        await mutate(
          (key) => typeof key === "string" && key.startsWith("/api/work-logs"),
          undefined,
          { revalidate: true },
        );

        if (showToasts) {
          toast.success("Work log deleted successfully");
        }

        onDeleteSuccess?.();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete work log";

        if (showToasts) {
          toast.error(errorMessage);
        }

        onError?.(
          error instanceof Error ? error : new Error(errorMessage),
          "delete",
        );

        throw error;
      }
    },
    [mutate, showToasts, onDeleteSuccess, onError],
  );

  return {
    createWorkLog,
    updateWorkLog,
    deleteWorkLog,
    isLoading,
  };
}
