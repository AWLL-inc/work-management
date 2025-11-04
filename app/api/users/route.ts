import { type NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { getAllUsers } from "@/lib/db/repositories/user-repository";

// Use Node.js runtime for database operations with Drizzle ORM
// Edge runtime does not support all Drizzle ORM features required for database operations
export const runtime = "nodejs";

/**
 * Query parameters schema for GET /api/users
 */
const getUsersQuerySchema = z.object({
  activeOnly: z.enum(["true", "false"]).optional(),
});

/**
 * List all users
 * @description Retrieve a list of all users (without sensitive information like password hashes)
 * @response 200:ApiSuccessResponseSchema:Successfully retrieved users list
 * @responseDescription Array of user objects (without password hashes)
 * @auth bearer
 * @openapi
 */
export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      activeOnly: searchParams.get("activeOnly"),
    };

    const validatedParams = getUsersQuerySchema.safeParse(queryParams);
    if (!validatedParams.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: validatedParams.error.issues,
          },
        },
        { status: 400 },
      );
    }

    // Check authentication using helper
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

    // Parse activeOnly parameter
    const activeOnly = validatedParams.data.activeOnly === "true";

    // Get users from repository
    const usersList = await getAllUsers({ activeOnly });

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
