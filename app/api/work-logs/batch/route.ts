import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import {
  batchUpdateWorkLogs,
  isWorkLogOwner,
} from "@/lib/db/repositories/work-log-repository";
import { batchUpdateWorkLogsSchema } from "@/lib/validations";

// Use Node.js runtime for database operations
export const runtime = "nodejs";

/**
 * PUT /api/work-logs/batch
 * Batch update work logs
 * @requires Authentication
 */
export async function PUT(request: NextRequest) {
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
    const updates = batchUpdateWorkLogsSchema.parse(body);

    // Check permissions for each work log
    if (session.user.role !== "admin") {
      const ownershipChecks = await Promise.all(
        updates.map(({ id }) => isWorkLogOwner(id, session.user.id))
      );

      if (ownershipChecks.some((isOwner) => !isOwner)) {
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

    // Transform the update data
    const batchUpdates = updates.map(({ id, data }) => {
      const updateData: Record<string, unknown> = {};
      
      if (data.date !== undefined) {
        updateData.date = typeof data.date === "string" ? new Date(data.date) : data.date;
      }
      if (data.hours !== undefined) {
        updateData.hours = data.hours;
      }
      if (data.projectId !== undefined) {
        updateData.projectId = data.projectId;
      }
      if (data.categoryId !== undefined) {
        updateData.categoryId = data.categoryId;
      }
      if (data.details !== undefined) {
        updateData.details = data.details;
      }

      return { id, data: updateData };
    });

    // Perform batch update in transaction
    const results = await batchUpdateWorkLogs(batchUpdates);

    return NextResponse.json(
      {
        success: true,
        data: results,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[PUT /api/work-logs/batch] Error:", error);

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
          message: "An error occurred while updating work logs",
          ...(process.env.NODE_ENV === "development" && {
            details: error instanceof Error ? error.message : String(error),
          }),
        },
      },
      { status: 500 },
    );
  }
}