"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("workLogs");
  const [error, setError] = useState<string | null>(null);

  const formatDate = (date: Date | undefined) => {
    return date ? date.toISOString().split("T")[0] : "";
  };

  const parseDate = (dateString: string) => {
    return dateString ? new Date(dateString) : undefined;
  };

  // Helper function to check if period exceeds 1 month
  const isPeriodTooLong = (from: Date, to: Date): boolean => {
    const oneMonthInMs = 31 * 24 * 60 * 60 * 1000; // 31 days in milliseconds
    const diffInMs = to.getTime() - from.getTime();
    return diffInMs > oneMonthInMs;
  };

  const handleFromChange = (dateString: string) => {
    const fromDate = parseDate(dateString);

    // Validation: check if start date is after end date
    if (value.to && fromDate && fromDate > value.to) {
      setError(t("search.dateRangeError.startAfterEnd"));
      return;
    }

    // Validation: check if period exceeds 1 month
    if (value.to && fromDate && isPeriodTooLong(fromDate, value.to)) {
      setError(t("search.dateRangeError.periodTooLong"));
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

    // Validation: check if end date is before start date
    if (value.from && toDate && toDate < value.from) {
      setError(t("search.dateRangeError.endBeforeStart"));
      return;
    }

    // Validation: check if period exceeds 1 month
    if (value.from && toDate && isPeriodTooLong(value.from, toDate)) {
      setError(t("search.dateRangeError.periodTooLong"));
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
    <div className={cn("space-y-2 relative", className)}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="from-date"
            className="text-xs text-muted-foreground mb-1 block"
          >
            {t("search.from")}
          </label>
          <Input
            id="from-date"
            type="date"
            value={formatDate(value.from)}
            onChange={(e) => handleFromChange(e.target.value)}
            className="w-full min-w-[120px]"
          />
        </div>
        <div>
          <label
            htmlFor="to-date"
            className="text-xs text-muted-foreground mb-1 block"
          >
            {t("search.to")}
          </label>
          <Input
            id="to-date"
            type="date"
            value={formatDate(value.to)}
            onChange={(e) => handleToChange(e.target.value)}
            className="w-full min-w-[120px]"
          />
        </div>
      </div>

      {(value.from || value.to) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearDates}
          className="absolute -top-1 right-0 h-6 px-2 text-xs text-destructive hover:bg-destructive/10"
        >
          <X className="h-3 w-3 mr-1" />
          {t("search.clearDate")}
        </Button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
