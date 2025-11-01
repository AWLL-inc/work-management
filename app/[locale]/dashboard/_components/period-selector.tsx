"use client";

import { Button } from "@/components/ui/button";
import type { PeriodType } from "./types";

interface PeriodSelectorProps {
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
}

export function PeriodSelector({
  period,
  onPeriodChange,
}: PeriodSelectorProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={period === "today" ? "default" : "outline"}
        size="sm"
        onClick={() => onPeriodChange("today")}
      >
        今日
      </Button>
      <Button
        variant={period === "week" ? "default" : "outline"}
        size="sm"
        onClick={() => onPeriodChange("week")}
      >
        今週
      </Button>
      <Button
        variant={period === "month" ? "default" : "outline"}
        size="sm"
        onClick={() => onPeriodChange("month")}
      >
        今月
      </Button>
    </div>
  );
}
