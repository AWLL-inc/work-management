"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import type { Project } from "@/drizzle/schema";
import { cn } from "@/lib/utils";

interface ProjectIncrementalSearchProps {
  projects: Project[];
  selectedProjectIds: string[];
  onSelectionChange: (projectIds: string[]) => void;
  className?: string;
  placeholder?: string;
}

export function ProjectIncrementalSearch({
  projects,
  selectedProjectIds,
  onSelectionChange,
  className,
  placeholder,
}: ProjectIncrementalSearchProps) {
  const t = useTranslations("workLogs");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return projects.filter((project) => project.isActive).slice(0, 20); // Show first 20 when no search
    }

    return projects
      .filter(
        (project) =>
          project.isActive &&
          project.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .slice(0, 20); // Limit to 20 results
  }, [projects, searchQuery]);

  const handleProjectToggle = (projectId: string) => {
    if (selectedProjectIds.includes(projectId)) {
      onSelectionChange(selectedProjectIds.filter((id) => id !== projectId));
    } else {
      onSelectionChange([...selectedProjectIds, projectId]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDropdownOpen]);

  return (
    <div className={cn("relative w-full", className)}>
      {/* Trigger */}
      <div
        role="combobox"
        aria-expanded={isDropdownOpen}
        tabIndex={0}
        className="w-full p-2 border rounded-md bg-background cursor-pointer flex justify-between items-center h-10"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsDropdownOpen(!isDropdownOpen);
          }
        }}
      >
        <span
          className={cn(
            "block truncate mr-2",
            selectedProjectIds.length > 0 ? "" : "text-muted-foreground",
          )}
        >
          {selectedProjectIds.length > 0
            ? projects
                .filter((p) => selectedProjectIds.includes(p.id))
                .map((p) => p.name)
                .join(", ")
            : placeholder || t("search.searchProjects")}
        </span>
        <span className="text-muted-foreground shrink-0">▼</span>
      </div>

      {/* Dropdown Results */}
      {isDropdownOpen && (
        <div
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg"
          data-dropdown-content
        >
          <div className="p-2 border-b">
            <Input
              placeholder={t("search.searchProjects")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="h-9"
            />
          </div>

          <div className="max-h-60 overflow-y-auto p-1">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <div
                  key={project.id}
                  role="option"
                  tabIndex={0}
                  onClick={() => handleProjectToggle(project.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleProjectToggle(project.id);
                    }
                  }}
                  className={cn(
                    "flex items-center space-x-2 px-2 py-1.5 text-sm cursor-pointer rounded hover:bg-accent",
                    selectedProjectIds.includes(project.id) && "bg-accent/50",
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 border rounded flex items-center justify-center shrink-0",
                      selectedProjectIds.includes(project.id)
                        ? "bg-primary border-primary"
                        : "border-gray-300",
                    )}
                  >
                    {selectedProjectIds.includes(project.id) && (
                      <div className="w-2 h-2 bg-white rounded-sm" />
                    )}
                  </div>
                  <span className="flex-1 truncate">{project.name}</span>
                  {project.description && (
                    <span className="text-xs text-muted-foreground ml-2 truncate max-w-[100px]">
                      {project.description}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery
                  ? t("search.noProjectsFound")
                  : t("search.loadingProjects")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isDropdownOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-transparent border-0 cursor-default"
          tabIndex={-1}
          onClick={() => setIsDropdownOpen(false)}
          aria-label="Close dropdown"
        />
      )}
    </div>
  );
}
