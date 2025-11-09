import { type NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import {
  createUser,
  getAllUsers,
  getUserByEmail,
} from "@/lib/db/repositories/user-repository";
import { emailService } from "@/lib/services/email";
import { generateSecurePassword, hashPassword } from "@/lib/utils/password";

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
 * Request body schema for POST /api/users
 */
const createUserBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "manager", "user"]).default("user"),
  sendEmail: z.boolean().optional().default(true),
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
      activeOnly: searchParams.get("activeOnly") || undefined,
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

/**
 * Create a new user with temporary password
 * @description Admin/Manager creates a new user account with auto-generated password
 * @request CreateUserBodySchema
 * @response 201:ApiSuccessResponseSchema:Successfully created user
 * @responseDescription User object with temporary password (only shown once)
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

    // Check authorization (Admin or Manager only)
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only administrators and managers can create users",
          },
        },
        { status: 403 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createUserBodySchema.safeParse(body);

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

    const { name, email, role, sendEmail } = validatedData.data;

    // Check if user with email already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "A user with this email address already exists",
          },
        },
        { status: 409 },
      );
    }

    // Generate secure temporary password
    const temporaryPassword = generateSecurePassword(16);
    const passwordHash = await hashPassword(temporaryPassword);

    // Create user with password reset required
    const newUser = await createUser({
      name,
      email,
      role,
      passwordHash,
      passwordResetRequired: true,
      lastPasswordChange: new Date(),
    });

    // Send welcome email with temporary password (if requested)
    if (sendEmail) {
      try {
        await emailService.sendWelcomeEmail(
          email,
          name,
          email,
          temporaryPassword,
        );
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Continue even if email fails - user is already created
      }
    }

    // Return user data with temporary password (only time it's shown)
    return NextResponse.json(
      {
        success: true,
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          temporaryPassword, // Only shown in this response
          passwordResetRequired: newUser.passwordResetRequired,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/users] Error:", error);

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
          message: "An error occurred while creating user",
        },
      },
      { status: 500 },
    );
  }
}
