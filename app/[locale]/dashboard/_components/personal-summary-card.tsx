"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PersonalSummary } from "./types";

interface PersonalSummaryCardProps {
  summary: PersonalSummary;
}

export function PersonalSummaryCard({ summary }: PersonalSummaryCardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">今日の工数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.today.totalHours}h</div>
          <p className="text-xs text-muted-foreground">
            {summary.today.logCount}件の記録
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">今週の工数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summary.thisWeek.totalHours}h
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.thisWeek.logCount}件の記録
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">今月の工数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summary.thisMonth.totalHours}h
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.thisMonth.logCount}件の記録
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
