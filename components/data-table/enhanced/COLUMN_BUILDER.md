# Type-Safe Column Builder System

A type-safe, fluent API for building AG Grid column definitions with reduced boilerplate and improved developer experience.

## Overview

The Column Builder System provides three main components:

1. **Column Builder** - Fluent API for building column definitions
2. **Column Presets** - Pre-configured common column types
3. **Validators** - Reusable validation functions

## Benefits

- ✅ **Type Safety** - Full TypeScript support with type inference
- ✅ **Reduced Boilerplate** - Less code, more readable
- ✅ **Reusability** - Share common patterns across tables
- ✅ **Consistency** - Standard configurations for common types
- ✅ **Validation** - Built-in validator system with visual feedback
- ✅ **Maintainability** - Centralized column logic

## Quick Start

### Basic Column with Builder

```typescript
import { createColumnDef } from "@/components/data-table/enhanced/column-builder";
import type { Project } from "@/drizzle/schema";

const nameColumn = createColumnDef<Project>()
  .field('name')
  .header('Project Name')
  .flex(1)
  .minWidth(200)
  .sortable(true)
  .filter(true)
  .build();
```

### Using Column Presets

```typescript
import {
  createTextColumn,
  createDateColumn,
  createSelectColumn,
  createBooleanColumn,
  createActionsColumn,
} from "@/components/data-table/enhanced/column-presets";
import type { WorkLog } from "@/drizzle/schema";

const columns: ColDef<WorkLog>[] = [
  // Text column with validation
  createTextColumn<WorkLog>({
    field: 'details',
    header: 'Details',
    flex: 1,
    minWidth: 200,
    editable: true,
    maxLength: 500,
    multiline: true,
  }),

  // Date column with custom format
  createDateColumn<WorkLog>({
    field: 'date',
    header: 'Date',
    width: 120,
    editable: true,
    sort: 'desc',
    dateFormat: 'slash', // YYYY/MM/DD
  }),

  // Select column with options
  createSelectColumn<WorkLog>({
    field: 'projectId',
    header: 'Project',
    width: 200,
    editable: true,
    options: projects.map(p => ({ id: p.id, name: p.name })),
  }),

  // Boolean column with custom renderer
  createBooleanColumn<Project>({
    field: 'isActive',
    header: 'Status',
    width: 120,
    customRenderer: (params) => (
      <Badge variant={params.value ? "success" : "secondary"}>
        {params.value ? 'Active' : 'Inactive'}
      </Badge>
    ),
  }),

  // Actions column
  createActionsColumn<Project>({
    width: 150,
    pinned: 'right',
    cellRenderer: (params) => (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => handleEdit(params.data)}>
          Edit
        </Button>
        <Button size="sm" onClick={() => handleDelete(params.data)}>
          Delete
        </Button>
      </div>
    ),
  }),
];
```

## Column Builder API

### Field Configuration

```typescript
createColumnDef<TData>()
  .field('fieldName')           // Field name from data object
  .header('Header Name')        // Column header text
  .width(150)                   // Fixed width in pixels
  .minWidth(100)                // Minimum width
  .flex(1)                      // Responsive flex width
```

### Display Configuration

```typescript
createColumnDef<TData>()
  .sortable(true)               // Enable sorting
  .filter(true)                 // Enable filtering (or pass filter type string)
  .resizable(true)              // Enable column resizing
  .hide(false)                  // Hide column
  .pinned('left')               // Pin to left or right
  .sort('desc')                 // Default sort order
```

### Editing Configuration

```typescript
createColumnDef<TData>()
  .editable(true)               // Enable editing
  .editor('agTextCellEditor')   // Set editor type
  .editorParams({ maxLength: 100 }) // Editor parameters
```

### Value Formatting

```typescript
createColumnDef<TData>()
  .formatter((params) => {
    // Format value for display
    return params.value?.toString() || '-';
  })
  .getter((params) => {
    // Get value from data
    return params.data.someField;
  })
  .setter((params) => {
    // Set value in data
    params.data.someField = params.newValue;
    return true;
  })
  .parser((params) => {
    // Parse edited value
    return parseFloat(params.newValue);
  })
```

### Validation

```typescript
import { required, numberRange, combine } from "@/components/data-table/enhanced/validators";

createColumnDef<WorkLog>()
  .field('hours')
  .header('Hours')
  .editable(true)
  .validator(combine([
    required('Hours is required'),
    numberRange(0, 168, 'Hours must be 0-168')
  ]))
  .build();
```

### Custom Rendering

```typescript
createColumnDef<Project>()
  .field('isActive')
  .header('Status')
  .renderer((params) => {
    return (
      <Badge variant={params.value ? "success" : "secondary"}>
        {params.value ? 'Active' : 'Inactive'}
      </Badge>
    );
  })
  .build();
```

### Styling

