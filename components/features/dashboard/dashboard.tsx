"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import type {
  DashboardFilters as DashboardFiltersType,
  DashboardResponse,
} from "@/types/dashboard";
import { DashboardChart } from "./dashboard-chart";
import { DashboardFilters } from "./dashboard-filters";

interface DashboardProps {
  className?: string;
}

export function Dashboard({ className }: DashboardProps) {
  const [filters, setFilters] = useState<DashboardFiltersType>({
    view: "user",
  });

  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with default date range (last 7 days)
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);

    setFilters((prev) => ({
      ...prev,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    }));
  }, []);

  const fetchDashboardData = useCallback(
    async (currentFilters: DashboardFiltersType) => {
      if (!currentFilters.startDate || !currentFilters.endDate) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams({
          view: currentFilters.view,
          startDate: currentFilters.startDate,
          endDate: currentFilters.endDate,
        });

        const response = await fetch(
          `/api/dashboard?${searchParams.toString()}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(
            result.error?.message || "Failed to fetch dashboard data",
          );
        }

        setDashboardData(result.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        const errorMessage =
          error instanceof Error ? error.message : "データの取得に失敗しました";
        setError(errorMessage);
        toast.error(
          `ダッシュボードデータの取得に失敗しました: ${errorMessage}`,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Debounced fetch function to avoid too many API calls
  const debouncedFetch = useDebouncedCallback(
    (currentFilters: DashboardFiltersType) => {
      fetchDashboardData(currentFilters);
    },
    500,
  );

  // Fetch data when filters change
  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      debouncedFetch(filters);
    }
  }, [filters, debouncedFetch]);

  const handleFiltersChange = (newFilters: DashboardFiltersType) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    if (filters.startDate && filters.endDate) {
      fetchDashboardData(filters);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="text-muted-foreground">
            作業時間の傾向と分析を確認できます
          </p>
        </div>

        <DashboardFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onApplyFilters={handleApplyFilters}
          isLoading={isLoading}
        />

        {error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-destructive">
                  エラーが発生しました
                </h3>
                <div className="mt-2 text-sm text-destructive/80">{error}</div>
              </div>
            </div>
          </div>
        ) : (
          <DashboardChart
            data={dashboardData?.data || []}
            view={filters.view}
            summary={
              dashboardData?.summary || {
                totalHours: 0,
                totalDays: 0,
                averageHoursPerDay: 0,
              }
            }
            loading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
