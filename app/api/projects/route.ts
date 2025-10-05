import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import {
  createProject,
  getAllProjects,
  projectNameExists,
} from "@/lib/db/repositories/project-repository";
import {
  createProjectSchema,
  listProjectsQuerySchema,
} from "@/lib/validations";

// Use Node.js runtime for database operations
export const runtime = "nodejs";

/**
 * GET /api/projects
 * Get all projects
 * @requires Authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const { active } = listProjectsQuerySchema.parse(queryParams);

    // Get projects from repository
    const projectsList = await getAllProjects({
      activeOnly: active,
    });

    return NextResponse.json(
      {
        success: true,
        data: projectsList,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/projects] Error:", error);

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
          message: "An error occurred while fetching projects",
        },
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 * @requires Authentication
 * @requires Admin role
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
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

    // Check admin role
    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Admin role required",
          },
        },
        { status: 403 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    // Check for duplicate name
    const nameExists = await projectNameExists(validatedData.name);
    if (nameExists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_NAME",
            message: "A project with this name already exists",
          },
        },
        { status: 400 },
      );
    }

    // Create project
    const project = await createProject(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: project,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/projects] Error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
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
          message: "An error occurred while creating the project",
        },
      },
      { status: 500 },
    );
  }
}
