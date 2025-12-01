import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { and, between, eq, inArray, type SQL, sql } from "drizzle-orm";
import { projects, users, workCategories, workLogs } from "@/drizzle/schema";
import { db } from "@/lib/db/connection";

/**
 * Dashboard Repository
 * Handles all dashboard statistics queries with optimized aggregations
 */

// Timezone constant for Japan Standard Time
const TIMEZONE = "Asia/Tokyo";

// Helper function to get today's boundaries in JST
function getTodayBoundaries(referenceDate?: Date): { start: Date; end: Date } {
  const now = referenceDate || new Date();
  const jstNow = toZonedTime(now, TIMEZONE);

  const start = new Date(jstNow);
  start.setHours(0, 0, 0, 0);

  const end = new Date(jstNow);
  end.setHours(23, 59, 59, 999);

  return {
    start: fromZonedTime(start, TIMEZONE),
    end: fromZonedTime(end, TIMEZONE),
  };
}

// Helper function to get week boundaries (Monday to Sunday) in JST
function getWeekBoundaries(referenceDate?: Date): { start: Date; end: Date } {
  const now = referenceDate || new Date();
  const jstNow = toZonedTime(now, TIMEZONE);

  const start = new Date(jstNow);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    start: fromZonedTime(start, TIMEZONE),
    end: fromZonedTime(end, TIMEZONE),
  };
}

