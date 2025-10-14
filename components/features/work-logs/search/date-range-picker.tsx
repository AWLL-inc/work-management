"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [error, setError] = useState<string | null>(null);

  const formatDate = (date: Date | undefined) => {
    return date ? date.toISOString().split("T")[0] : "";
  };

  const parseDate = (dateString: string) => {
    return dateString ? new Date(dateString) : undefined;
  };

  const handleFromChange = (dateString: string) => {
    const fromDate = parseDate(dateString);

    // バリデーション: 開始日が終了日より後の場合
    if (value.to && fromDate && fromDate > value.to) {
      setError("開始日は終了日以前を選択してください");
      return;
    }

    setError(null);
    onChange({
      from: fromDate,
      to: value.to,
    });
  };

  const handleToChange = (dateString: string) => {
    const toDate = parseDate(dateString);

    // バリデーション: 終了日が開始日より前の場合
    if (value.from && toDate && toDate < value.from) {
      setError("終了日は開始日以降を選択してください");
      return;
    }

    setError(null);
    onChange({
      from: value.from,
      to: toDate,
    });
  };

  const clearDates = () => {
    setError(null);
    onChange({
      from: undefined,
      to: undefined,
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label
            htmlFor="from-date"
            className="text-xs text-muted-foreground mb-1 block"
          >
            開始日
          </label>
          <Input
            id="from-date"
            type="date"
            value={formatDate(value.from)}
            onChange={(e) => handleFromChange(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label
            htmlFor="to-date"
            className="text-xs text-muted-foreground mb-1 block"
          >
            終了日
          </label>
          <Input
            id="to-date"
            type="date"
            value={formatDate(value.to)}
            onChange={(e) => handleToChange(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {(value.from || value.to) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearDates}
          className="text-xs text-destructive"
        >
          <X className="h-3 w-3 mr-1" />
          日付をクリア
        </Button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
