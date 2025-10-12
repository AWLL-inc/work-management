import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";
import {
  deleteWorkLog,
  getWorkLogById,
  isWorkLogOwner,
  updateWorkLog,
} from "@/lib/db/repositories/work-log-repository";
import { updateWorkLogSchema } from "@/lib/validations";

// Use Node.js runtime for database operations
export const runtime = "nodejs";

/**
 * PUT /api/work-logs/[id]
 * Update a work log
 * @requires Authentication
 * @requires Ownership or Admin role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check if authentication is disabled for development
    const isDevelopmentMode = process.env.NODE_ENV === "development";
    const isAuthDisabled = process.env.DISABLE_AUTH === "true";

    let session = null;
    if (isDevelopmentMode && isAuthDisabled) {
      // Skip authentication in development mode when DISABLE_AUTH=true
      session = { user: { id: "00000000-0000-0000-0000-000000000000", role: "admin" } };
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

    const { id } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ID",
            message: "Invalid work log ID format",
          },
        },
        { status: 400 },
      );
    }

    // Check if work log exists
    const existingLog = await getWorkLogById(id);
    if (!existingLog) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Work log not found",
          },
        },
        { status: 404 },
      );
    }

    // Check ownership (non-admin users can only update their own logs)
    if (session.user.role !== "admin") {
      const isOwner = await isWorkLogOwner(id, session.user.id);
      if (!isOwner) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "You can only update your own work logs",
            },
          },
          { status: 403 },
        );
      }
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateWorkLogSchema.parse(body);

    // Convert date string to Date object if provided
    const updateData: Record<string, unknown> = { ...validatedData };
    if (validatedData.date) {
      updateData.date =
        typeof validatedData.date === "string"
          ? new Date(validatedData.date)
          : validatedData.date;
    }

    // Update work log
    const updatedLog = await updateWorkLog(id, updateData);

    return NextResponse.json(
      {
        success: true,
        data: updatedLog,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(`[PUT /api/work-logs/${(await params).id}] Error:`, error);

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
          message: "An error occurred while updating the work log",
        },
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/work-logs/[id]
 * Delete a work log
 * @requires Authentication
 * @requires Ownership or Admin role
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Check if authentication is disabled for development
    const isDevelopmentMode = process.env.NODE_ENV === "development";
    const isAuthDisabled = process.env.DISABLE_AUTH === "true";

    let session = null;
    if (isDevelopmentMode && isAuthDisabled) {
      // Skip authentication in development mode when DISABLE_AUTH=true
      session = { user: { id: "00000000-0000-0000-0000-000000000000", role: "admin" } };
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

    const { id } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ID",
            message: "Invalid work log ID format",
          },
        },
        { status: 400 },
      );
    }

    // Check if work log exists
    const existingLog = await getWorkLogById(id);
    if (!existingLog) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Work log not found",
          },
        },
        { status: 404 },
      );
    }

    // Check ownership (non-admin users can only delete their own logs)
    if (session.user.role !== "admin") {
      const isOwner = await isWorkLogOwner(id, session.user.id);
      if (!isOwner) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "You can only delete your own work logs",
            },
          },
          { status: 403 },
        );
      }
    }

    // Delete work log
    await deleteWorkLog(id);

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(`[DELETE /api/work-logs/${(await params).id}] Error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while deleting the work log",
        },
      },
      { status: 500 },
    );
  }
}
