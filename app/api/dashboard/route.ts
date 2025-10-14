import { and, eq, gte, lte, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { projects, users, workLogs } from "@/drizzle/schema";
import { getAuthenticatedSession } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";

const dashboardQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD")
    .optional(),
  view: z.enum(["user", "project"]).default("user"),
});

export type DashboardQueryParams = z.infer<typeof dashboardQuerySchema>;

interface DashboardUserData {
  date: string;
  userId: string;
  userName: string;
  hours: number;
}

interface DashboardProjectData {
  date: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  hours: number;
}

interface DashboardResponse {
  view: "user" | "project";
  dateRange: {
    startDate: string;
    endDate: string;
  };
  data: DashboardUserData[] | DashboardProjectData[];
  summary: {
    totalHours: number;
    totalDays: number;
    averageHoursPerDay: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      view: searchParams.get("view") || "user",
    };

    const validatedParams = dashboardQuerySchema.parse(queryParams);

    // Set default date range if not provided (last 7 days)
    const endDate = validatedParams.endDate
      ? new Date(validatedParams.endDate)
      : new Date();
    const startDate = validatedParams.startDate
      ? new Date(validatedParams.startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Ensure dates are at start/end of day
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const isAdmin = session.user.role === "admin";

    // Build where conditions
    const whereConditions = [
      gte(workLogs.date, startDate),
      lte(workLogs.date, endDate),
    ];

    if (!isAdmin) {
      whereConditions.push(eq(workLogs.userId, session.user.id));
    }

    if (validatedParams.view === "user") {
      // User view: aggregate by date and user
      const userViewData = await db
        .select({
          date: sql<string>`to_char(${workLogs.date}, 'YYYY-MM-DD')`.as("date"),
          userId: workLogs.userId,
          userName: users.name,
          hours: sql<number>`sum(${workLogs.hours}::numeric)`.as("hours"),
        })
        .from(workLogs)
        .innerJoin(users, eq(workLogs.userId, users.id))
        .where(and(...whereConditions))
        .groupBy(
          sql`to_char(${workLogs.date}, 'YYYY-MM-DD')`,
          workLogs.userId,
          users.name,
        )
        .orderBy(sql`to_char(${workLogs.date}, 'YYYY-MM-DD')`, users.name);

      const totalHours = userViewData.reduce(
        (sum, item) => sum + Number(item.hours),
        0,
      );
      const uniqueDates = new Set(userViewData.map((item) => item.date)).size;

      const response: DashboardResponse = {
        view: "user",
        dateRange: {
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        },
        data: userViewData as DashboardUserData[],
        summary: {
          totalHours,
          totalDays: uniqueDates,
          averageHoursPerDay: uniqueDates > 0 ? totalHours / uniqueDates : 0,
        },
      };

      return NextResponse.json({ success: true, data: response });
    } else {
      // Project view: aggregate by date, project, and user
      const projectViewData = await db
        .select({
          date: sql<string>`to_char(${workLogs.date}, 'YYYY-MM-DD')`.as("date"),
          projectId: workLogs.projectId,
          projectName: projects.name,
          userId: workLogs.userId,
          userName: users.name,
          hours: sql<number>`sum(${workLogs.hours}::numeric)`.as("hours"),
        })
        .from(workLogs)
        .innerJoin(users, eq(workLogs.userId, users.id))
        .innerJoin(projects, eq(workLogs.projectId, projects.id))
        .where(and(...whereConditions))
        .groupBy(
          sql`to_char(${workLogs.date}, 'YYYY-MM-DD')`,
          workLogs.projectId,
          projects.name,
          workLogs.userId,
          users.name,
        )
        .orderBy(
          sql`to_char(${workLogs.date}, 'YYYY-MM-DD')`,
          projects.name,
          users.name,
        );

      const totalHours = projectViewData.reduce(
        (sum, item) => sum + Number(item.hours),
        0,
      );
      const uniqueDates = new Set(projectViewData.map((item) => item.date))
        .size;

      const response: DashboardResponse = {
        view: "project",
        dateRange: {
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        },
        data: projectViewData as DashboardProjectData[],
        summary: {
          totalHours,
          totalDays: uniqueDates,
          averageHoursPerDay: uniqueDates > 0 ? totalHours / uniqueDates : 0,
        },
      };

      return NextResponse.json({ success: true, data: response });
    }
  } catch (error) {
    console.error("[GET /api/dashboard] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request parameters",
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
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch dashboard data",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 },
    );
  }
}
