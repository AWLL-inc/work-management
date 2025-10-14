"use client";

import { Calendar, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { DashboardFilters as DashboardFiltersType } from "@/types/dashboard";

interface DashboardFiltersProps {
  filters: DashboardFiltersType;
  onFiltersChange: (filters: DashboardFiltersType) => void;
  onApplyFilters?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function DashboardFilters({
  filters,
  onFiltersChange,
  onApplyFilters,
  isLoading = false,
  className,
}: DashboardFiltersProps) {
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getPresetRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    };
  };

  const handlePresetClick = (days: number) => {
    const range = getPresetRange(days);
    onFiltersChange({
      ...filters,
      startDate: range.startDate,
      endDate: range.endDate,
    });
  };

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  const handleViewChange = (view: "user" | "project") => {
    onFiltersChange({
      ...filters,
      view,
    });
  };

  const handleReset = () => {
    const defaultRange = getPresetRange(7);
    onFiltersChange({
      startDate: defaultRange.startDate,
      endDate: defaultRange.endDate,
      view: "user",
    });
  };

  return (
    <Card className={cn("mb-6", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* View Toggle */}
          <div>
            <Label htmlFor="view-select" className="text-sm font-medium">
              表示方法
            </Label>
            <Select value={filters.view} onValueChange={handleViewChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">ユーザー別</SelectItem>
                <SelectItem value="project">プロジェクト別</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div>
            <Label className="text-sm font-medium mb-2 block">期間選択</Label>

            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick(7)}
                className="text-xs"
              >
                過去7日
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick(30)}
                className="text-xs"
              >
                過去30日
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick(90)}
                className="text-xs"
              >
                過去90日
              </Button>
            </div>

            {/* Custom Date Range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label
                  htmlFor="start-date"
                  className="text-xs text-muted-foreground"
                >
                  開始日
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) =>
                    handleDateChange("startDate", e.target.value)
                  }
                  className="w-full"
                />
              </div>
              <div>
                <Label
                  htmlFor="end-date"
                  className="text-xs text-muted-foreground"
                >
                  終了日
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) => handleDateChange("endDate", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              リセット
            </Button>

            {onApplyFilters && (
              <Button
                onClick={onApplyFilters}
                disabled={isLoading}
                size="sm"
                className="flex items-center gap-1"
              >
                <Calendar className="h-3 w-3" />
                {isLoading ? "読み込み中..." : "適用"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
