"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ChevronUp } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
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
  placeholder = "プロジェクトを検索",
}: ProjectIncrementalSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedProjects = projects.filter((project) =>
    selectedProjectIds.includes(project.id),
  );

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return projects
        .filter((project) => project.isActive)
        .slice(0, 20); // Show first 20 when no search
    }
    
    return projects
      .filter((project) => 
        project.isActive &&
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 20); // Limit to 20 results
  }, [projects, searchQuery]);

  const handleProjectToggle = (projectId: string) => {
    if (selectedProjectIds.includes(projectId)) {
      onSelectionChange(selectedProjectIds.filter(id => id !== projectId));
    } else {
      onSelectionChange([...selectedProjectIds, projectId]);
    }
  };

  const handleRemoveProject = (projectId: string) => {
    onSelectionChange(selectedProjectIds.filter(id => id !== projectId));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Don't close if focus is moving to a dropdown item
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && relatedTarget.closest('[data-dropdown-content]')) {
      return;
    }
    // Delay to allow click events on dropdown items
    setTimeout(() => setIsDropdownOpen(false), 200);
  };

  const handleCloseDropdown = () => {
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDropdownOpen]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Search Input */}
      <div className="relative">
        <Input
          placeholder="プロジェクト名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="w-full"
        />

        {/* Dropdown Results */}
        {isDropdownOpen && (
          <div 
            className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto"
            data-dropdown-content
            onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking in dropdown
          >
            {/* Close Button */}
            <div className="flex justify-end p-1 border-b">
              <button
                onClick={handleCloseDropdown}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label="Close dropdown"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
            
            {filteredProjects.length > 0 ? (
              <div className="p-1">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => handleProjectToggle(project.id)}
                    className={cn(
                      "flex items-center space-x-2 px-2 py-1.5 text-sm cursor-pointer rounded hover:bg-accent",
                      selectedProjectIds.includes(project.id) && "bg-accent/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 border rounded",
                        selectedProjectIds.includes(project.id) 
                          ? "bg-primary border-primary" 
                          : "border-gray-300"
                      )}
                    >
                      {selectedProjectIds.includes(project.id) && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-sm" />
                        </div>
                      )}
                    </div>
                    <span className="flex-1">{project.name}</span>
                    {project.description && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {project.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery ? "該当するプロジェクトが見つかりません" : "プロジェクトを読み込み中..."}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}