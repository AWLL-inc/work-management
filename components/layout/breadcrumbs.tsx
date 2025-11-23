"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function Breadcrumbs() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const routeLabels: Record<string, string> = {
    "work-logs": t("workLogs"),
    admin: t("admin"),
    projects: t("projects"),
    "work-categories": t("categories"),
  };

  if (!pathname || pathname === "/") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Build breadcrumb items
  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label =
      routeLabels[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({
      label,
      href: currentPath,
    });
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground py-3 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Link
        href="/"
        className="hover:text-foreground transition-colors flex items-center"
      >
        <Home className="w-4 h-4" />
      </Link>

      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <div key={breadcrumb.href} className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4" />
            {isLast ? (
              <span className="font-medium text-foreground">
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="hover:text-foreground transition-colors"
              >
                {breadcrumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
