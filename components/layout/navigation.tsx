"use client";

import {
  ClipboardList,
  FolderKanban,
  KeyRound,
  LogOut,
  Tags,
  User,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { logoutAction } from "@/app/logout/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { LanguageSwitcherButton } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";

interface NavigationProps {
  userEmail?: string | null;
  userRole?: string;
}

export function Navigation({ userEmail, userRole }: NavigationProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const isAdmin = userRole === "admin";
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navigationItems = [
    {
      name: t("dashboard"),
      href: "/dashboard",
      icon: ClipboardList,
      roles: ["user", "manager", "admin"],
    },
    {
      name: t("workLogs"),
      href: "/work-logs",
      icon: ClipboardList,
      roles: ["user", "manager", "admin"],
    },
  ];

  const adminItems = [
    {
      name: t("projects"),
      href: "/admin/projects",
      icon: FolderKanban,
    },
    {
      name: t("categories"),
      href: "/admin/work-categories",
      icon: Tags,
    },
  ];

  async function handleLogout() {
    try {
      setIsLoggingOut(true);

      // Call server action to destroy session
      const result = await logoutAction();

      if (result.success) {
        // Clear client-side cache with full page reload
        window.location.href = "/login?logout=success";
      } else {
        console.error("Logout failed:", result.error);
        setIsLoggingOut(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  }

  return (
    <nav
      id="main-navigation"
      className="bg-background border-b border-border shadow-sm"
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
                  {t("appTitle")}
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
            <ThemeToggle />
            {userEmail && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" aria-label={t("userMenu")}>
                    <User className="w-4 h-4 mr-2" />
                    <span className="text-sm">{userEmail}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userEmail}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userRole}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/change-password"
                      className="flex w-full cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 mr-2" />
                      {t("changePassword")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {isLoggingOut ? `${t("logout")}...` : t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
