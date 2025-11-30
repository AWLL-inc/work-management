"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserDistribution } from "./types";

interface UserDistributionChartProps {
  data: UserDistribution[];
}

export function UserDistributionChart({ data }: UserDistributionChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ユーザー別工数</CardTitle>
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
    name: item.userName || "Unknown",
    hours: Number.parseFloat(item.totalHours),
    percentage: item.percentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>ユーザー別工数</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" unit="h" />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number, _name: string) => [
                `${value.toFixed(1)}h`,
                "工数",
              ]}
              labelFormatter={(label: string) => label}
            />
            <Bar dataKey="hours" fill="#0072B2" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
