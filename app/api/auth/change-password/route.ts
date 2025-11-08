import { type NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { getUserById, updateUser } from "@/lib/db/repositories/user-repository";
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "@/lib/utils/password";

// Use Node.js runtime for database operations
export const runtime = "nodejs";

/**
 * Request body schema for POST /api/auth/change-password
 */
const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

/**
 * Change password for authenticated user
 * @description User changes their own password after authentication
 * @request ChangePasswordBodySchema
 * @response 200:ApiSuccessResponseSchema:Password successfully changed
 * @responseDescription User password has been updated
 * @auth bearer
 * @openapi
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = changePasswordBodySchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: validatedData.error.issues,
          },
        },
        { status: 400 },
      );
    }

    const { currentPassword, newPassword } = validatedData.data;

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "WEAK_PASSWORD",
            message: "New password does not meet security requirements",
            details: passwordValidation.errors,
          },
        },
        { status: 400 },
      );
    }

    // Get user from database (including password hash)
    const user = await getUserById(session.user.id);
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User account not found",
          },
        },
        { status: 404 },
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PASSWORD",
            message: "Current password is incorrect",
          },
        },
        { status: 400 },
      );
    }

    // Check if new password is same as current password
    const isSamePassword = await verifyPassword(newPassword, user.passwordHash);
    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SAME_PASSWORD",
            message: "New password must be different from current password",
          },
        },
        { status: 400 },
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update user password and clear passwordResetRequired flag
    await updateUser(user.id, {
      passwordHash: newPasswordHash,
      passwordResetRequired: false,
      lastPasswordChange: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Password has been successfully changed",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[POST /api/auth/change-password] Error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: error.issues,
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while changing password",
        },
      },
      { status: 500 },
    );
  }
}
