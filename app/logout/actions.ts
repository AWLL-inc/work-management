"use server";

import { revalidatePath } from "next/cache";
import { signOut } from "@/lib/auth";

/**
 * Server action for handling logout
 * Destroys the session and clears server-side cache
 */
export async function logoutAction() {
  try {
    // 1. Sign out the user (destroys session and clears cookies)
    await signOut({
      redirect: false, // Manual redirect control
    });

    // 2. Invalidate server-side cache for all pages
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return {
      success: false,
      error: "An error occurred during logout",
    };
  }
}
