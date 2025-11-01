import { type NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { getPersonalStats } from "@/lib/db/repositories/dashboard-repository";

// Use Node.js runtime for database operations
export const runtime = "nodejs";

// Query parameter schema
const personalStatsSchema = z.object({
  period: z.enum(["today", "week", "month", "custom"]).optional().default("today"),
  startDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  endDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
});

/**
 * GET /api/dashboard/personal
 * Get personal work statistics
 * @requires Authentication
 */
export async function GET(request: NextRequest) {
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);

    const validationResult = personalStatsSchema.safeParse({
      period: searchParams.get("period") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: validationResult.error.issues,
          },
        },
        { status: 400 },
      );
    }

    const validatedParams = validationResult.data;

    // Validate custom period
    if (validatedParams.period === "custom") {
      if (!validatedParams.startDate || !validatedParams.endDate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Start and end dates are required for custom period",
            },
          },
          { status: 400 },
        );
      }
    }

    // Get personal statistics
    const stats = await getPersonalStats({
      userId: session.user.id,
      period: validatedParams.period,
      startDate: validatedParams.startDate,
      endDate: validatedParams.endDate,
    });

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET /api/dashboard/personal] Error:", error);

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
          message: "An error occurred while fetching personal statistics",
          ...(process.env.NODE_ENV === "development" && {
            details: error instanceof Error ? error.message : String(error),
          }),
        },
      },
      { status: 500 },
    );
  }
}
