"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendData } from "./types";

interface WorkTrendChartProps {
  data: TrendData[];
}

export function WorkTrendChart({ data }: WorkTrendChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>工数推移</CardTitle>
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
    date: new Date(item.date).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }),
    hours: Number.parseFloat(item.totalHours),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>工数推移</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: "時間 (h)", angle: -90, position: "insideLeft" }} />
            <Tooltip formatter={(value: number) => `${value.toFixed(1)}h`} />
            <Legend />
            <Line type="monotone" dataKey="hours" stroke="#8884d8" name="工数" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
