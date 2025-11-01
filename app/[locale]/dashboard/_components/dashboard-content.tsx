"use client";

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
            エラーが発生しました
          </p>
          <p className="text-sm text-muted-foreground">
            データの取得に失敗しました
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
          <p className="mt-2 text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!data.success) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">
            データの取得に失敗しました
          </p>
          <p className="text-sm text-muted-foreground">
            {data.error?.message || "不明なエラー"}
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
          <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="text-muted-foreground">工数消化状況の可視化</p>
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
        最終更新: {new Date().toLocaleTimeString("ja-JP")} (30秒ごとに自動更新)
      </div>
    </div>
  );
}
