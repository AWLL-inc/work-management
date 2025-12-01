"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { PeriodType } from "./types";

interface PeriodSelectorProps {
  period: PeriodType;
  onPeriodChange: (
    period: PeriodType,
    customDates?: { start: Date; end: Date },
  ) => void;
  customDates?: { start: Date; end: Date };
}

export function PeriodSelector({
  period,
  onPeriodChange,
  customDates,
}: PeriodSelectorProps) {
  const [startDate, setStartDate] = useState<string>(
    customDates?.start ? format(customDates.start, "yyyy-MM-dd") : "",
  );
  const [endDate, setEndDate] = useState<string>(
    customDates?.end ? format(customDates.end, "yyyy-MM-dd") : "",
  );
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleCustomPeriodApply = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        alert("開始日は終了日より前である必要があります");
        return;
      }

      onPeriodChange("custom", { start, end });
      setIsPopoverOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
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
      <Button
        variant={period === "lastWeek" ? "default" : "outline"}
        size="sm"
        onClick={() => onPeriodChange("lastWeek")}
      >
        先週
      </Button>
      <Button
        variant={period === "lastMonth" ? "default" : "outline"}
        size="sm"
        onClick={() => onPeriodChange("lastMonth")}
      >
        先月
      </Button>

      {/* Custom Period Picker */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={period === "custom" ? "default" : "outline"}
            size="sm"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            カスタム期間
            {period === "custom" && customDates && (
              <span className="ml-2 text-xs">
                ({format(customDates.start, "M/d", { locale: ja })} -{" "}
                {format(customDates.end, "M/d", { locale: ja })})
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">開始日</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">終了日</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              onClick={handleCustomPeriodApply}
              disabled={!startDate || !endDate}
              className="w-full"
            >
              適用
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
