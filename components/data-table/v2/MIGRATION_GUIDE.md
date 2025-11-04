# EnhancedAGGrid V1 → V2 Migration Guide

## Overview

This guide provides step-by-step instructions for migrating from EnhancedAGGrid (V1) to EnhancedAGGridV2 with the new pluggable architecture.

## Key Benefits of V2

✅ **Modular feature system** - Each feature is an independent, testable hook
✅ **Better separation of concerns** - Clear boundaries between features
✅ **Easier testing** - Test features in isolation
✅ **More flexible configuration** - Enable/disable features as needed
✅ **Improved performance** - Optimized hook composition
✅ **TypeScript-first** - Better type safety and autocomplete

## Breaking Changes

### 1. Component Import

```diff
- import { EnhancedAGGrid } from '@/components/data-table/enhanced/enhanced-ag-grid';
+ import { EnhancedAGGridV2 } from '@/components/data-table/v2';
```

### 2. Component Props

V2 uses a more explicit, flat prop structure:

```diff
- <EnhancedAGGrid
-   rowData={data}
-   onRowAdd={handleAdd}
-   onDataChange={handleDataChange}
-   enableToolbar={true}
-   enableUndoRedo={true}
- />
+ <EnhancedAGGridV2
+   data={data}
+   columns={columnDefs}
+   enableSorting={true}
+   enableFiltering={true}
+   enableSelection={true}
+   enableBatchEditing={true}
+   enableUndoRedo={true}
+   enableRowActions={true}
+   enableToolbar={true}
+   enableClipboard={true}
+   onRowAdd={handleAdd}
+   onRowUpdate={handleUpdate}
+   onRowDelete={handleDelete}
+ />
```

### 3. Feature Control

V2 provides granular control over each feature:

| Feature | V1 | V2 |
|---------|-----|-----|
| Sorting | Always enabled | `enableSorting={true}` |
| Filtering | Always enabled | `enableFiltering={true}` |
| Pagination | Not available | `enablePagination={true}` |
| Selection | Always enabled | `enableSelection={true}` |
| Batch Editing | Via `batchEditingEnabled` | `enableBatchEditing={true}` |
| Undo/Redo | Via `enableUndoRedo` | `enableUndoRedo={true}` |
| Row Actions | Always available | `enableRowActions={true}` |
| Clipboard | Always enabled | `enableClipboard={true}` |

## Migration Steps

### Step 1: Update Imports

```typescript
// Before
import { EnhancedAGGrid } from '@/components/data-table/enhanced/enhanced-ag-grid';

// After
import { EnhancedAGGridV2 } from '@/components/data-table/v2';
```

### Step 2: Rename Props

Update component props according to the new API:

```typescript
// Before (V1)
interface OldProps {
  rowData: WorkLog[];
  onDataChange?: (data: WorkLog[]) => void;
  onRowAdd?: (newRows: WorkLog[]) => Promise<void>;
  onRowUpdate?: (updates: Array<{ id: string; data: Partial<WorkLog> }>) => Promise<void>;
  onRowDelete?: (ids: string[]) => Promise<void>;
  batchEditingEnabled?: boolean;
  enableToolbar?: boolean;
  enableUndoRedo?: boolean;
  maxUndoRedoSteps?: number;
}

// After (V2)
interface NewProps {
  data: WorkLog[];
  columns: ColDef[];
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableSelection?: boolean;
  enableBatchEditing?: boolean;
  enableUndoRedo?: boolean;
  enableRowActions?: boolean;
  enableToolbar?: boolean;
  enableClipboard?: boolean;
  onRowAdd?: (row: WorkLog) => void | Promise<void>;
  onRowDelete?: (rowId: string) => void | Promise<void>;
  onRowDeleteBatch?: (rowIds: string[]) => void | Promise<void>;
  onRowDuplicate?: (row: WorkLog) => void | Promise<void>;
  onDataChange?: (editedRows: Map<string, WorkLog>) => Promise<void>;
  onGridReady?: (params: GridReadyEvent) => void;
  onSelectionChange?: (selectedRows: WorkLog[]) => void;
  gridOptions?: GridOptions;
  defaultColDef?: ColDef;
}
```

### Step 3: Update Callbacks

V2 callbacks have cleaner signatures:

```typescript
// Before (V1)
const handleRowAdd = async (newRows: WorkLog[]) => {
  for (const row of newRows) {
    await createWorkLog(row);
  }
};

const handleRowDelete = async (ids: string[]) => {
  for (const id of ids) {
    await deleteWorkLog(id);
  }
};

// After (V2)
const handleRowAdd = async (row: WorkLog) => {
  await createWorkLog(row);
};

const handleRowDelete = async (rowId: string) => {
  await deleteWorkLog(rowId);
};

const handleRowDeleteBatch = async (rowIds: string[]) => {
  await Promise.all(rowIds.map(id => deleteWorkLog(id)));
};
```

### Step 4: Column Definitions

Column definitions remain largely compatible, but V2 handles some features automatically:

```typescript
const columnDefs: ColDef[] = [
  {
    headerName: "Date",
    field: "date",
    width: 120,
    sort: "desc",
    // V2 automatically handles sorting if enableSorting={true}
  },
  {
    headerName: "Hours",
    field: "hours",
    width: 100,
    // V2 automatically handles filtering if enableFiltering={true}
  },
  // ... other columns
];
```

### Step 5: Feature-Specific Configuration

V2 allows you to configure features individually:

