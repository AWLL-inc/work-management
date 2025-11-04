"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import useSWR from "swr";
import { CategoryBreakdownChart } from "./category-breakdown-chart";
import { PeriodSelector } from "./period-selector";
import { PersonalSummaryCard } from "./personal-summary-card";
import { ProjectDistributionChart } from "./project-distribution-chart";
import { RecentWorkLogs } from "./recent-work-logs";
import type { PeriodType, PersonalStatsResponse } from "./types";
import { WorkTrendChart } from "./work-trend-chart";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function DashboardContent() {
  const t = useTranslations("dashboard");
  const [period, setPeriod] = useState<PeriodType>("week");

  const { data, error, isLoading } = useSWR<PersonalStatsResponse>(
    `/api/dashboard/personal?period=${period}`,
    fetcher,
    {
      refreshInterval: 30000, // 30秒ごとに自動更新
      revalidateOnFocus: true,
    },
  );

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            {t("error.title")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("error.fetchFailed", { message: "" })}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!data.success) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            {t("error.fetchFailed", { message: "" })}
          </p>
          <p className="text-sm text-muted-foreground">
            {data.error?.message || t("unknownError")}
          </p>
        </div>
      </div>
    );
  }

  const stats = data.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("personalSubtitle")}</p>
        </div>
        <PeriodSelector period={period} onPeriodChange={setPeriod} />
      </div>

      {/* Summary Cards */}
      <PersonalSummaryCard summary={stats.summary} />

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <ProjectDistributionChart data={stats.byProject} />
        <CategoryBreakdownChart data={stats.byCategory} />
      </div>

      {/* Charts Row 2 */}
      <WorkTrendChart data={stats.trend.daily} />

      {/* Recent Logs */}
      <RecentWorkLogs logs={stats.recentLogs} />

      {/* Last Updated */}
      <div className="text-center text-xs text-muted-foreground">
        {t("lastUpdated")}: {new Date().toLocaleTimeString()} {t("autoRefreshInterval")}
      </div>
    </div>
  );
}
