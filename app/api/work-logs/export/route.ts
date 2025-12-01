import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { teamMembers } from "@/drizzle/schema";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";
import {
  type GetWorkLogsOptions,
  getWorkLogs,
} from "@/lib/db/repositories/work-log-repository";
import {
  parseUrlDate,
  parseUrlUUID,
  parseUrlUUIDs,
} from "@/lib/utils/url-validation";

/**
 * CSV Export API Endpoint
 * Exports work logs matching search criteria to CSV format
 *
 * GET /api/work-logs/export
 *
 * Query Parameters:
 * - from: string (YYYY-MM-DD) - Start date (required)
 * - to: string (YYYY-MM-DD) - End date (required)
 * - scope: "own" | "team" | "all" - Data scope (default: "own")
 * - projects: string - Comma-separated project UUIDs (optional)
 * - categories: string - Comma-separated category UUIDs (optional)
 * - userId: string - User UUID for scope=user (optional)
 *
 * Response:
 * - Content-Type: text/csv; charset=utf-8
 * - Content-Disposition: attachment; filename="work-logs-YYYY-MM-DD_YYYY-MM-DD.csv"
 * - Body: UTF-8 BOM + CSV content
 */
export async function GET(request: Request) {
  try {
    // Authentication check
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 },
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const scope = (searchParams.get("scope") || "own") as
      | "own"
      | "team"
      | "all";
    const projectIdsParam = searchParams.get("projects");
    const categoryIdsParam = searchParams.get("categories");
    const filterUserId = searchParams.get("userId");

    // Validation: Date range is required
    if (!fromParam || !toParam) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Start date and end date are required" },
        },
        { status: 400 },
      );
    }

    // Parse and validate dates
    const startDate = parseUrlDate(fromParam);
    const endDate = parseUrlDate(toParam);

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Invalid date format. Use YYYY-MM-DD" },
        },
        { status: 400 },
      );
    }

    // Validation: Date range cannot exceed 31 days
    const daysDifference = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysDifference > 31) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Date range cannot exceed 31 days (1 month)" },
        },
        { status: 400 },
      );
    }

    // Validation: Start date must be before or equal to end date
    if (startDate > endDate) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Start date must be before or equal to end date" },
        },
        { status: 400 },
      );
    }

    // Build query options
    const options: GetWorkLogsOptions = {
      startDate,
      endDate,
      projectIds: parseUrlUUIDs(projectIdsParam) ?? undefined,
      categoryIds: parseUrlUUIDs(categoryIdsParam) ?? undefined,
      userId: parseUrlUUID(filterUserId),
      limit: 10000, // Large limit to get all matching records
      page: 1,
    };

    // Apply scope-based filtering (unless userId filter is specified)
    if (!filterUserId) {
      if (scope === "all") {
        // Admin can view all work logs
        if (session.user.role !== "admin") {
          return NextResponse.json(
            {
              success: false,
              error: {
                message:
                  "Forbidden: Only admins can export all users' work logs",
              },
            },
            { status: 403 },
          );
        }
        // No user filter - show all users' logs
        delete options.userId;
      } else if (scope === "team") {
        // Get user's teams
        const userTeams = await db
          .select({ teamId: teamMembers.teamId })
          .from(teamMembers)
          .where(eq(teamMembers.userId, session.user.id));

        if (userTeams.length > 0) {
          const teamIds = userTeams.map((tm) => tm.teamId);

          // Get all team members
          const allMembers = await db
            .select({ userId: teamMembers.userId })
            .from(teamMembers)
            .where(inArray(teamMembers.teamId, teamIds));

          // Include current user and deduplicate
          const uniqueTeammateIds = Array.from(
            new Set([session.user.id, ...allMembers.map((m) => m.userId)]),
          );

          options.userIds = uniqueTeammateIds;
          delete options.userId;
        } else {
          // User not in any team, show only own work logs
          options.userId = session.user.id;
        }
      } else {
        // scope === "own" (default)
        options.userId = session.user.id;
      }
    } else {
      // Validation: If userId is specified, only admin can export other users' data
      if (filterUserId !== session.user.id && session.user.role !== "admin") {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: "Forbidden: You can only export your own work logs",
            },
          },
          { status: 403 },
        );
      }
    }

    // Fetch work logs
    const workLogsResult = await getWorkLogs(options);
    const workLogs = workLogsResult.data;

    // Generate CSV content
    const BOM = "\uFEFF"; // UTF-8 BOM for Excel compatibility
    const headers = [
      "日付",
      "ユーザー",
      "工数",
      "プロジェクト",
      "カテゴリ",
      "詳細",
    ];
    const csvRows = [headers.join(",")];

    // Add data rows
    for (const log of workLogs) {
      const row = [
        escapeCsvValue(formatDateForCsv(log.date)),
        escapeCsvValue(log.user.name || log.user.email),
        escapeCsvValue(log.hours),
        escapeCsvValue(log.project.name),
        escapeCsvValue(log.category.name),
        escapeCsvValue(log.details),
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = BOM + csvRows.join("\n");

    // Generate filename with date range
    const fromDate = startDate.toISOString().split("T")[0];
    const toDate = endDate.toISOString().split("T")[0];
    const filename = `work-logs-${fromDate}_${toDate}.csv`;

    // Return CSV response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Failed to export CSV",
        },
      },
      { status: 500 },
    );
  }
}

/**
 * Escapes CSV special characters and wraps value in quotes if needed
 */
function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Formats a date for CSV export
 */
function formatDateForCsv(date: Date | string): string {
  if (date instanceof Date) {
    return date.toISOString().split("T")[0];
  }
  if (typeof date === "string") {
    return date.split("T")[0];
  }
  return String(date);
}
