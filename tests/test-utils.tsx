import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";

const messages = {
  dashboard: {
    title: "Dashboard",
    subtitle: "View work time trends and analysis",
    filters: {
      viewMethod: "View Method",
      periodSelection: "Period Selection",
      last7Days: "Last 7 Days",
      last30Days: "Last 30 Days",
      last90Days: "Last 90 Days",
      startDate: "Start Date",
      endDate: "End Date",
      reset: "Reset",
      apply: "Apply",
      loading: "Loading...",
    },
    userView: "By User",
    projectView: "By Project",
    chart: {
      title: "Work Hours Chart ({view})",
      byUser: "By User",
      byProject: "By Project",
      totalHours: "Total: {hours}h",
      average: "Average: {hours}h/day",
      loading: "Loading...",
      noData: "No data available",
      hours: "Hours",
      hoursUnit: "{value} hours",
      date: "Date",
      total: "Total",
    },
    summary: {
      totalHours: "Total: {hours}h",
      averagePerDay: "Average: {hours}h/day",
    },
    noData: "No data available",
    tooltip: {
      total: "Total: {hours} hours",
    },
    error: {
      title: "An error occurred",
      fetchFailed: "Failed to fetch dashboard data: {message}",
    },
  },
};

interface WrapperProps {
  children: ReactNode;
}

export function IntlWrapper({ children }: WrapperProps) {
  return (
    <NextIntlClientProvider messages={messages} locale="en">
      {children}
    </NextIntlClientProvider>
  );
}

export function renderWithIntl(ui: React.ReactElement) {
  return render(ui, {
    wrapper: IntlWrapper,
  });
}
