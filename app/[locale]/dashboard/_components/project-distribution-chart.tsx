"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectDistribution } from "./types";

interface ProjectDistributionChartProps {
  data: ProjectDistribution[];
}

// Color-blind friendly palette (Okabe-Ito palette)
const COLORS = [
  "#E69F00", // Orange
  "#56B4E9", // Sky Blue
  "#009E73", // Bluish Green
  "#F0E442", // Yellow
  "#0072B2", // Blue
  "#D55E00", // Vermillion
  "#CC79A7", // Reddish Purple
];

export function ProjectDistributionChart({
  data,
}: ProjectDistributionChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>プロジェクト別工数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            データがありません
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    name: item.projectName,
    value: Number.parseFloat(item.totalHours),
    percentage: item.percentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>プロジェクト別工数</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: { name?: string; percentage?: number }) =>
                `${props.name ?? ""} (${props.percentage?.toFixed(1) ?? 0}%)`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(
                value: number,
                _name: string,
                entry: { payload?: { percentage?: number } },
              ) => [
                `${value.toFixed(1)}h (${entry.payload?.percentage?.toFixed(1) ?? 0}%)`,
                "工数",
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
