"use client";

import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import type { SanitizedUser } from "@/lib/api/users";
import { useIncrementalSearch } from "@/lib/hooks/use-incremental-search";
import { cn } from "@/lib/utils";
import { CategoryBreakdownChart } from "./category-breakdown-chart";
import { PeriodSelector } from "./period-selector";
import { PersonalSummaryCard } from "./personal-summary-card";
import { ProjectDistributionChart } from "./project-distribution-chart";
import { RecentWorkLogs } from "./recent-work-logs";
import type { PeriodType, PersonalStatsResponse, ScopeType } from "./types";
import { UserDistributionChart } from "./user-distribution-chart";
import { WorkTrendChart } from "./work-trend-chart";

interface UsersResponse {
  success: boolean;
  data?: SanitizedUser[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function DashboardContent() {
  const t = useTranslations("dashboard");
  const { data: session } = useSession();
  const [period, setPeriod] = useState<PeriodType>("week");
  const [scope, setScope] = useState<ScopeType>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [customDates, setCustomDates] = useState<
    { start: Date; end: Date } | undefined
  >(undefined);

  const isAdmin = session?.user?.role === "admin";
  // Admin defaults to "all" scope, others always use "own"
  const effectiveScope = isAdmin ? scope : "own";

  // Fetch users list for admin
  const { data: usersData } = useSWR<UsersResponse>(
    isAdmin ? "/api/users" : null,
    fetcher,
  );

  const users = usersData?.data || [];

  // Incremental search for users
  const { paginatedItems, hasMore, handleSearch, loadMore } =
    useIncrementalSearch({
      items: users,
      searchFields: ["name", "email"],
      pageSize: 20,
    });

  // Convert users to combobox options
  const userOptions: ComboboxOption[] = useMemo(() => {
    return paginatedItems.map((user) => ({
      value: user.id,
      label: user.name ? `${user.name} (${user.email})` : user.email,
    }));
  }, [paginatedItems]);

  // Handle period change with optional custom dates
  const handlePeriodChange = (
    newPeriod: PeriodType,
    newCustomDates?: { start: Date; end: Date },
  ) => {
    setPeriod(newPeriod);
    setCustomDates(newCustomDates);
  };

  // Build API URL with parameters (null if user scope without selected user)
  const apiUrl = useMemo(() => {
    // Don't fetch if scope is "user" but no user is selected
    if (effectiveScope === "user" && !selectedUserId) {
      return null;
    }
    const params = new URLSearchParams({
      period,
      scope: effectiveScope,
    });

    // Add custom date range parameters if period is "custom"
    if (period === "custom" && customDates) {
      params.set("startDate", format(customDates.start, "yyyy-MM-dd"));
      params.set("endDate", format(customDates.end, "yyyy-MM-dd"));
    }

    if (effectiveScope === "user" && selectedUserId) {
      params.set("userId", selectedUserId);
    }
    return `/api/dashboard/personal?${params.toString()}`;
  }, [period, customDates, effectiveScope, selectedUserId]);

  const { data, error, isLoading } = useSWR<PersonalStatsResponse>(
    apiUrl,
    fetcher,
    {
      refreshInterval: 30000, // 30秒ごとに自動更新
      revalidateOnFocus: true,
    },
  );

  // Show message when user needs to select a user
  const needsUserSelection = effectiveScope === "user" && !selectedUserId;

  // Render content based on state
  const renderContent = () => {
    // User selection required
    if (needsUserSelection) {
      return (
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-muted-foreground">
              {t("userFilter.selectUserPrompt")}
            </p>
          </div>
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-destructive">
              {t("error.title")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("error.fetchFailed", { message: "" })}
            </p>
          </div>
        </div>
      );
    }

    // Loading state
    if (isLoading || !data) {
      return (
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-2 text-sm text-muted-foreground">{t("loading")}</p>
          </div>
        </div>
      );
    }

    // API error
    if (!data.success) {
      return (
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-destructive">
              {t("error.fetchFailed", { message: "" })}
            </p>
            <p className="text-sm text-muted-foreground">
              {data.error?.message || t("unknownError")}
            </p>
          </div>
        </div>
      );
    }

    const stats = data.data;

    return (
      <>
        {/* Summary Cards */}
        <PersonalSummaryCard summary={stats.summary} period={period} />

        {/* User Distribution Chart (only when scope is "all") */}
        {effectiveScope === "all" &&
          stats.byUser &&
          stats.byUser.length > 0 && (
            <UserDistributionChart data={stats.byUser} />
          )}

        {/* Charts Row 1 */}
        <div className="grid gap-4 md:grid-cols-2">
          <ProjectDistributionChart data={stats.byProject} />
          <CategoryBreakdownChart data={stats.byCategory} />
        </div>

        {/* Charts Row 2 */}
        <WorkTrendChart data={stats.trend.daily} />

        {/* Recent Logs */}
        <RecentWorkLogs
          logs={stats.recentLogs}
          showUserName={effectiveScope === "all"}
        />

        {/* Last Updated */}
        <div className="text-center text-xs text-muted-foreground">
          {t("lastUpdated")}: {new Date().toLocaleTimeString()}{" "}
          {t("autoRefreshInterval")}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header - always visible */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {effectiveScope === "all"
              ? t("allUsersSubtitle")
              : effectiveScope === "user" && selectedUserId
                ? users.find((u) => u.id === selectedUserId)?.name ||
                  t("userFilter.placeholder")
                : t("personalSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Scope Selector (Admin only) */}
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setScope("all");
                  setSelectedUserId(null);
                }}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors rounded-md",
                  scope === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {t("scope.all")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setScope("own");
                  setSelectedUserId(null);
                }}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors rounded-md",
                  scope === "own"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {t("scope.own")}
              </button>
            </div>
          )}
          {/* User Selector (Admin only - always visible) */}
          {isAdmin && (
            <Combobox
              options={userOptions}
              value={selectedUserId || ""}
              onValueChange={(value) => {
                if (value) {
                  setScope("user");
                  setSelectedUserId(value);
                } else {
                  setSelectedUserId(null);
                }
              }}
              onSearch={handleSearch}
              onLoadMore={loadMore}
              hasMore={hasMore}
              placeholder={t("userFilter.placeholder")}
              searchPlaceholder={t("userFilter.searchPlaceholder")}
              emptyText={t("userFilter.noUsersFound")}
              className="w-[250px]"
            />
          )}
          <PeriodSelector
            period={period}
            onPeriodChange={handlePeriodChange}
            customDates={customDates}
          />
        </div>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
}
