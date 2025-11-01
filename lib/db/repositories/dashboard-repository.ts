import { type SQL, and, between, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db/connection";
import { projects, users, workCategories, workLogs } from "@/drizzle/schema";

/**
 * Dashboard Repository
 * Handles all dashboard statistics queries with optimized aggregations
 */

// Helper function to get week boundaries (Monday to Sunday)
function getWeekBoundaries(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

// Helper function to get month boundaries
function getMonthBoundaries(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get personal dashboard statistics
 */
export async function getPersonalStats(options: {
  userId: string;
  period?: "today" | "week" | "month" | "custom";
  startDate?: Date;
  endDate?: Date;
}) {
  const { userId, period = "today", startDate, endDate } = options;
  const now = new Date();

  // Determine date ranges
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const week = getWeekBoundaries(now);
  const month = getMonthBoundaries(now);

  // Period-specific range
  let periodStart: Date;
  let periodEnd: Date;

  switch (period) {
    case "today":
      periodStart = today;
      periodEnd = todayEnd;
      break;
    case "week":
      periodStart = week.start;
      periodEnd = week.end;
      break;
    case "month":
      periodStart = month.start;
      periodEnd = month.end;
      break;
    case "custom":
      if (!startDate || !endDate) {
        throw new Error("Start and end dates are required for custom period");
      }
      periodStart = startDate;
      periodEnd = endDate;
      break;
  }

  // Summary statistics
  const [todaySummary] = await db
    .select({
      totalHours: sql<string>`COALESCE(SUM(CAST(${workLogs.hours} AS DECIMAL)), 0)::text`,
      logCount: sql<number>`COUNT(*)::int`,
    })
    .from(workLogs)
    .where(and(eq(workLogs.userId, userId), between(workLogs.date, today, todayEnd)));

  const [weekSummary] = await db
    .select({
      totalHours: sql<string>`COALESCE(SUM(CAST(${workLogs.hours} AS DECIMAL)), 0)::text`,
      logCount: sql<number>`COUNT(*)::int`,
    })
    .from(workLogs)
    .where(and(eq(workLogs.userId, userId), between(workLogs.date, week.start, week.end)));

  const [monthSummary] = await db
    .select({
      totalHours: sql<string>`COALESCE(SUM(CAST(${workLogs.hours} AS DECIMAL)), 0)::text`,
      logCount: sql<number>`COUNT(*)::int`,
    })
    .from(workLogs)
    .where(and(eq(workLogs.userId, userId), between(workLogs.date, month.start, month.end)));

  // By Project (for selected period)
  const [periodTotal] = await db
    .select({
      total: sql<string>`COALESCE(SUM(CAST(${workLogs.hours} AS DECIMAL)), 0)::text`,
    })
    .from(workLogs)
    .where(and(eq(workLogs.userId, userId), between(workLogs.date, periodStart, periodEnd)));

  const totalHours = Number.parseFloat(periodTotal?.total || "0");

  const byProject = await db
    .select({
      projectId: workLogs.projectId,
      projectName: projects.name,
      totalHours: sql<string>`SUM(CAST(${workLogs.hours} AS DECIMAL))::text`,
      logCount: sql<number>`COUNT(*)::int`,
    })
    .from(workLogs)
    .innerJoin(projects, eq(workLogs.projectId, projects.id))
    .where(and(eq(workLogs.userId, userId), between(workLogs.date, periodStart, periodEnd)))
    .groupBy(workLogs.projectId, projects.name)
    .orderBy(sql`SUM(CAST(${workLogs.hours} AS DECIMAL)) DESC`);

  const byProjectWithPercentage = byProject.map((project) => ({
    ...project,
    percentage: totalHours > 0 ? (Number.parseFloat(project.totalHours) / totalHours) * 100 : 0,
  }));

  // By Category (for selected period)
  const byCategory = await db
    .select({
      categoryId: workLogs.categoryId,
      categoryName: workCategories.name,
      totalHours: sql<string>`SUM(CAST(${workLogs.hours} AS DECIMAL))::text`,
      logCount: sql<number>`COUNT(*)::int`,
    })
    .from(workLogs)
    .innerJoin(workCategories, eq(workLogs.categoryId, workCategories.id))
    .where(and(eq(workLogs.userId, userId), between(workLogs.date, periodStart, periodEnd)))
    .groupBy(workLogs.categoryId, workCategories.name)
    .orderBy(sql`SUM(CAST(${workLogs.hours} AS DECIMAL)) DESC`);

  const byCategoryWithPercentage = byCategory.map((category) => ({
    ...category,
    percentage: totalHours > 0 ? (Number.parseFloat(category.totalHours) / totalHours) * 100 : 0,
  }));

  // Recent logs (last 10)
  const recentLogs = await db
    .select({
      id: workLogs.id,
      date: workLogs.date,
      hours: workLogs.hours,
      projectName: projects.name,
      categoryName: workCategories.name,
    })
    .from(workLogs)
    .innerJoin(projects, eq(workLogs.projectId, projects.id))
    .innerJoin(workCategories, eq(workLogs.categoryId, workCategories.id))
    .where(eq(workLogs.userId, userId))
    .orderBy(sql`${workLogs.date} DESC, ${workLogs.createdAt} DESC`)
    .limit(10);

  // Daily trend for the selected period
  const dailyTrend = await db
    .select({
      date: workLogs.date,
      totalHours: sql<string>`SUM(CAST(${workLogs.hours} AS DECIMAL))::text`,
    })
    .from(workLogs)
    .where(and(eq(workLogs.userId, userId), between(workLogs.date, periodStart, periodEnd)))
    .groupBy(workLogs.date)
    .orderBy(workLogs.date);

  return {
    summary: {
      today: {
        totalHours: todaySummary?.totalHours || "0",
        logCount: todaySummary?.logCount || 0,
      },
      thisWeek: {
        totalHours: weekSummary?.totalHours || "0",
        logCount: weekSummary?.logCount || 0,
        weekStart: week.start.toISOString().split("T")[0],
        weekEnd: week.end.toISOString().split("T")[0],
      },
      thisMonth: {
        totalHours: monthSummary?.totalHours || "0",
        logCount: monthSummary?.logCount || 0,
        monthStart: month.start.toISOString().split("T")[0],
        monthEnd: month.end.toISOString().split("T")[0],
      },
    },
    byProject: byProjectWithPercentage,
    byCategory: byCategoryWithPercentage,
    recentLogs: recentLogs.map((log) => ({
      ...log,
      date: log.date.toISOString().split("T")[0],
    })),
    trend: {
      daily: dailyTrend.map((item) => ({
        date: item.date.toISOString().split("T")[0],
        totalHours: item.totalHours,
      })),
    },
  };
}

/**
 * Get project statistics
 */
export async function getProjectStats(options: {
  userId?: string;
  userIds?: string[];
  period?: "today" | "week" | "month" | "custom";
  startDate?: Date;
  endDate?: Date;
  projectId?: string;
  scope?: "own" | "team" | "all";
}) {
  const { userId, userIds, period = "week", startDate, endDate, projectId, scope = "own" } = options;
  const now = new Date();

  // Determine date range
  let periodStart: Date;
  let periodEnd: Date;

  switch (period) {
    case "today": {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      periodStart = today;
      periodEnd = new Date(today);
      periodEnd.setHours(23, 59, 59, 999);
      break;
    }
    case "week": {
      const week = getWeekBoundaries(now);
      periodStart = week.start;
      periodEnd = week.end;
      break;
    }
    case "month": {
      const month = getMonthBoundaries(now);
      periodStart = month.start;
      periodEnd = month.end;
      break;
    }
    case "custom":
      if (!startDate || !endDate) {
        throw new Error("Start and end dates are required for custom period");
      }
      periodStart = startDate;
      periodEnd = endDate;
      break;
  }

  // Build user filter condition
  let userCondition: SQL | undefined;
  if (userIds && userIds.length > 0) {
    userCondition = sql`${workLogs.userId} = ANY(ARRAY[${sql.raw(userIds.map((id) => `'${id}'`).join(","))}]::uuid[])`;
  } else if (userId) {
    userCondition = eq(workLogs.userId, userId);
  } else if (scope !== "all") {
    throw new Error("User ID or User IDs are required when scope is not 'all'");
  }

  // Build WHERE clause
  const whereConditions = [between(workLogs.date, periodStart, periodEnd)];
  if (userCondition) {
    whereConditions.push(userCondition);
  }
  if (projectId) {
    whereConditions.push(eq(workLogs.projectId, projectId));
  }

  // Get project statistics
  const projectsData = await db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      projectDescription: projects.description,
      totalHours: sql<string>`SUM(CAST(${workLogs.hours} AS DECIMAL))::text`,
      logCount: sql<number>`COUNT(*)::int`,
    })
    .from(workLogs)
    .innerJoin(projects, eq(workLogs.projectId, projects.id))
    .where(and(...whereConditions))
    .groupBy(projects.id, projects.name, projects.description)
    .orderBy(sql`SUM(CAST(${workLogs.hours} AS DECIMAL)) DESC`);

  // For each project, get member and category breakdowns
  const projectsWithDetails = await Promise.all(
    projectsData.map(async (project) => {
      // By Member
      const memberConditions = [
        eq(workLogs.projectId, project.projectId),
        between(workLogs.date, periodStart, periodEnd),
      ];
      if (userCondition) {
        memberConditions.push(userCondition);
      }

      const byMember = await db
        .select({
          userId: users.id,
          userName: users.name,
          totalHours: sql<string>`SUM(CAST(${workLogs.hours} AS DECIMAL))::text`,
          logCount: sql<number>`COUNT(*)::int`,
        })
        .from(workLogs)
        .innerJoin(users, eq(workLogs.userId, users.id))
        .where(and(...memberConditions))
        .groupBy(users.id, users.name)
        .orderBy(sql`SUM(CAST(${workLogs.hours} AS DECIMAL)) DESC`);

      const memberCount = byMember.length;

      // By Category
      const projectTotal = Number.parseFloat(project.totalHours);
      const categoryConditions = [
        eq(workLogs.projectId, project.projectId),
        between(workLogs.date, periodStart, periodEnd),
      ];
      if (userCondition) {
        categoryConditions.push(userCondition);
      }

      const byCategory = await db
        .select({
          categoryId: workCategories.id,
          categoryName: workCategories.name,
          totalHours: sql<string>`SUM(CAST(${workLogs.hours} AS DECIMAL))::text`,
        })
        .from(workLogs)
        .innerJoin(workCategories, eq(workLogs.categoryId, workCategories.id))
        .where(and(...categoryConditions))
        .groupBy(workCategories.id, workCategories.name)
        .orderBy(sql`SUM(CAST(${workLogs.hours} AS DECIMAL)) DESC`);

      const byCategoryWithPercentage = byCategory.map((cat) => ({
        ...cat,
        percentage: projectTotal > 0 ? (Number.parseFloat(cat.totalHours) / projectTotal) * 100 : 0,
      }));

      // Daily trend
      const trendConditions = [
        eq(workLogs.projectId, project.projectId),
        between(workLogs.date, periodStart, periodEnd),
      ];
      if (userCondition) {
        trendConditions.push(userCondition);
      }

      const dailyTrend = await db
        .select({
          date: workLogs.date,
          totalHours: sql<string>`SUM(CAST(${workLogs.hours} AS DECIMAL))::text`,
        })
        .from(workLogs)
        .where(and(...trendConditions))
        .groupBy(workLogs.date)
        .orderBy(workLogs.date);

      return {
        ...project,
        memberCount,
        byMember,
        byCategory: byCategoryWithPercentage,
        trend: {
          daily: dailyTrend.map((item) => ({
            date: item.date.toISOString().split("T")[0],
            totalHours: item.totalHours,
          })),
        },
      };
    }),
  );

  // Summary
  const totalProjects = projectsWithDetails.length;
  const totalHours = projectsData.reduce((sum, p) => sum + Number.parseFloat(p.totalHours), 0).toString();
  const totalLogs = projectsData.reduce((sum, p) => sum + p.logCount, 0);

  return {
    projects: projectsWithDetails,
    summary: {
      totalProjects,
      totalHours,
      totalLogs,
    },
  };
}

/**
 * Get team statistics
 */
export async function getTeamStats(options: {
  teamId: string;
  period?: "today" | "week" | "month" | "custom";
  startDate?: Date;
  endDate?: Date;
  userIds: string[];
}) {
  const { teamId, period = "week", startDate, endDate, userIds } = options;
  const now = new Date();

  if (userIds.length === 0) {
    throw new Error("User IDs are required for team stats");
  }

  // Determine date range
  let periodStart: Date;
  let periodEnd: Date;

  switch (period) {
    case "today": {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      periodStart = today;
      periodEnd = new Date(today);
      periodEnd.setHours(23, 59, 59, 999);
      break;
    }
    case "week": {
      const week = getWeekBoundaries(now);
      periodStart = week.start;
      periodEnd = week.end;
      break;
    }
    case "month": {
      const month = getMonthBoundaries(now);
      periodStart = month.start;
      periodEnd = month.end;
      break;
    }
    case "custom":
      if (!startDate || !endDate) {
        throw new Error("Start and end dates are required for custom period");
      }
      periodStart = startDate;
      periodEnd = endDate;
      break;
  }

  const userCondition = sql`${workLogs.userId} = ANY(ARRAY[${sql.raw(userIds.map((id) => `'${id}'`).join(","))}]::uuid[])`;

  // Team summary
  const [summary] = await db
    .select({
      totalHours: sql<string>`COALESCE(SUM(CAST(${workLogs.hours} AS DECIMAL)), 0)::text`,
      totalLogs: sql<number>`COUNT(*)::int`,
    })
    .from(workLogs)
    .where(and(between(workLogs.date, periodStart, periodEnd), userCondition));

  const totalHours = Number.parseFloat(summary?.totalHours || "0");
  const averageHoursPerMember = userIds.length > 0 ? (totalHours / userIds.length).toFixed(1) : "0";

  // By Member
  const byMember = await db
    .select({
      userId: users.id,
      userName: users.name,
      totalHours: sql<string>`SUM(CAST(${workLogs.hours} AS DECIMAL))::text`,
      logCount: sql<number>`COUNT(*)::int`,
      lastLogDate: sql<Date | null>`MAX(${workLogs.date})`,
      workingDays: sql<number>`COUNT(DISTINCT ${workLogs.date})::int`,
    })
    .from(workLogs)
    .innerJoin(users, eq(workLogs.userId, users.id))
    .where(and(between(workLogs.date, periodStart, periodEnd), userCondition))
    .groupBy(users.id, users.name)
    .orderBy(sql`SUM(CAST(${workLogs.hours} AS DECIMAL)) DESC`);

  // By Project
  const byProject = await db
    .select({
      projectId: projects.id,
      projectName: projects.name,
      totalHours: sql<string>`SUM(CAST(${workLogs.hours} AS DECIMAL))::text`,
    })
    .from(workLogs)
    .innerJoin(projects, eq(workLogs.projectId, projects.id))
    .where(and(between(workLogs.date, periodStart, periodEnd), userCondition))
    .groupBy(projects.id, projects.name)
    .orderBy(sql`SUM(CAST(${workLogs.hours} AS DECIMAL)) DESC`);

  // Count distinct members per project
  const projectMemberCounts = await Promise.all(
    byProject.map(async (project) => {
      const [result] = await db
        .select({
          memberCount: sql<number>`COUNT(DISTINCT ${workLogs.userId})::int`,
        })
        .from(workLogs)
        .where(
          and(
            eq(workLogs.projectId, project.projectId),
            between(workLogs.date, periodStart, periodEnd),
            userCondition,
          ),
        );
      return result.memberCount;
    }),
  );

  const byProjectWithDetails = byProject.map((project, index) => ({
    ...project,
    memberCount: projectMemberCounts[index],
    percentage: totalHours > 0 ? (Number.parseFloat(project.totalHours) / totalHours) * 100 : 0,
  }));

  // Activity status
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const week = getWeekBoundaries(now);

  const activityStatus = await Promise.all(
    userIds.map(async (uid) => {
      const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, uid));

      const [todayLog] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(workLogs)
        .where(and(eq(workLogs.userId, uid), between(workLogs.date, today, todayEnd)));

      const [weekLog] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(workLogs)
        .where(and(eq(workLogs.userId, uid), between(workLogs.date, week.start, week.end)));

      const [lastLog] = await db
        .select({ date: workLogs.date })
        .from(workLogs)
        .where(eq(workLogs.userId, uid))
        .orderBy(sql`${workLogs.date} DESC`)
        .limit(1);

      return {
        userId: uid,
        userName: user?.name || "Unknown",
        hasLogToday: (todayLog?.count || 0) > 0,
        hasLogThisWeek: (weekLog?.count || 0) > 0,
        lastLogDate: lastLog?.date ? lastLog.date.toISOString().split("T")[0] : null,
      };
    }),
  );

  return {
    summary: {
      totalHours: summary?.totalHours || "0",
      averageHoursPerMember,
      totalLogs: summary?.totalLogs || 0,
    },
    byMember: byMember.map((member) => ({
      ...member,
      lastLogDate: member.lastLogDate ? member.lastLogDate.toISOString().split("T")[0] : null,
    })),
    byProject: byProjectWithDetails,
    activityStatus,
  };
}
