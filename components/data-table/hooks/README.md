# Data Table Hooks - Pluggable Feature System

A composable, type-safe system for building AG Grid data tables with modular features.

## Overview

This module provides a set of React hooks that implement the **pluggable feature pattern** for data tables. Instead of creating monolithic table components, you can compose exactly the features you need using individual hooks.

### Key Benefits

- **Modularity**: Mix and match features as needed
- **Type Safety**: Full TypeScript support with strict typing
- **Reusability**: Share features across different tables
- **Testability**: Test features in isolation
- **Maintainability**: Each feature is self-contained and easy to understand

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    useDataTable                         │
│  (Main Integration Hook)                                │
│  • Merges feature gridProps                             │
│  • Merges feature toolbarProps                          │
│  • Provides unified API                                 │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┴────────┬───────────────┐
        │                 │               │
┌───────▼────────┐ ┌──────▼──────┐ ┌─────▼────────┐
│ useSortingFeature│ useFilteringFeature│ usePaginationFeature│
│ • Single/Multi   │ • Quick Filter│ • Client/Server│
│ • Toggle/Set     │ • Advanced    │ • Page Nav     │
│ • Clear          │ • Debounce    │ • Page Size    │
└──────────────────┘ └─────────────┘ └──────────────┘
```

## Quick Start

### Basic Usage

```tsx
import {
  useDataTable,
  useSortingFeature,
  useFilteringFeature,
  usePaginationFeature,
} from '@/components/data-table/hooks';
import { AgGridReact } from 'ag-grid-react';

function ProjectsTable({ projects }) {
  // Initialize feature hooks
  const sorting = useSortingFeature({
    multiSort: true,
    initialSort: [{ column: 'createdAt', direction: 'desc' }],
  });

  const filtering = useFilteringFeature({
    mode: 'both',
    debounce: 300,
  });

  const pagination = usePaginationFeature(
    { pageSize: 20 },
    projects.length
  );

  // Combine features
  const table = useDataTable({
    data: projects,
    columns: columnDefs,
    features: {
      sorting,
      filtering,
      pagination,
    },
  });

  return <AgGridReact {...table.gridProps} />;
}
```

### Minimal Table (No Features)

```tsx
function MinimalTable({ data }) {
  const table = useDataTable({
    data,
    columns: columnDefs,
  });

  return <AgGridReact {...table.gridProps} />;
}
```

### Selective Features

```tsx
function SortOnlyTable({ data }) {
  const sorting = useSortingFeature({
    initialSort: [{ column: 'name', direction: 'asc' }],
  });

  const table = useDataTable({
    data,
    columns: columnDefs,
    features: { sorting },
  });

  return <AgGridReact {...table.gridProps} />;
}
```

## API Reference

### `useDataTable`

Main integration hook that combines all features.

```tsx
const table = useDataTable<TData>({
  data: TData[],
  columns: ColDef<TData>[],
  features?: {
    sorting?: SortingFeature,
    filtering?: FilteringFeature,
    pagination?: PaginationFeature,
  },
  gridOptions?: GridOptions,
});

// Returns
{
  gridProps: Record<string, unknown>,
  toolbarProps: Record<string, unknown>,
  features: TableFeatures,
}
```

**Props:**
- `data`: Array of data objects
- `columns`: AG Grid column definitions
- `features`: Optional feature hooks to enable
- `gridOptions`: Additional AG Grid options

**Returns:**
- `gridProps`: Props to spread on `<AgGridReact>`
- `toolbarProps`: Props for custom toolbar
- `features`: Access to individual feature state and actions

### `useSortingFeature`

Provides sorting functionality with single or multi-column support.

```tsx
const sorting = useSortingFeature({
  multiSort?: boolean,          // Enable multi-column sorting (default: false)
  initialSort?: SortModel[],    // Initial sort configuration (default: [])
  maxSortColumns?: number,      // Max columns when multiSort=true (default: 3)
});

// Returns
{
  config: SortingConfig,
  state: {
    sortModel: Array<{ column: string; direction: 'asc' | 'desc' }>,
  },
  actions: {
    setSort: (column: string, direction: 'asc' | 'desc') => void,
    toggleSort: (column: string) => void,
    clearSort: () => void,
    clearColumnSort: (column: string) => void,
  },
  gridProps: Record<string, unknown>,
}
```

**Example:**
```tsx
// Set sort programmatically
sorting.actions.setSort('name', 'asc');

// Toggle sort direction
sorting.actions.toggleSort('createdAt');

// Clear all sorting
sorting.actions.clearSort();

// Access current state
console.log(sorting.state.sortModel);
```

### `useFilteringFeature`

Provides filtering with quick filter (global search) and advanced column filters.

```tsx
const filtering = useFilteringFeature({
  mode?: 'quick' | 'advanced' | 'both',  // Filter mode (default: 'both')
  debounce?: number,                      // Debounce delay in ms (default: 300)
  enableFloatingFilter?: boolean,         // Show floating filters (default: false)
  enableFilterToolPanel?: boolean,        // Show filter panel (default: false)
});

// Returns
{
  config: FilteringConfig,
  state: {
    quickFilterText: string,
    filterModel: Record<string, unknown>,
  },
  actions: {
    setQuickFilter: (text: string) => void,
    clearFilters: () => void,
    setColumnFilter: (column: string, filter: unknown) => void,
  },
  gridProps: Record<string, unknown>,
  toolbarProps: Record<string, unknown>,
}
```

**Example:**
```tsx
// Set quick filter
filtering.actions.setQuickFilter('search term');

