/**
 * Dashboard component types
 */

export interface PersonalSummary {
  today: {
    totalHours: string;
    logCount: number;
  };
  thisWeek: {
    totalHours: string;
    logCount: number;
    weekStart: string;
    weekEnd: string;
  };
  thisMonth: {
    totalHours: string;
    logCount: number;
    monthStart: string;
    monthEnd: string;
  };
}

export interface ProjectDistribution {
  projectId: string;
  projectName: string;
  totalHours: string;
  percentage: number;
  logCount: number;
}

export interface CategoryDistribution {
  categoryId: string;
  categoryName: string;
  totalHours: string;
  percentage: number;
  logCount: number;
}

export interface RecentLog {
  id: string;
  date: string;
  hours: string;
  projectName: string;
  categoryName: string;
}

export interface TrendData {
  date: string;
  totalHours: string;
}

export interface PersonalStatsResponse {
  success: boolean;
  data: {
    summary: PersonalSummary;
    byProject: ProjectDistribution[];
    byCategory: CategoryDistribution[];
    recentLogs: RecentLog[];
    trend: {
      daily: TrendData[];
    };
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type PeriodType = "today" | "week" | "month" | "custom";
