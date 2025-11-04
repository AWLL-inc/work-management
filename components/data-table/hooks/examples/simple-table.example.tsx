/**
 * Simple table example using pluggable feature hooks
 *
 * This example demonstrates how to use the composable table feature system
 * to build a basic data table with sorting, filtering, and pagination.
 *
 * @example
 * ```tsx
 * <SimpleTableExample data={projects} />
 * ```
 */

"use client";

import type { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  useDataTable,
  useFilteringFeature,
  usePaginationFeature,
  useSortingFeature,
} from "../index";

/**
 * Example data type
 */
interface Project {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Example column definitions
 */
const columns: ColDef<Project>[] = [
  {
    field: "name",
    headerName: "Project Name",
    flex: 1,
    sortable: true,
    filter: true,
  },
  {
    field: "description",
    headerName: "Description",
    flex: 2,
    sortable: true,
    filter: true,
  },
  {
    field: "isActive",
    headerName: "Status",
    width: 120,
    sortable: true,
    filter: true,
    valueFormatter: (params) => (params.value ? "Active" : "Inactive"),
  },
  {
    field: "createdAt",
    headerName: "Created",
    width: 150,
    sortable: true,
    filter: "agDateColumnFilter",
    valueFormatter: (params) => {
      if (!params.value) return "";
      return new Date(params.value).toLocaleDateString();
    },
  },
];

/**
 * Example component props
 */
interface SimpleTableExampleProps {
  data: Project[];
}

/**
 * Simple table example component
 *
 * This demonstrates the basic usage of the pluggable feature hooks:
 * 1. Initialize individual feature hooks with configuration
 * 2. Pass features to useDataTable
 * 3. Spread gridProps onto AgGridReact
 * 4. Optionally use toolbarProps for custom toolbar
 *
 * @param props - Component props with data
 * @returns Rendered table component
 */
export function SimpleTableExample({ data }: SimpleTableExampleProps) {
  // Initialize feature hooks with configuration
  const sorting = useSortingFeature({
    multiSort: true,
    initialSort: [{ column: "createdAt", direction: "desc" }],
    maxSortColumns: 3,
  });

  const filtering = useFilteringFeature({
    mode: "both",
    debounce: 300,
    enableFloatingFilter: true,
  });

  const pagination = usePaginationFeature(
    {
      mode: "client",
      pageSize: 20,
      pageSizeOptions: [10, 20, 50, 100],
    },
    data.length,
  );

  // Combine features with useDataTable
  const table = useDataTable({
    data,
    columns,
    features: {
      sorting,
      filtering,
      pagination,
    },
    gridOptions: {
      rowHeight: 40,
      animateRows: true,
    },
  });

  return (
    <div className="space-y-4">
      {/* Optional: Custom toolbar using feature hooks directly */}
      <div className="flex items-center gap-4">
        {/* Quick filter input */}
        <input
          type="text"
          placeholder="Search..."
          className="border rounded px-3 py-2"
          value={filtering.state.quickFilterText}
          onChange={(e) => filtering.actions.setQuickFilter(e.target.value)}
        />

        {/* Clear filters button */}
        <button
          type="button"
          className="border rounded px-3 py-2"
          onClick={() => filtering.actions.clearFilters()}
        >
          Clear Filters
        </button>

        {/* Pagination info */}
        <div className="ml-auto text-sm text-gray-600">
          Page {pagination.state.currentPage + 1} of{" "}
          {pagination.state.totalPages} ({pagination.state.totalRows} total)
        </div>
      </div>

      {/* AG Grid component */}
      <div className="ag-theme-alpine" style={{ height: 500 }}>
        <AgGridReact {...table.gridProps} />
      </div>

      {/* Optional: Custom pagination controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="border rounded px-3 py-2"
            onClick={() => pagination.actions.firstPage()}
            disabled={pagination.state.currentPage === 0}
          >
            First
          </button>
          <button
            type="button"
            className="border rounded px-3 py-2"
            onClick={() => pagination.actions.previousPage()}
            disabled={pagination.state.currentPage === 0}
          >
            Previous
          </button>
          <button
            type="button"
            className="border rounded px-3 py-2"
            onClick={() => pagination.actions.nextPage()}
            disabled={
              pagination.state.currentPage + 1 >= pagination.state.totalPages
            }
          >
            Next
          </button>
          <button
            type="button"
            className="border rounded px-3 py-2"
            onClick={() => pagination.actions.lastPage()}
            disabled={
              pagination.state.currentPage + 1 >= pagination.state.totalPages
            }
          >
            Last
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="pageSize">Page size:</label>
          <select
            id="pageSize"
            className="border rounded px-3 py-2"
            value={pagination.state.pageSize}
            onChange={(e) =>
              pagination.actions.setPageSize(Number(e.target.value))
            }
          >
            {(pagination.config.pageSizeOptions || [10, 20, 50, 100]).map(
              (size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ),
            )}
          </select>
        </div>
      </div>
    </div>
  );
}

/**
 * Example: Minimal table with no features
 *
 * This shows that features are optional - you can create a basic table
 * without any features enabled.
 */
export function MinimalTableExample({ data }: SimpleTableExampleProps) {
  const table = useDataTable({
    data,
    columns,
  });

  return (
    <div className="ag-theme-alpine" style={{ height: 500 }}>
      <AgGridReact {...table.gridProps} />
    </div>
  );
}

/**
 * Example: Table with only sorting
 *
 * This demonstrates selective feature composition - you can mix and match
 * features as needed.
 */
export function SortOnlyTableExample({ data }: SimpleTableExampleProps) {
  const sorting = useSortingFeature({
    multiSort: false,
    initialSort: [{ column: "name", direction: "asc" }],
  });

  const table = useDataTable({
    data,
    columns,
    features: {
      sorting,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="border rounded px-3 py-2"
          onClick={() => sorting.actions.setSort("name", "asc")}
        >
          Sort by Name (A-Z)
        </button>
        <button
          type="button"
          className="border rounded px-3 py-2"
          onClick={() => sorting.actions.setSort("createdAt", "desc")}
        >
          Sort by Date (Newest)
        </button>
        <button
          type="button"
          className="border rounded px-3 py-2"
          onClick={() => sorting.actions.clearSort()}
        >
          Clear Sort
        </button>
      </div>

      <div className="ag-theme-alpine" style={{ height: 500 }}>
        <AgGridReact {...table.gridProps} />
      </div>
    </div>
  );
}
