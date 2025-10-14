"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ChartDataPoint,
  DashboardProjectData,
  DashboardSummary,
  DashboardUserData,
  LegendItem,
} from "@/types/dashboard";

interface DashboardChartProps {
  data: DashboardUserData[] | DashboardProjectData[];
  view: "user" | "project";
  summary: DashboardSummary;
  loading?: boolean;
}

// Color palette for charts
const CHART_COLORS = [
  "#0088fe",
  "#00c49f",
  "#ffbb28",
  "#ff8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7c7c",
  "#8dd1e1",
  "#d084d0",
  "#87d068",
  "#ffa726",
  "#ef5350",
  "#42a5f5",
  "#ab47bc",
];

export function DashboardChart({
  data,
  view,
  summary,
  loading = false,
}: DashboardChartProps) {
  const t = useTranslations("dashboard.chart");
  const { chartData, legendItems } = useMemo(() => {
    if (!data.length) {
      return { chartData: [], legendItems: [] };
    }

    // Group data by date and create chart data points
    const dateMap = new Map<string, ChartDataPoint>();
    const entitySet = new Set<string>();

    data.forEach((item) => {
      const entityKey =
        view === "user"
          ? (item as DashboardUserData).userName
          : `${(item as DashboardProjectData).projectName}`;

      entitySet.add(entityKey);

      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, { date: item.date });
      }

      const existing = dateMap.get(item.date);
      if (!existing) return;

      if (view === "project") {
        // For project view, we need to handle stacked data per user within project
        const projectData = item as DashboardProjectData;
        const projectUserKey = `${projectData.projectName}_${projectData.userName}`;
        existing[projectUserKey] =
          ((existing[projectUserKey] as number) || 0) + projectData.hours;
      } else {
        // For user view, simple aggregation by user
        existing[entityKey] =
          ((existing[entityKey] as number) || 0) + item.hours;
      }
    });

    const chartData = Array.from(dateMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Create legend items with colors
    const entities = Array.from(entitySet);
    const legendItems: LegendItem[] = entities.map((entity, index) => ({
      id: entity,
      name: entity,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

    return { chartData, legendItems };
  }, [data, view]);

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      dataKey: string;
      value: string | number;
      color: string;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length && label) {
      const date = new Date(label).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      return (
        <div className="bg-background border border-border rounded-md p-3 shadow-md">
          <p className="font-medium mb-2">{date}</p>
          {payload.map((entry, index) => (
            <div
              key={`${entry.dataKey}-${index}`}
              className="flex items-center gap-2 text-sm"
            >
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.dataKey}:</span>
              <span className="font-medium">
                {t("hoursUnit", { value: Number(entry.value).toFixed(1) })}
              </span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-border text-sm">
            <span className="font-medium">
              {t("total")}:{" "}
              {t("hoursUnit", {
                value: payload
                  .reduce((sum: number, entry) => sum + Number(entry.value), 0)
                  .toFixed(1),
              })}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {t("title", {
              view: view === "user" ? t("byUser") : t("byProject"),
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-muted-foreground">{t("loading")}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {t("title", {
              view: view === "user" ? t("byUser") : t("byProject"),
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-muted-foreground">{t("noData")}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {t("title", {
              view: view === "user" ? t("byUser") : t("byProject"),
            })}
          </span>
          <div className="flex gap-2 text-sm">
            <Badge variant="outline">
              {t("totalHours", { hours: summary.totalHours.toFixed(1) })}
            </Badge>
            <Badge variant="outline">
              {t("average", { hours: summary.averageHoursPerDay.toFixed(1) })}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
                fontSize={12}
              />
              <YAxis
                label={{
                  value: t("hours"),
                  angle: -90,
                  position: "insideLeft",
                }}
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="rect" />

              {view === "user"
                ? // User view: simple bars for each user
                  legendItems.map((item, _index) => (
                    <Bar
                      key={item.id}
                      dataKey={item.id}
                      name={item.name}
                      fill={item.color}
                      radius={[2, 2, 0, 0]}
                    />
                  ))
                : // Project view: stacked bars
                  (() => {
                    // For project view, create bars for each project-user combination
                    const projectUserKeys = new Set<string>();
                    chartData.forEach((point) => {
                      Object.keys(point).forEach((key) => {
                        if (key !== "date" && key.includes("_")) {
                          projectUserKeys.add(key);
                        }
                      });
                    });

                    return Array.from(projectUserKeys).map((key, index) => {
                      const [projectName, userName] = key.split("_");
                      return (
                        <Bar
                          key={key}
                          dataKey={key}
                          name={`${projectName} (${userName})`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                          stackId="project"
                          radius={
                            index === projectUserKeys.size - 1
                              ? [2, 2, 0, 0]
                              : [0, 0, 0, 0]
                          }
                        />
                      );
                    });
                  })()}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
