# EnhancedAGGrid - Generic Data Table Component

A powerful, reusable data table component built on AG Grid Community Edition with built-in features for advanced data management.

## Overview

`EnhancedAGGrid` is a generic TypeScript component that provides a feature-rich data table experience with minimal configuration. It wraps AG Grid Community Edition with commonly-needed functionality like undo/redo, batch editing, filtering, and keyboard shortcuts.

## Features

- 🎯 **Generic TypeScript Support** - Type-safe with `<T extends { id: string }>`
- ↩️ **Undo/Redo** - Built-in history management with Ctrl+Z / Ctrl+Y shortcuts
- ✏️ **Batch Editing** - Edit multiple rows before saving changes
- 🔍 **Advanced Filtering** - Quick filter, floating filters, and filter tool panel
- ⌨️ **Keyboard Shortcuts** - Ctrl+N (new), Ctrl+D (duplicate), Delete (remove)
- 📋 **Copy/Paste** - Standard clipboard operations
- 🎨 **Customizable** - Full control over columns, renderers, and styling

## Basic Usage

### 1. Define Your Data Type

```typescript
import type { Project } from "@/drizzle/schema";

// Your data type must extend { id: string }
// Project interface already has an id field
```

### 2. Create Column Definitions

```typescript
import type { ColDef } from "ag-grid-community";

const columnDefs: ColDef<Project>[] = [
  {
    headerName: "Project Name",
    field: "name",
    flex: 1,
    minWidth: 200,
    sortable: true,
    filter: true,
  },
  {
    headerName: "Description",
    field: "description",
    flex: 2,
    minWidth: 300,
    sortable: true,
    filter: true,
    valueFormatter: (params) => params.value || "-",
  },
  {
    headerName: "Status",
    field: "isActive",
    width: 120,
    sortable: true,
    filter: true,
    cellRenderer: StatusCellRenderer, // Custom renderer
  },
];
```

### 3. Use the Component

```typescript
import { EnhancedAGGrid } from "@/components/data-table/enhanced/enhanced-ag-grid";

export function ProjectTable({ projects }: { projects: Project[] }) {
  return (
    <div className="h-[600px]">
      <EnhancedAGGrid<Project>
        rowData={projects}
        columnDefs={columnDefs}
        defaultColDef={{
          sortable: true,
          resizable: true,
          filter: true,
        }}
        enableQuickFilter={true}
        enableFloatingFilter={true}
        enableFilterToolPanel={true}
      />
    </div>
  );
}
```

## Complete Example: Projects Table

See [`components/features/admin/projects/enhanced-project-table.tsx`](../../features/admin/projects/enhanced-project-table.tsx) for a full implementation example.

### Custom Cell Renderers

#### Status Badge Renderer

```typescript
import { Badge } from "@/components/ui/badge";
import type { ICellRendererParams } from "ag-grid-community";

const StatusCellRenderer = useCallback(
  (params: ICellRendererParams<Project>) => {
    const isActive = params.value as boolean;
    return (
      <div className="flex h-full items-center">
        <Badge variant={isActive ? "success" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
    );
  },
  [],
);
```

#### Actions Cell Renderer

```typescript
const ActionsCellRenderer = useCallback(
  (params: ICellRendererParams<Project>) => {
    const project = params.data;
    if (!project) return null;

    return (
      <div className="flex h-full items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(project);
          }}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(project);
          }}
          className="text-destructive"
        >
          Delete
        </Button>
      </div>
    );
  },
  [],
);
```

### Grid Event Handlers

```typescript
const onGridReady = useCallback((params: GridReadyEvent) => {
  // Store API reference for later use
  setGridApi(params.api);

  // Auto-size columns to fit container
  params.api.sizeColumnsToFit();
}, []);

<EnhancedAGGrid<Project>
  rowData={projects}
  columnDefs={columnDefs}
  onGridReady={onGridReady}
  // ... other props
/>
```

## Configuration Options

### Essential Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rowData` | `T[]` | required | Array of data objects to display |
| `columnDefs` | `ColDef<T>[]` | required | Column definitions |
| `defaultColDef` | `ColDef` | `{}` | Default column properties |

### Feature Toggles

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableToolbar` | `boolean` | `true` | Show toolbar with action buttons |
| `enableUndoRedo` | `boolean` | `true` | Enable undo/redo functionality |
| `batchEditingEnabled` | `boolean` | `false` | Enable batch editing mode |
| `enableQuickFilter` | `boolean` | `true` | Show quick filter search box |
| `enableFloatingFilter` | `boolean` | `true` | Show column-level filter inputs |
| `enableFilterToolPanel` | `boolean` | `false` | Show advanced filter panel |

### Callbacks

| Prop | Type | Description |
|------|------|-------------|
| `onDataChange` | `(data: T[]) => void` | Called when row data changes |
| `onRowAdd` | `() => void` | Called when add button clicked |
| `onRowDelete` | `(rows: T[]) => void` | Called when delete triggered |
| `onGridReady` | `(event: GridReadyEvent) => void` | Called when grid initializes |
| `onCellEditingStopped` | `(event) => void` | Called after cell edit completes |

### Advanced Options

| Prop | Type | Description |
|------|------|-------------|
| `gridOptions` | `GridOptions<T>` | Additional AG Grid options |
| `maxUndoRedoSteps` | `number` | Maximum undo/redo history (default: 20) |
| `getRowClass` | `(params) => string` | Custom row CSS classes |
| `getRowHeight` | `(params) => number` | Dynamic row height |

## Keyboard Shortcuts

When toolbar is enabled:

- **Ctrl+Z** - Undo last change
- **Ctrl+Y** - Redo undone change
- **Ctrl+N** - Add new row (triggers `onRowAdd`)
- **Ctrl+D** - Duplicate selected row
- **Delete** - Delete selected rows

## Simple vs Full-Featured Examples

### Simple Read-Only Table

```typescript
<EnhancedAGGrid<Project>
  rowData={projects}
  columnDefs={columnDefs}
  enableToolbar={false}
  enableUndoRedo={false}
  batchEditingEnabled={false}
  enableQuickFilter={true}
  enableFloatingFilter={true}
