"use client";

/**
 * EnhancedAGGridV2 Usage Example - Work Log Table
 *
 * This example demonstrates how to use EnhancedAGGridV2 with work logs.
 * It shows the basic setup and configuration for a typical data table.
 *
 * @example
 * ```tsx
 * import { WorkLogExampleTable } from '@/components/data-table/v2/examples/work-log-example';
 *
 * <WorkLogExampleTable
 *   workLogs={myWorkLogs}
 *   projects={myProjects}
 *   categories={myCategories}
 *   onCreateWorkLog={handleCreate}
 *   onUpdateWorkLog={handleUpdate}
 *   onDeleteWorkLog={handleDelete}
 * />
 * ```
 */

import type { ColDef } from "ag-grid-community";
import { useMemo } from "react";
import type { Project, WorkCategory, WorkLog } from "@/drizzle/schema";
import { EnhancedAGGridV2 } from "../enhanced-ag-grid-v2";

interface WorkLogExampleTableProps {
  workLogs: WorkLog[];
  projects: Project[];
  categories: WorkCategory[];
  onCreateWorkLog: (data: {
    date: string;
    hours: string;
    projectId: string;
    categoryId: string;
    details?: string;
  }) => Promise<void>;
  onUpdateWorkLog: (
    id: string,
    data: {
      date?: string;
      hours?: string;
      projectId?: string;
      categoryId?: string;
      details?: string | null;
    },
  ) => Promise<void>;
  onDeleteWorkLog: (id: string) => Promise<void>;
}

interface WorkLogGridRow extends WorkLog {
  projectName?: string;
  categoryName?: string;
}

/**
 * Work Log table using EnhancedAGGridV2
 *
 * This component demonstrates the V2 API with all features enabled.
 */
export function WorkLogExampleTable({
  workLogs,
  projects,
  categories,
  onCreateWorkLog,
  onUpdateWorkLog,
  onDeleteWorkLog,
}: WorkLogExampleTableProps) {
  // Create lookup maps for projects and categories
  const projectsMap = useMemo(() => {
    return new Map(projects.map((p) => [p.id, p.name]));
  }, [projects]);

  const categoriesMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  // Prepare row data with project and category names
  const rowData: WorkLogGridRow[] = useMemo(() => {
    return workLogs.map((workLog) => ({
      ...workLog,
      projectName: projectsMap.get(workLog.projectId) || "Unknown",
      categoryName: categoriesMap.get(workLog.categoryId) || "Unknown",
    }));
  }, [workLogs, projectsMap, categoriesMap]);

  // Define columns
  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        headerName: "",
        checkboxSelection: true,
        headerCheckboxSelection: true,
        width: 50,
        pinned: "left",
        sortable: false,
        filter: false,
      },
      {
        headerName: "Date",
        field: "date",
        width: 120,
        sort: "desc",
        valueFormatter: (params) => {
          const date = params.value;
          if (date instanceof Date) {
            return date.toISOString().split("T")[0];
          }
          return typeof date === "string" ? date.split("T")[0] : date;
        },
      },
      {
        headerName: "Hours",
        field: "hours",
        width: 100,
      },
      {
        headerName: "Project",
        field: "projectName",
        width: 200,
      },
      {
        headerName: "Category",
        field: "categoryName",
        width: 180,
      },
      {
        headerName: "Details",
        field: "details",
        flex: 1,
        wrapText: true,
        autoHeight: true,
      },
    ],
    [],
  );

  return (
    <div className="h-full">
      <EnhancedAGGridV2<WorkLogGridRow>
        data={rowData}
        columns={columnDefs}
        // Enable all features
        enableSorting={true}
        enableFiltering={true}
        enablePagination={false}
        enableSelection={true}
        enableBatchEditing={true}
        enableUndoRedo={true}
        enableRowActions={true}
        enableToolbar={true}
        enableClipboard={true}
        // Configuration
        initialSort={[{ column: "date", direction: "desc" }]}
        pageSize={50}
        maxUndoRedoSteps={20}
        // Callbacks
        onRowAdd={async (row) => {
          await onCreateWorkLog({
            date:
              row.date instanceof Date
                ? row.date.toISOString().split("T")[0]
                : String(row.date),
            hours: String(row.hours),
            projectId: String(row.projectId),
            categoryId: String(row.categoryId),
            details: row.details ? String(row.details) : undefined,
          });
        }}
        onDataChange={async (editedRows) => {
          // Handle batch editing save
          for (const [id, data] of editedRows) {
            await onUpdateWorkLog(id, {
              date:
                data.date instanceof Date
                  ? data.date.toISOString().split("T")[0]
                  : data.date
                    ? String(data.date)
                    : undefined,
              hours: data.hours ? String(data.hours) : undefined,
              projectId: data.projectId ? String(data.projectId) : undefined,
              categoryId: data.categoryId ? String(data.categoryId) : undefined,
              details: data.details ? String(data.details) : null,
            });
          }
        }}
        onRowDelete={onDeleteWorkLog}
        // Custom grid options
        gridOptions={{
          animateRows: true,
          suppressRowClickSelection: false,
          singleClickEdit: true,
          stopEditingWhenCellsLoseFocus: true,
        }}
      />
    </div>
  );
}
