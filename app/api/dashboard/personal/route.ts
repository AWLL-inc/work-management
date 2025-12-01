import { type NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { getPersonalStats } from "@/lib/db/repositories/dashboard-repository";

// Use Node.js runtime for database operations
export const runtime = "nodejs";

// Query parameter schema
const personalStatsSchema = z.object({
  period: z
    .enum(["today", "week", "month", "lastWeek", "lastMonth", "custom"])
    .optional()
    .default("today"),
  scope: z.enum(["own", "all", "user"]).optional().default("own"),
  userId: z.string().uuid().optional(),
  startDate: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (!val) return undefined;
      const date = new Date(val);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid date format for startDate",
        });
        return z.NEVER;
      }
      return date;
    }),
  endDate: z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (!val) return undefined;
      const date = new Date(val);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid date format for endDate",
        });
        return z.NEVER;
      }
      return date;
    }),
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
      scope: searchParams.get("scope") || undefined,
      userId: searchParams.get("userId") || undefined,
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

    // Validate scope - only admins can view all users' or specific user's data
    const scope = validatedParams.scope;
    if (
      (scope === "all" || scope === "user") &&
      session.user.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only admins can view other users' statistics",
          },
        },
        { status: 403 },
      );
    }

    // Validate userId is provided when scope is "user"
    if (scope === "user" && !validatedParams.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "userId is required when scope is 'user'",
          },
        },
        { status: 400 },
      );
    }

    // Determine the target userId based on scope
    let targetUserId: string | undefined;
    if (scope === "all") {
      targetUserId = undefined; // All users
    } else if (scope === "user") {
      targetUserId = validatedParams.userId; // Specific user
    } else {
      targetUserId = session.user.id; // Own data
    }

    // Get personal statistics
    const stats = await getPersonalStats({
      userId: targetUserId,
      scope,
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
