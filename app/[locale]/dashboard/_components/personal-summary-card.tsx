"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PeriodType, PersonalSummary } from "./types";

interface PersonalSummaryCardProps {
  summary: PersonalSummary;
  period: PeriodType;
}

export function PersonalSummaryCard({
  summary,
  period,
}: PersonalSummaryCardProps) {
  const t = useTranslations("dashboard.cards");

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t(`${period}.card1`)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.card1.totalHours}h</div>
          <p className="text-xs text-muted-foreground">
            {t("logCount", { count: summary.card1.logCount })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t(`${period}.card2`)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.card2.totalHours}h</div>
          <p className="text-xs text-muted-foreground">
            {t("logCount", { count: summary.card2.logCount })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t(`${period}.card3`)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.card3.totalHours}h</div>
          <p className="text-xs text-muted-foreground">
            {t("logCount", { count: summary.card3.logCount })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