/>
```

### Full-Featured Editable Table

```typescript
<EnhancedAGGrid<WorkLog>
  rowData={workLogs}
  columnDefs={columnDefs}
  onDataChange={handleDataChange}
  onRowAdd={handleAdd}
  onRowDelete={handleDelete}
  enableToolbar={true}
  enableUndoRedo={true}
  batchEditingEnabled={true}
  enableQuickFilter={true}
  enableFloatingFilter={true}
  enableFilterToolPanel={true}
  maxUndoRedoSteps={50}
/>
```

## Column Definition Patterns

### Text Column

```typescript
{
  headerName: "Name",
  field: "name",
  flex: 1,
  minWidth: 200,
  sortable: true,
  filter: true,
}
```

### Date Column

```typescript
{
  headerName: "Created At",
  field: "createdAt",
  width: 150,
  sortable: true,
  filter: "agDateColumnFilter",
  valueFormatter: (params) => {
    if (!params.value) return "";
    return new Date(params.value).toLocaleDateString();
  },
}
```

### Custom Renderer Column

```typescript
{
  headerName: "Status",
  field: "isActive",
  width: 120,
  cellRenderer: StatusCellRenderer,
  sortable: true,
  filter: true,
}
```

### Actions Column (Pinned Right)

```typescript
{
  headerName: "Actions",
  cellRenderer: ActionsCellRenderer,
  width: 150,
  sortable: false,
  filter: false,
  pinned: "right",
  cellClass: "actions-cell",
}
```

## Styling

EnhancedAGGrid uses Tailwind CSS classes and CSS custom properties for theming:

```css
/* Custom AG Grid theme variables are defined in globals.css */
/* The component automatically adapts to light/dark mode */
```

### Custom Row Styling

```typescript
getRowClass: (params) => {
  if (params.data?.isActive === false) {
    return "opacity-50";
  }
  return "";
}
```

### Custom Row Heights

```typescript
getRowHeight: (params) => {
  // Dynamic height based on content
  if (params.data?.hasMultilineContent) {
    return 80;
  }
  return 40;
}
```

## Integration with Server Actions

When using Next.js Server Actions:

```typescript
// In your page component
export function ProjectsClient({
  initialProjects,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
}: ProjectsClientProps) {
  const handleCreate = async (data: CreateProjectData) => {
    try {
      await onCreateProject(data);
      toast.success("Project created");
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  return (
    <EnhancedProjectTable
      projects={initialProjects}
      onCreateProject={handleCreate}
      onUpdateProject={onUpdateProject}
      onDeleteProject={onDeleteProject}
    />
  );
}
```

## Performance Considerations

1. **Memoize Column Definitions**: Use `useMemo` to prevent unnecessary re-renders
2. **Memoize Cell Renderers**: Use `useCallback` for custom renderers
3. **Virtualization**: AG Grid automatically virtualizes rows for large datasets
4. **Filter Performance**: Use server-side filtering for datasets > 10,000 rows

## Best Practices

1. ✅ Always specify `id` field in your data type
2. ✅ Use `useMemo` for `columnDefs` and `defaultColDef`
3. ✅ Use `useCallback` for custom cell renderers
4. ✅ Set explicit container height (e.g., `h-[600px]`)
5. ✅ Use `flex` for responsive column widths
6. ✅ Enable relevant filters based on data type
7. ❌ Don't modify `rowData` prop directly
8. ❌ Don't use inline functions for `cellRenderer`

## Related Components

- **EnhancedWorkLogTable** - Full example with batch editing ([`components/features/work-logs/enhanced-work-log-table.tsx`](../../features/work-logs/enhanced-work-log-table.tsx))
- **EnhancedProjectTable** - Simple CRUD example ([`components/features/admin/projects/enhanced-project-table.tsx`](../../features/admin/projects/enhanced-project-table.tsx))

## AG Grid Documentation

For advanced features and configuration, refer to the official AG Grid documentation:
- [Column Definitions](https://www.ag-grid.com/react-data-grid/column-definitions/)
- [Cell Rendering](https://www.ag-grid.com/react-data-grid/component-cell-renderer/)
- [Cell Editing](https://www.ag-grid.com/react-data-grid/cell-editing/)
- [Filtering](https://www.ag-grid.com/react-data-grid/filtering/)
- [Sorting](https://www.ag-grid.com/react-data-grid/row-sorting/)

## Issue Tracking

This component addresses Issue #88: Generic DataTable component extraction and reusability.

## License

This component uses AG Grid Community Edition (MIT License).
