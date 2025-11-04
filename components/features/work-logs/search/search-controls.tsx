"use client";

import {
  Calendar,
  Folder,
  RefreshCw,
  Tag,
  User as UserIcon,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Project, User, WorkCategory } from "@/drizzle/schema";
import { CategoryIncrementalSearch } from "./category-incremental-search";
import { DateRangePicker } from "./date-range-picker";
import { ProjectIncrementalSearch } from "./project-incremental-search";
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

export const SearchControls = memo(
  function SearchControls({
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
    const t = useTranslations("workLogs");

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

    // Get selected items for display
    const selectedProjects = projects.filter((project) =>
      filters.projectIds.includes(project.id),
    );
    const selectedCategories = categories.filter((category) =>
      filters.categoryIds.includes(category.id),
    );
    const selectedUser = users.find((user) => user.id === filters.userId);

    const handleRemoveProject = (projectId: string) => {
      handleProjectIdsChange(
        filters.projectIds.filter((id) => id !== projectId),
      );
    };

    const handleRemoveCategory = (categoryId: string) => {
      handleCategoryIdsChange(
        filters.categoryIds.filter((id) => id !== categoryId),
      );
    };

    return (
      <Card className={className}>
        <CardContent className="p-4">
          {/* Selected Items Display */}
          {hasActiveFilters && (
            <div className="mb-4 p-3 bg-muted/50 rounded-md">
              <div className="text-sm font-medium mb-2">
                {t("search.selectedFilters")}
              </div>
              <div className="flex flex-wrap gap-1">
                {/* Date Range */}
                {filters.dateRange.from && (
                  <Badge
                    variant="outline"
                    className="text-xs flex items-center gap-1"
                  >
                    <Calendar className="h-3 w-3" />
                    {filters.dateRange.from.toLocaleDateString("ja-JP")}
                    {filters.dateRange.to &&
                      ` ～ ${filters.dateRange.to.toLocaleDateString("ja-JP")}`}
                  </Badge>
                )}

                {/* Selected Projects */}
                {selectedProjects.map((project) => (
                  <Badge
                    key={project.id}
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    <Folder className="h-3 w-3" />
                    {project.name}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleRemoveProject(project.id)}
                    />
                  </Badge>
                ))}

                {/* Selected Categories */}
                {selectedCategories.map((category) => (
                  <Badge
                    key={category.id}
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    <Tag className="h-3 w-3" />
                    {category.name}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleRemoveCategory(category.id)}
                    />
                  </Badge>
                ))}

                {/* Selected User */}
                {selectedUser && (
                  <Badge
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    <UserIcon className="h-3 w-3" />
                    {selectedUser.name}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleUserIdChange(null)}
                    />
                  </Badge>
                )}

                {/* Clear All Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs text-destructive h-6 px-2"
                >
                  <X className="h-3 w-3 mr-1" />
                  {t("search.clearAll")}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Filter Controls */}
            <div className="flex flex-wrap gap-4 items-end">
              {/* Date Range Filter */}
              <div className="flex-1 min-w-[200px]">
                <DateRangePicker
                  value={filters.dateRange}
                  onChange={handleDateRangeChange}
                  className="w-full"
                />
              </div>

              {/* Project Filter */}
              <div className="flex-1 min-w-[200px]">
                <ProjectIncrementalSearch
                  projects={projects}
                  selectedProjectIds={filters.projectIds}
                  onSelectionChange={handleProjectIdsChange}
                  className="w-full"
                />
              </div>

              {/* Category Filter */}
              <div className="flex-1 min-w-[200px]">
                <CategoryIncrementalSearch
                  categories={categories}
                  selectedCategoryIds={filters.categoryIds}
                  onSelectionChange={handleCategoryIdsChange}
                  className="w-full"
                />
              </div>

              {/* User Filter (Admin only) */}
              {showUserFilter && users.length > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <UserSelect
                    users={users}
                    selectedUserId={filters.userId}
                    onSelectionChange={handleUserIdChange}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex justify-end gap-2">
              {onApplyFilters && (
                <Button
                  onClick={onApplyFilters}
                  disabled={isLoading}
                  className="min-w-[80px]"
                >
                  {isLoading && (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("search.apply")}
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
                  {t("search.clear")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom equality check
    return (
      JSON.stringify(prevProps.filters) === JSON.stringify(nextProps.filters) &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.projects === nextProps.projects &&
      prevProps.categories === nextProps.categories &&
      prevProps.users === nextProps.users &&
      prevProps.showUserFilter === nextProps.showUserFilter &&
      prevProps.className === nextProps.className
    );
  },
);
