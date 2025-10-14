"use client";

import { ClipboardList, FolderKanban, LogOut, Tags } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { LanguageSwitcherButton } from "./language-switcher";

interface NavigationProps {
  userEmail?: string | null;
  userRole?: string;
}

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: ClipboardList,
    roles: ["user", "manager", "admin"],
  },
  {
    name: "Work Logs",
    href: "/work-logs",
    icon: ClipboardList,
    roles: ["user", "manager", "admin"],
  },
];

const adminItems = [
  {
    name: "Projects",
    href: "/admin/projects",
    icon: FolderKanban,
  },
  {
    name: "Categories",
    href: "/admin/work-categories",
    icon: Tags,
  },
];

export function Navigation({ userEmail, userRole }: NavigationProps) {
  const pathname = usePathname();
  const isAdmin = userRole === "admin";

  return (
    <nav
      id="main-navigation"
      className="bg-white border-b border-border shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo/Brand */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/work-logs" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">
                  Work Management
                </span>
              </Link>
            </div>

            {/* Main Navigation */}
            <div className="ml-8 flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}

              {/* Admin Section */}
              {isAdmin && (
                <>
                  <div className="mx-2 my-2 w-px bg-border" />
                  {adminItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      pathname?.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {item.name}
                      </Link>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcherButton />
            {userEmail && (
              <span className="text-sm text-muted-foreground">{userEmail}</span>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/api/auth/signout">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