```typescript
createColumnDef<TData>()
  .cellClass('custom-cell')     // CSS class name
  .cellClass((params) => {      // Dynamic class
    return params.value > 0 ? 'positive' : 'negative';
  })
  .cellStyle({                  // CSS style object
    fontWeight: 'bold',
    color: 'blue'
  })
  .cellStyle((params) => {      // Dynamic style
    return params.value > 0
      ? { color: 'green' }
      : { color: 'red' };
  })
  .build();
```

## Column Presets

### Text Column

```typescript
createTextColumn<TData>({
  field: 'name',
  header: 'Name',
  flex: 1,
  minWidth: 200,
  editable: true,
  maxLength: 100,
  multiline: false,        // Use large text editor if true
  defaultValue: '-',       // Display when empty
})
```

### Number Column

```typescript
createNumberColumn<TData>({
  field: 'hours',
  header: 'Hours',
  width: 100,
  editable: true,
  min: 0,
  max: 24,
  decimals: 2,
})
```

### Date Column

```typescript
createDateColumn<TData>({
  field: 'date',
  header: 'Date',
  width: 120,
  editable: true,
  sort: 'desc',
  dateFormat: 'slash',     // 'slash' (YYYY/MM/DD) or 'hyphen' (YYYY-MM-DD)
  customEditor: CustomDateEditor, // Optional custom editor component
})
```

### Select Column

```typescript
createSelectColumn<TData>({
  field: 'projectId',
  header: 'Project',
  width: 200,
  editable: true,
  options: projects.map(p => ({ id: p.id, name: p.name })),
  hide: false,
})
```

### Boolean Column

```typescript
createBooleanColumn<TData>({
  field: 'isActive',
  header: 'Active',
  width: 120,
  trueLabel: 'Yes',
  falseLabel: 'No',
  customRenderer: (params) => (
    <Badge variant={params.value ? "success" : "secondary"}>
      {params.value ? 'Active' : 'Inactive'}
    </Badge>
  ),
})
```

### Actions Column

```typescript
createActionsColumn<TData>({
  header: 'Actions',
  width: 150,
  pinned: 'right',
  cellRenderer: (params) => (
    <div className="flex gap-2">
      <Button onClick={() => handleEdit(params.data)}>Edit</Button>
      <Button onClick={() => handleDelete(params.data)}>Delete</Button>
    </div>
  ),
})
```

### Checkbox Column

```typescript
createCheckboxColumn({
  width: 50,
  headerCheckboxSelection: true,
})
```

## Validators

### Built-in Validators

```typescript
import {
  required,
  stringLength,
  numberRange,
  pattern,
  isValidDate,
  dateRange,
  isUUID,
  isEmail,
  combine,
  custom,
} from "@/components/data-table/enhanced/validators";

// Required field
required('This field is required')

// String length
stringLength(1, 100, 'Must be 1-100 characters')

// Number range
numberRange(0, 168, 'Must be 0-168')

// Pattern (regex)
pattern(/^\d+(\.\d{1,2})?$/, 'Invalid decimal format')

// Date validation
isValidDate('Invalid date')

// Date range
dateRange(
  new Date('2024-01-01'),
  new Date('2024-12-31'),
  'Date must be in 2024'
)

// UUID format
isUUID('Invalid UUID')

// Email format
isEmail('Invalid email')

// Custom validator
custom(
  (value) => value > 0 && value <= 24,
  'Value must be 1-24'
)

// Combine multiple validators
combine([
  required('Required'),
  pattern(/^\d+(\.\d{1,2})?$/, 'Invalid format'),
  numberRange(0, 168, 'Must be 0-168')
])
```

### Custom Validator

```typescript
import type { ValidationResult } from "@/components/data-table/enhanced/column-builder";

function myValidator(value: unknown): ValidationResult {
  if (/* validation logic */) {
    return { valid: true };
  }
  return { valid: false, message: 'Validation failed' };
}

const column = createColumnDef<TData>()
  .field('myField')
  .validator(myValidator)
  .build();
```

## Complete Example

### Before (Traditional Approach)

```typescript
const columnDefs: ColDef<WorkLog>[] = [
  {
    headerName: "Date",
    field: "date",
    width: 120,
    editable: true,
    sortable: true,
    filter: "agDateColumnFilter",
    sort: "desc",
    valueFormatter: (params) => {
      if (!params.value) return "";
      return new Date(params.value).toLocaleDateString();
    },
    cellClass: (params) => {
      const validation = validateDate(params.value);
      return validation.valid ? "" : "ag-cell-invalid";
    },
    tooltipValueGetter: (params) => {
      const validation = validateDate(params.value);
      return validation.message || "";
    },
  },
  {
    headerName: "Hours",
    field: "hours",
    width: 100,
    editable: true,
    sortable: true,
    filter: "agNumberColumnFilter",
    cellEditor: "agTextCellEditor",
    valueParser: (params) => {
      const num = parseFloat(params.newValue);
      if (Number.isNaN(num) || num < 0 || num > 168) {
        return params.oldValue;
      }
      return params.newValue;
    },
    cellClass: (params) => {
      const validation = validateHours(params.value);
      return validation.valid ? "" : "ag-cell-invalid";
    },
    tooltipValueGetter: (params) => {
      const validation = validateHours(params.value);
      return validation.message || "";
    },
  },
  // ... more columns
];
```