```typescript
<EnhancedAGGridV2
  data={workLogs}
  columns={columnDefs}
  // Sorting
  enableSorting={true}
  initialSort={[{ column: 'date', direction: 'desc' }]}
  // Filtering
  enableFiltering={true}
  // Pagination
  enablePagination={true}
  pageSize={50}
  // Selection
  enableSelection={true}
  onSelectionChange={(selectedRows) => console.log(selectedRows)}
  // Batch Editing
  enableBatchEditing={true}
  onDataChange={async (editedRows) => {
    // editedRows is a Map<string, WorkLog>
    for (const [id, data] of editedRows) {
      await updateWorkLog(id, data);
    }
  }}
  // Undo/Redo
  enableUndoRedo={true}
  maxUndoRedoSteps={20}
  // Row Actions
  enableRowActions={true}
  onRowAdd={handleRowAdd}
  onRowDelete={handleRowDelete}
  onRowDeleteBatch={handleRowDeleteBatch}
  onRowDuplicate={handleRowDuplicate}
/>
```

## Complete Example

### Before (V1)

```typescript
import { EnhancedAGGrid } from '@/components/data-table/enhanced/enhanced-ag-grid';

export function WorkLogTable({ workLogs, onUpdate }: Props) {
  return (
    <EnhancedAGGrid
      rowData={workLogs}
      columnDefs={columnDefs}
      defaultColDef={defaultColDef}
      onRowAdd={handleRowAdd}
      onRowDelete={handleRowDelete}
      onDataChange={handleDataChange}
      batchEditingEnabled={batchMode}
      enableToolbar={true}
      enableUndoRedo={true}
      maxUndoRedoSteps={20}
    />
  );
}
```

### After (V2)

```typescript
import { EnhancedAGGridV2 } from '@/components/data-table/v2';

export function WorkLogTable({ workLogs, onUpdate }: Props) {
  return (
    <EnhancedAGGridV2
      data={workLogs}
      columns={columnDefs}
      enableSorting={true}
      enableFiltering={true}
      enableSelection={true}
      enableBatchEditing={batchMode}
      enableUndoRedo={true}
      enableRowActions={true}
      enableToolbar={true}
      enableClipboard={true}
      initialSort={[{ column: 'date', direction: 'desc' }]}
      maxUndoRedoSteps={20}
      onRowAdd={async (row) => {
        await createWorkLog(row);
      }}
      onRowUpdate={async (id, data) => {
        await updateWorkLog(id, data);
      }}
      onRowDelete={async (rowId) => {
        await deleteWorkLog(rowId);
      }}
      onRowDeleteBatch={async (rowIds) => {
        await Promise.all(rowIds.map(id => deleteWorkLog(id)));
      }}
      onDataChange={async (editedRows) => {
        for (const [id, data] of editedRows) {
          await updateWorkLog(id, data);
        }
      }}
      gridOptions={{
        animateRows: true,
        suppressRowClickSelection: batchMode,
        singleClickEdit: batchMode,
      }}
    />
  );
}
```

## Testing

After migration, verify the following:

1. **Data Display**: All columns render correctly
2. **Sorting**: Click column headers to sort
3. **Filtering**: Use quick filter or column filters
4. **Selection**: Select rows using checkboxes
5. **Batch Editing**: Enable batch edit mode and modify cells
6. **Undo/Redo**: Test Ctrl+Z and Ctrl+Y shortcuts
7. **Row Actions**: Test add, delete, and duplicate operations
8. **Clipboard**: Test Ctrl+C and Ctrl+V in cells
9. **Keyboard Shortcuts**: Test all keyboard shortcuts
10. **Save/Cancel**: Test batch save and cancel operations

## Troubleshooting

### Issue: Type errors with callbacks

**Problem**: TypeScript errors when passing callbacks

**Solution**: Use explicit type annotations or type assertions:

```typescript
onRowAdd={async (row: WorkLog) => {
  await createWorkLog(row);
}}
```

### Issue: Features not working

**Problem**: Feature appears enabled but doesn't work

**Solution**: Ensure both the feature is enabled AND the appropriate callback is provided:

```typescript
enableRowActions={true}  // Enable the feature
onRowAdd={handleRowAdd}   // Provide the callback
onRowDelete={handleRowDelete}
```

### Issue: Performance degradation

**Problem**: Grid feels slower after migration

**Solution**: Disable unused features to improve performance:

```typescript
enablePagination={false}  // Disable if not needed
enableFilteringfalse}    // Disable if using custom filters
```

## Advanced: Custom Feature Hooks

V2's architecture allows you to create custom feature hooks. See the Phase 2 implementation for examples:

- `components/data-table/hooks/use-sorting-feature.ts`
- `components/data-table/hooks/use-filtering-feature.ts`
- `components/data-table/hooks/use-pagination-feature.ts`
- `components/data-table/hooks/use-selection-feature.ts`
- `components/data-table/hooks/use-editing-feature.ts`
- `components/data-table/hooks/use-undo-redo-feature.ts`
- `components/data-table/hooks/use-row-actions-feature.ts`

## Need Help?

- Check the usage example: `components/data-table/v2/examples/work-log-example.tsx`
- Review the Phase 2 feature hooks for implementation details
- Consult the TypeScript types in `components/data-table/hooks/types.ts`

## Timeline

- **Phase 1**: Core feature hooks (Completed - Issue #103)
- **Phase 2**: Advanced feature hooks (Completed - Issue #104)
- **Phase 3**: V2 component (Completed - Issue #105)
- **Phase 4**: Full migration of all tables (Upcoming)

---

**Last Updated**: 2025-01-04
**Version**: 1.0.0
**Related Issues**: #90, #103, #104, #105
