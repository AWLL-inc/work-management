/**
 * Dashboard component types
 */

export interface PeriodStats {
  totalHours: string;
  logCount: number;
  periodStart?: string;
  periodEnd?: string;
}

export interface PersonalSummary {
  card1: PeriodStats;
  card2: PeriodStats;
  card3: PeriodStats;
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

export interface UserDistribution {
  userId: string;
  userName: string | null;
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
  userName: string | null;
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
    byUser: UserDistribution[];
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

export type PeriodType =
  | "today"
  | "week"
  | "month"
  | "lastWeek"
  | "lastMonth"
  | "custom";

export type ScopeType = "own" | "all" | "user";