// Clear all filters
filtering.actions.clearFilters();

// Access toolbar props for custom UI
<input
  value={filtering.state.quickFilterText}
  onChange={(e) => filtering.actions.setQuickFilter(e.target.value)}
/>
```

### `usePaginationFeature`

Provides client-side or server-side pagination.

```tsx
const pagination = usePaginationFeature(
  {
    mode?: 'client' | 'server',       // Pagination mode (default: 'client')
    pageSize?: number,                 // Items per page (default: 20)
    pageSizeOptions?: number[],        // Available page sizes (default: [10, 20, 50, 100])
    initialPage?: number,              // Starting page (default: 0)
  },
  totalRows: number,                   // Total number of rows
);

// Returns
{
  config: PaginationConfig,
  state: {
    currentPage: number,
    pageSize: number,
    totalRows: number,
    totalPages: number,
  },
  actions: {
    goToPage: (page: number) => void,
    nextPage: () => void,
    previousPage: () => void,
    firstPage: () => void,
    lastPage: () => void,
    setPageSize: (size: number) => void,
  },
  gridProps: Record<string, unknown>,
  toolbarProps: Record<string, unknown>,
}
```

**Example:**
```tsx
// Navigate pages
pagination.actions.nextPage();
pagination.actions.goToPage(5);

// Change page size
pagination.actions.setPageSize(50);

// Access state
console.log(`Page ${pagination.state.currentPage + 1} of ${pagination.state.totalPages}`);
```

## Examples

See `examples/simple-table.example.tsx` for complete working examples:

- **SimpleTableExample**: Full-featured table with all hooks
- **MinimalTableExample**: Basic table with no features
- **SortOnlyTableExample**: Selective feature composition

## Type System

All hooks follow the `TableFeatureHook` interface:

```tsx
interface TableFeatureHook<TConfig, TState, TActions> {
  config: Readonly<TConfig>;
  state: TState;
  actions: TActions;
  gridProps?: Record<string, unknown>;
  toolbarProps?: Record<string, unknown>;
}
```

This ensures consistency across all features and makes it easy to add new features in the future.

## Best Practices

### 1. Initialize hooks at component level

```tsx
// ✅ Good: Hooks at component level
function MyTable({ data }) {
  const sorting = useSortingFeature();
  const table = useDataTable({ data, columns, features: { sorting } });
  return <AgGridReact {...table.gridProps} />;
}

// ❌ Bad: Don't initialize inside useDataTable
function MyTable({ data }) {
  const table = useDataTable({
    data,
    columns,
    features: {
      sorting: useSortingFeature(), // Don't do this
    },
  });
}
```

### 2. Use feature actions for programmatic control

```tsx
function MyTable({ data }) {
  const sorting = useSortingFeature();

  // Expose actions to parent or use internally
  const handleSortByName = () => {
    sorting.actions.setSort('name', 'asc');
  };

  return (
    <>
      <button onClick={handleSortByName}>Sort by Name</button>
      <AgGridReact {...table.gridProps} />
    </>
  );
}
```

### 3. Compose features selectively

```tsx
// Only enable features you need
const table = useDataTable({
  data,
  columns,
  features: {
    sorting,           // ✅ Enabled
    filtering,         // ✅ Enabled
    // pagination,     // ❌ Not needed, don't include
  },
});
```

### 4. Access feature state safely

```tsx
// Use optional chaining for optional features
const sortedColumn = table.features.sorting?.state.sortModel[0];
const filterText = table.features.filtering?.state.quickFilterText;
```

## Testing

Each feature hook can be tested independently:

```tsx
import { renderHook, act } from '@testing-library/react';
import { useSortingFeature } from './use-sorting-feature';

test('should set sort correctly', () => {
  const { result } = renderHook(() => useSortingFeature());

  act(() => {
    result.current.actions.setSort('name', 'asc');
  });

  expect(result.current.state.sortModel).toEqual([
    { column: 'name', direction: 'asc' },
  ]);
});
```

## Future Features

Planned features for Phase 2 (Issue #104):

- `useSelectionFeature` - Row/cell selection management
- `useEditingFeature` - Inline editing with validation
- `useUndoRedoFeature` - Undo/redo for data changes
- `useRowActionsFeature` - Row-level action menus

## Migration Guide

Migrating from `EnhancedAGGrid` to the new hook system:

### Before (Monolithic)
```tsx
<EnhancedAGGrid
  data={projects}
  columns={columns}
  enableSorting
  enableFilter
  enableQuickFilter
  enablePagination
  pageSize={20}
/>
```

### After (Composable)
```tsx
function ProjectsTable() {
  const sorting = useSortingFeature();
  const filtering = useFilteringFeature({ mode: 'both' });
  const pagination = usePaginationFeature({ pageSize: 20 }, projects.length);

  const table = useDataTable({
    data: projects,
    columns,
    features: { sorting, filtering, pagination },
  });

  return <AgGridReact {...table.gridProps} />;
}
```

**Benefits:**
- More explicit feature configuration
- Access to feature state and actions
- Easier to test and maintain
- Full TypeScript support

## Related

- [Issue #103](https://github.com/your-repo/issues/103) - Phase 1 implementation
- [Issue #104](https://github.com/your-repo/issues/104) - Phase 2 advanced features
- [Issue #90](https://github.com/your-repo/issues/90) - Epic: Component reusability
- [ADR-006](../../../docs/adr/006-ag-grid-standard-compliance.md) - AG Grid standards

## License

Part of the Work Management application.
