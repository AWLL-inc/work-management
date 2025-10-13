"use client";

import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Project, User, WorkCategory } from "@/drizzle/schema";
import { CategoryMultiSelect } from "./category-multi-select";
import { DateRangePicker } from "./date-range-picker";
import { ProjectMultiSelect } from "./project-multi-select";
import { UserSelect } from "./user-select";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface SearchFilters {
  dateRange: DateRange;
  projectIds: string[];
  categoryIds: string[];
  userId: string | null;
}

interface SearchControlsProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  projects: Project[];
  categories: WorkCategory[];
  users?: User[];
  showUserFilter?: boolean;
  onApplyFilters?: () => void;
  onClearFilters?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function SearchControls({
  filters,
  onFiltersChange,
  projects,
  categories,
  users = [],
  showUserFilter = false,
  onApplyFilters,
  onClearFilters,
  isLoading = false,
  className,
}: SearchControlsProps) {
  const hasActiveFilters =
    filters.dateRange.from ||
    filters.dateRange.to ||
    filters.projectIds.length > 0 ||
    filters.categoryIds.length > 0 ||
    filters.userId;

  const handleDateRangeChange = (dateRange: DateRange) => {
    onFiltersChange({
      ...filters,
      dateRange,
    });
  };

  const handleProjectIdsChange = (projectIds: string[]) => {
    onFiltersChange({
      ...filters,
      projectIds,
    });
  };

  const handleCategoryIdsChange = (categoryIds: string[]) => {
    onFiltersChange({
      ...filters,
      categoryIds,
    });
  };

  const handleUserIdChange = (userId: string | null) => {
    onFiltersChange({
      ...filters,
      userId,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: { from: undefined, to: undefined },
      projectIds: [],
      categoryIds: [],
      userId: null,
    });
    onClearFilters?.();
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Date Range Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2">日付範囲</label>
            <DateRangePicker
              value={filters.dateRange}
              onChange={handleDateRangeChange}
              className="w-full"
            />
          </div>

          {/* Project Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2">
              プロジェクト
            </label>
            <ProjectMultiSelect
              projects={projects}
              selectedProjectIds={filters.projectIds}
              onSelectionChange={handleProjectIdsChange}
              className="w-full"
            />
          </div>

          {/* Category Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-2">カテゴリ</label>
            <CategoryMultiSelect
              categories={categories}
              selectedCategoryIds={filters.categoryIds}
              onSelectionChange={handleCategoryIdsChange}
              className="w-full"
            />
          </div>

          {/* User Filter (Admin only) */}
          {showUserFilter && users.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">ユーザー</label>
              <UserSelect
                users={users}
                selectedUserId={filters.userId}
                onSelectionChange={handleUserIdChange}
                className="w-full"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {onApplyFilters && (
              <Button
                onClick={onApplyFilters}
                disabled={isLoading}
                className="min-w-[80px]"
              >
                {isLoading && (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                )}
                適用
              </Button>
            )}

            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearAllFilters}
                disabled={isLoading}
                className="min-w-[80px]"
              >
                <X className="mr-2 h-4 w-4" />
                クリア
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground mb-2">
              適用中のフィルター:
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.dateRange.from && (
                <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                  日付: {filters.dateRange.from.toLocaleDateString("ja-JP")}
                  {filters.dateRange.to &&
                    ` ～ ${filters.dateRange.to.toLocaleDateString("ja-JP")}`}
                </div>
              )}
              {filters.projectIds.length > 0 && (
                <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                  プロジェクト: {filters.projectIds.length}件選択
                </div>
              )}
              {filters.categoryIds.length > 0 && (
                <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                  カテゴリ: {filters.categoryIds.length}件選択
                </div>
              )}
              {filters.userId && (
                <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                  ユーザー:{" "}
                  {users.find((u) => u.id === filters.userId)?.name ||
                    "Unknown"}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
