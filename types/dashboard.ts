export interface DashboardUserData {
  date: string;
  userId: string;
  userName: string;
  hours: number;
}

export interface DashboardProjectData {
  date: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  hours: number;
}

export interface DashboardSummary {
  totalHours: number;
  totalDays: number;
  averageHoursPerDay: number;
}

export interface DashboardResponse {
  view: "user" | "project";
  dateRange: {
    startDate: string;
    endDate: string;
  };
  data: DashboardUserData[] | DashboardProjectData[];
  summary: DashboardSummary;
}

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  view: "user" | "project";
}

// Chart data types for Recharts
export interface ChartDataPoint {
  date: string;
  [key: string]: string | number; // Dynamic keys for users/projects
}

export interface LegendItem {
  id: string;
  name: string;
  color: string;
}
