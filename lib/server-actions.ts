/**
 * Server Actions utilities for type-safe error handling
 * Following 2025 best practices for Next.js 15
 */

export type ServerActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Wraps a server action with standardized error handling
 * @param action The async function to execute
 * @returns A Result object with success/error state
 */
export async function wrapServerAction<T>(
  action: () => Promise<T>,
): Promise<ServerActionResult<T>> {
  try {
    const data = await action();
    return { success: true, data };
  } catch (error) {
    console.error("Server action error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}
