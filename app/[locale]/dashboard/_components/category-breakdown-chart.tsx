"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryDistribution } from "./types";

interface CategoryBreakdownChartProps {
  data: CategoryDistribution[];
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>カテゴリ別工数</CardTitle>
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
    name: item.categoryName,
    hours: Number.parseFloat(item.totalHours),
    percentage: item.percentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>カテゴリ別工数</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis
              label={{ value: "時間 (h)", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              formatter={(
                value: number,
                _name: string,
                props: { payload?: { percentage?: number } },
              ) => [
                `${value.toFixed(1)}h (${props.payload?.percentage?.toFixed(1) ?? 0}%)`,
                "工数",
              ]}
            />
            <Legend />
            <Bar dataKey="hours" fill="#8884d8" name="工数" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