// Helper function to get month boundaries in JST
function getMonthBoundaries(referenceDate?: Date): { start: Date; end: Date } {
  const now = referenceDate || new Date();
  const jstNow = toZonedTime(now, TIMEZONE);

  const start = new Date(jstNow.getFullYear(), jstNow.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(jstNow.getFullYear(), jstNow.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return {
    start: fromZonedTime(start, TIMEZONE),
    end: fromZonedTime(end, TIMEZONE),
  };
}

// Helper function to get last week's boundaries in JST
function getLastWeekBoundaries(): { start: Date; end: Date } {
  const now = new Date();
  const jstNow = toZonedTime(now, TIMEZONE);

  const currentWeekStart = new Date(jstNow);
  const day = currentWeekStart.getDay();
  const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
  currentWeekStart.setDate(diff);
  currentWeekStart.setHours(0, 0, 0, 0);

  // Last week's start (previous week Monday)
  const start = new Date(currentWeekStart);
  start.setDate(start.getDate() - 7);

  // Last week's end (previous week Sunday)
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    start: fromZonedTime(start, TIMEZONE),
    end: fromZonedTime(end, TIMEZONE),
  };
}

// Helper function to get last month's boundaries in JST
function getLastMonthBoundaries(): { start: Date; end: Date } {
  const now = new Date();
  const jstNow = toZonedTime(now, TIMEZONE);

  // Last month's first day
  const start = new Date(jstNow.getFullYear(), jstNow.getMonth() - 1, 1);
  start.setHours(0, 0, 0, 0);

  // Last month's last day
  const end = new Date(jstNow.getFullYear(), jstNow.getMonth(), 0);
  end.setHours(23, 59, 59, 999);

  return {
    start: fromZonedTime(start, TIMEZONE),
    end: fromZonedTime(end, TIMEZONE),
  };
}

/**
 * Get personal dashboard statistics
 * @param options.userId - User ID to filter by (required unless scope is "all")
 * @param options.scope - "own" for personal stats, "all" for all users (admin only)
 */
export async function getPersonalStats(options: {
  userId?: string;
  scope?: "own" | "all" | "user";
  period?: "today" | "week" | "month" | "lastWeek" | "lastMonth" | "custom";
  startDate?: Date;
  endDate?: Date;
}) {
  const {
    userId,
    scope = "own",
    period = "today",
    startDate,
    endDate,
  } = options;

  // Validate: userId is required unless scope is "all"
  if ((scope === "own" || scope === "user") && !userId) {
    throw new Error("userId is required when scope is 'own' or 'user'");
  }

  // Build user filter condition (undefined for "all" scope)
  const userCondition =
    scope === "all" || !userId ? undefined : eq(workLogs.userId, userId);

  const now = new Date();

  // Determine date ranges (all in JST)
  const today = getTodayBoundaries(now);
  const week = getWeekBoundaries(now);
  const month = getMonthBoundaries(now);

  // Period-specific range
  let periodStart: Date;
  let periodEnd: Date;

  switch (period) {
    case "today":
      periodStart = today.start;
      periodEnd = today.end;
      break;
    case "week":
      periodStart = week.start;
      periodEnd = week.end;
      break;
    case "month":
      periodStart = month.start;
      periodEnd = month.end;
      break;
    case "lastWeek": {
      const lastWeek = getLastWeekBoundaries();
      periodStart = lastWeek.start;
      periodEnd = lastWeek.end;
      break;
    }
    case "lastMonth": {
      const lastMonth = getLastMonthBoundaries();
      periodStart = lastMonth.start;
      periodEnd = lastMonth.end;
      break;
    }
    case "custom": {
      if (!startDate || !endDate) {
        throw new Error("Start and end dates are required for custom period");
      }
      // Custom period also uses JST
      const jstStart = toZonedTime(startDate, TIMEZONE);
      jstStart.setHours(0, 0, 0, 0);
      const jstEnd = toZonedTime(endDate, TIMEZONE);
      jstEnd.setHours(23, 59, 59, 999);
      periodStart = fromZonedTime(jstStart, TIMEZONE);
      periodEnd = fromZonedTime(jstEnd, TIMEZONE);
      break;
    }
  }

  // Summary statistics - get data based on selected period and calculate averages
  // Get period summary with working days count
  const [periodSummary] = await db
    .select({
      totalHours: sql<string>`COALESCE(SUM(CAST(${workLogs.hours} AS DECIMAL)), 0)::text`,
      logCount: sql<number>`COUNT(*)::int`,
      workingDays: sql<number>`COUNT(DISTINCT ${workLogs.date})::int`,
    })
    .from(workLogs)
    .where(and(userCondition, between(workLogs.date, periodStart, periodEnd)));

  const totalHoursNum = Number.parseFloat(periodSummary?.totalHours || "0");
  const logCount = periodSummary?.logCount || 0;
  const workingDays = periodSummary?.workingDays || 0;

  // Calculate card values based on period type
  // Card 3 is always the total hours for the period
  const card3Hours = totalHoursNum.toFixed(1);

  // Card 1: Daily average (total hours / working days)
  const card1Hours =
    workingDays > 0 ? (totalHoursNum / workingDays).toFixed(1) : "0.0";

  // Card 2: Depends on period type
  const card2Hours =
    period === "today" || period === "week" || period === "lastWeek"
      ? // For today/week/lastWeek: show total hours (same as card 3)
        card3Hours
      : // For month/lastMonth/custom: calculate weekly average
        (() => {
          const periodDays = Math.ceil(
            (periodEnd.getTime() - periodStart.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          const weeks = Math.max(1, Math.ceil(periodDays / 7));
          return (totalHoursNum / weeks).toFixed(1);
        })();

  // By Project (for selected period)
  const [periodTotal] = await db
    .select({
      total: sql<string>`COALESCE(SUM(CAST(${workLogs.hours} AS DECIMAL)), 0)::text`,
    })
    .from(workLogs)
    .where(and(userCondition, between(workLogs.date, periodStart, periodEnd)));

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
    .where(and(userCondition, between(workLogs.date, periodStart, periodEnd)))
    .groupBy(workLogs.projectId, projects.name)
    .orderBy(sql`SUM(CAST(${workLogs.hours} AS DECIMAL)) DESC`);

  const byProjectWithPercentage = byProject.map((project) => ({
    ...project,
    percentage:
      totalHours > 0
        ? (Number.parseFloat(project.totalHours) / totalHours) * 100
        : 0,
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
    .where(and(userCondition, between(workLogs.date, periodStart, periodEnd)))
    .groupBy(workLogs.categoryId, workCategories.name)
    .orderBy(sql`SUM(CAST(${workLogs.hours} AS DECIMAL)) DESC`);

  const byCategoryWithPercentage = byCategory.map((category) => ({
    ...category,
    percentage:
      totalHours > 0
        ? (Number.parseFloat(category.totalHours) / totalHours) * 100
        : 0,
  }));

  // By User (for selected period, only when scope is "all")
  let byUserWithPercentage: {
    userId: string;
    userName: string | null;
    totalHours: string;
    logCount: number;
    percentage: number;
  }[] = [];

  if (scope === "all") {
    const byUser = await db
      .select({
        userId: workLogs.userId,
        userName: users.name,
        totalHours: sql<string>`SUM(CAST(${workLogs.hours} AS DECIMAL))::text`,
        logCount: sql<number>`COUNT(*)::int`,
      })
      .from(workLogs)
      .innerJoin(users, eq(workLogs.userId, users.id))
      .where(between(workLogs.date, periodStart, periodEnd))
      .groupBy(workLogs.userId, users.name)
      .orderBy(sql`SUM(CAST(${workLogs.hours} AS DECIMAL)) DESC`);

    byUserWithPercentage = byUser.map((user) => ({
      ...user,
      percentage:
        totalHours > 0
          ? (Number.parseFloat(user.totalHours) / totalHours) * 100
          : 0,
    }));
  }

  // Recent logs (last 10)
  const recentLogsQuery = db
    .select({
      id: workLogs.id,
      date: workLogs.date,
      hours: workLogs.hours,
      projectName: projects.name,
      categoryName: workCategories.name,
      userName: users.name,
    })
    .from(workLogs)
    .innerJoin(projects, eq(workLogs.projectId, projects.id))
    .innerJoin(workCategories, eq(workLogs.categoryId, workCategories.id))
    .innerJoin(users, eq(workLogs.userId, users.id));

  const recentLogs = userCondition
    ? await recentLogsQuery
        .where(userCondition)
        .orderBy(sql`${workLogs.date} DESC, ${workLogs.createdAt} DESC`)
        .limit(10)
    : await recentLogsQuery
        .orderBy(sql`${workLogs.date} DESC, ${workLogs.createdAt} DESC`)
        .limit(10);

  // Daily trend for the selected period
  const dailyTrend = await db
    .select({
      date: workLogs.date,
      totalHours: sql<string>`SUM(CAST(${workLogs.hours} AS DECIMAL))::text`,
    })
    .from(workLogs)
    .where(and(userCondition, between(workLogs.date, periodStart, periodEnd)))
    .groupBy(workLogs.date)
    .orderBy(workLogs.date);

  return {
    summary: {
      card1: {
        totalHours: card1Hours,
        logCount,
        periodStart: periodStart.toISOString().split("T")[0],
        periodEnd: periodEnd.toISOString().split("T")[0],
      },
      card2: {
        totalHours: card2Hours,
        logCount,
        periodStart: periodStart.toISOString().split("T")[0],
        periodEnd: periodEnd.toISOString().split("T")[0],
      },
      card3: {
        totalHours: card3Hours,
        logCount,
        periodStart: periodStart.toISOString().split("T")[0],
        periodEnd: periodEnd.toISOString().split("T")[0],
      },
    },
    byProject: byProjectWithPercentage,
    byCategory: byCategoryWithPercentage,
    byUser: byUserWithPercentage,
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
  const {
    userId,
    userIds,
    period = "week",
    startDate,
    endDate,
    projectId,
    scope = "own",
  } = options;
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
    userCondition = inArray(workLogs.userId, userIds);
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
        percentage:
          projectTotal > 0
            ? (Number.parseFloat(cat.totalHours) / projectTotal) * 100
            : 0,
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
  const totalHours = projectsData
    .reduce((sum, p) => sum + Number.parseFloat(p.totalHours), 0)
    .toString();
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
  const { period = "week", startDate, endDate, userIds } = options;
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

  const userCondition = inArray(workLogs.userId, userIds);

  // Team summary
  const [summary] = await db
    .select({
      totalHours: sql<string>`COALESCE(SUM(CAST(${workLogs.hours} AS DECIMAL)), 0)::text`,
      totalLogs: sql<number>`COUNT(*)::int`,
    })
    .from(workLogs)
    .where(and(between(workLogs.date, periodStart, periodEnd), userCondition));

  const totalHours = Number.parseFloat(summary?.totalHours || "0");
  const averageHoursPerMember =
    userIds.length > 0 ? (totalHours / userIds.length).toFixed(1) : "0";

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
    percentage:
      totalHours > 0
        ? (Number.parseFloat(project.totalHours) / totalHours) * 100
        : 0,
  }));

  // Activity status
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const week = getWeekBoundaries(now);

  const activityStatus = await Promise.all(
    userIds.map(async (uid) => {
      const [user] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, uid));

      const [todayLog] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(workLogs)
        .where(
          and(
            eq(workLogs.userId, uid),
            between(workLogs.date, today, todayEnd),
          ),
        );

      const [weekLog] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(workLogs)
        .where(
          and(
            eq(workLogs.userId, uid),
            between(workLogs.date, week.start, week.end),
          ),
        );

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
        lastLogDate: lastLog?.date
          ? lastLog.date.toISOString().split("T")[0]
          : null,
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
      lastLogDate: member.lastLogDate
        ? member.lastLogDate.toISOString().split("T")[0]
        : null,
    })),
    byProject: byProjectWithDetails,
    activityStatus,
  };
}
