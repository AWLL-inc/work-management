import { type NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import {
  getUserByEmail,
  updateUser,
} from "@/lib/db/repositories/user-repository";
import { emailService } from "@/lib/services/email";
import { generateResetToken, hashResetToken } from "@/lib/utils/password";

// Use Node.js runtime for database operations
export const runtime = "nodejs";

/**
 * Request body schema for POST /api/auth/forgot-password
 */
const forgotPasswordBodySchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * Request password reset
 * @description Send password reset email to user
 * @request ForgotPasswordBodySchema
 * @response 200:ApiSuccessResponseSchema:Password reset email sent
 * @responseDescription Always returns success to prevent email enumeration
 * @openapi
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = forgotPasswordBodySchema.safeParse(body);

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

    const { email } = validatedData.data;

    // Find user by email
    const user = await getUserByEmail(email);

    // Always return success to prevent email enumeration attacks
    // This is a security best practice
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json(
        {
          success: true,
          message:
            "If an account with that email exists, a password reset link has been sent",
        },
        { status: 200 },
      );
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const hashedToken = hashResetToken(resetToken);

    // Set token expiration (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Update user with reset token
    await updateUser(user.id, {
      passwordResetToken: hashedToken,
      passwordResetTokenExpires: expiresAt,
    });

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        user.name || "User",
        resetToken,
      );
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Continue even if email fails - token is still stored
    }

    // Always return success message (security best practice)
    return NextResponse.json(
      {
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[POST /api/auth/forgot-password] Error:", error);

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
          message: "An error occurred while processing your request",
        },
      },
      { status: 500 },
    );
  }
}
