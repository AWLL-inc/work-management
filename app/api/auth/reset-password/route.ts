import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { users } from "@/drizzle/schema";
import { db } from "@/lib/db/connection";
import { updateUser } from "@/lib/db/repositories/user-repository";
import {
  hashPassword,
  hashResetToken,
  validatePasswordStrength,
} from "@/lib/utils/password";

// Use Node.js runtime for database operations
export const runtime = "nodejs";

/**
 * Request body schema for POST /api/auth/reset-password
 */
const resetPasswordBodySchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Reset password with token
 * @description Reset user password using valid reset token
 * @request ResetPasswordBodySchema
 * @response 200:ApiSuccessResponseSchema:Password successfully reset
 * @responseDescription User can now login with new password
 * @openapi
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = resetPasswordBodySchema.safeParse(body);

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

    const { token, newPassword } = validatedData.data;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "WEAK_PASSWORD",
            message: "Password does not meet security requirements",
            details: passwordValidation.errors,
          },
        },
        { status: 400 },
      );
    }

    // Hash the token to compare with stored hash
    const hashedToken = hashResetToken(token);

    // Find user with matching token and valid expiration
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, hashedToken))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid or expired reset token",
          },
        },
        { status: 400 },
      );
    }

    // Check if token is expired
    if (
      !user.passwordResetTokenExpires ||
      user.passwordResetTokenExpires < new Date()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EXPIRED_TOKEN",
            message: "Reset token has expired. Please request a new one",
          },
        },
        { status: 400 },
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update user: set new password, clear reset token, clear passwordResetRequired flag
    await updateUser(user.id, {
      passwordHash: newPasswordHash,
      passwordResetToken: null,
      passwordResetTokenExpires: null,
      passwordResetRequired: false,
      lastPasswordChange: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Password has been successfully reset. You can now login.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[POST /api/auth/reset-password] Error:", error);

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
          message: "An error occurred while resetting password",
        },
      },
      { status: 500 },
    );
  }
}