### After (With Column Builder)

```typescript
import {
  createDateColumn,
  createNumberColumn,
  createSelectColumn,
} from "@/components/data-table/enhanced/column-presets";
import { required, numberRange, combine } from "@/components/data-table/enhanced/validators";

const columnDefs: ColDef<WorkLog>[] = [
  createDateColumn<WorkLog>({
    field: 'date',
    header: 'Date',
    width: 120,
    editable: true,
    sort: 'desc',
  }),

  createNumberColumn<WorkLog>({
    field: 'hours',
    header: 'Hours',
    width: 100,
    editable: true,
    min: 0,
    max: 168,
    decimals: 2,
  }),

  createSelectColumn<WorkLog>({
    field: 'projectId',
    header: 'Project',
    width: 200,
    editable: true,
    options: projects.map(p => ({ id: p.id, name: p.name })),
  }),
];
```

**Result**: ~60% less code, better type safety, and improved readability!

## Migration Guide

### Step 1: Import the utilities

```typescript
import { createColumnDef } from "@/components/data-table/enhanced/column-builder";
import {
  createTextColumn,
  createDateColumn,
  createNumberColumn,
  createSelectColumn,
  createActionsColumn,
} from "@/components/data-table/enhanced/column-presets";
import {
  required,
  numberRange,
  stringLength,
  combine,
} from "@/components/data-table/enhanced/validators";
```

### Step 2: Replace column definitions

Identify patterns in your existing columns and replace them with presets or builder:

**Old**:
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

**New**:
```typescript
createTextColumn<Project>({
  field: 'name',
  header: 'Name',
  flex: 1,
  minWidth: 200,
})
```

### Step 3: Add validation

If your columns have validation logic, move it to validators:

**Old**:
```typescript
valueParser: (params) => {
  const num = parseFloat(params.newValue);
  if (Number.isNaN(num) || num < 0 || num > 24) {
    return params.oldValue;
  }
  return params.newValue;
}
```

**New**:
```typescript
createNumberColumn<WorkLog>({
  field: 'hours',
  header: 'Hours',
  editable: true,
  min: 0,
  max: 24,
})
```

### Step 4: Test thoroughly

- Verify all columns render correctly
- Test editing functionality
- Validate error messages appear
- Check sorting and filtering

## Best Practices

1. **Use Presets First** - Try using column presets before building custom columns
2. **Combine Validators** - Use `combine()` to group related validations
3. **Memoize Columns** - Wrap column definitions in `useMemo` to prevent recreations
4. **Type Safety** - Always specify the data type: `createColumnDef<YourType>()`
5. **Consistent Naming** - Use consistent field names and headers across tables
6. **Documentation** - Add comments for complex column configurations

## TypeScript Tips

### Type Inference

The builder automatically infers types from your data type:

```typescript
interface WorkLog {
  id: string;
  date: Date;
  hours: string;
  projectId: string;
}

// TypeScript knows 'hours' is a string
const column = createColumnDef<WorkLog>()
  .field('hours')  // ✅ Type-safe field selection
  .formatter((params) => {
    // params.value is automatically typed as string
    return params.value || '0';
  })
  .build();
```

### Custom Types

For complex scenarios, you can specify the value type explicitly:

```typescript
const column = createColumnDef<WorkLog, number>()
  .getter((params) => parseFloat(params.data.hours))
  .formatter((params) => params.value.toFixed(2))
  .build();
```

## Troubleshooting

### Validation not showing

Make sure your column is in edit mode or batch editing is enabled. Validators only show feedback during editing.

### Type errors with custom renderers

Ensure your renderer function signature matches:

```typescript
(params: ICellRendererParams<TData, TValue>) => JSX.Element | string | null
```

### Column not editable

Check that:
1. `.editable(true)` is set
2. Batch editing is enabled (if using batch mode)
3. Editor type is specified for custom editors

## Performance Considerations

- **Memoization**: Always wrap column definitions in `useMemo`
- **Renderers**: Use `useCallback` for custom cell renderers
- **Validators**: Keep validation logic simple and fast
- **Presets**: Use presets instead of building from scratch when possible

## Related Documentation

- [EnhancedAGGrid README](./README.md)
- [ADR-006: AG Grid Standard Compliance](../../../docs/adr/006-ag-grid-standard-compliance.md)
- [AG Grid Column Definitions](https://www.ag-grid.com/react-data-grid/column-definitions/)

## Issue Tracking

This component addresses Issue #89: Type-safe column configuration system.
