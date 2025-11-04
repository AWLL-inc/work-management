import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import { getAllUsers } from "@/lib/db/repositories/user-repository";

// Use Node.js runtime for database operations
export const runtime = "nodejs";

/**
 * List all users
 * @description Retrieve a list of all users (without sensitive information like password hashes)
 * @response 200:ApiSuccessResponseSchema:Successfully retrieved users list
 * @responseDescription Array of user objects (without password hashes)
 * @auth bearer
 * @openapi
 */
export async function GET(_request: NextRequest) {
  try {
    // Check if authentication is disabled for development
    const isDevelopmentMode = process.env.NODE_ENV === "development";
    const isAuthDisabled = process.env.DISABLE_AUTH === "true";

    let session = null;
    if (isDevelopmentMode && isAuthDisabled) {
      // Skip authentication in development mode when DISABLE_AUTH=true
      session = { user: { id: "dev-user", role: "admin" } };
    } else {
      // Check authentication
      session = await auth();
      if (!session?.user) {
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
    }

    // Get all users from repository
    const usersList = await getAllUsers();

    // Remove sensitive information (password hashes) before sending response
    const sanitizedUsers = usersList.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return NextResponse.json(
      {
        success: true,
        data: sanitizedUsers,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/users] Error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
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
          message: "An error occurred while fetching users",
        },
      },
      { status: 500 },
    );
  }
}
