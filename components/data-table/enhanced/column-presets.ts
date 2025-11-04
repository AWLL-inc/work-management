/**
 * Common column type presets for AG Grid
 *
 * Provides pre-configured column definitions for common data types,
 * reducing boilerplate and ensuring consistency across tables.
 */

import type React from "react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { createColumnDef } from "./column-builder";

/**
 * Options for date column preset
 */
export interface DateColumnOptions<TData> {
  field: keyof TData;
  header: string;
  width?: number;
  editable?: boolean;
  sortable?: boolean;
  sort?: "asc" | "desc";
  dateFormat?: "slash" | "hyphen";
  customEditor?: string | unknown;
}

/**
 * Create a date column with standard formatting
 *
 * @example
 * ```typescript
 * const dateColumn = createDateColumn<WorkLog>({
 *   field: 'date',
 *   header: 'Date',
 *   width: 120,
 *   editable: true,
 *   sort: 'desc'
 * });
 * ```
 */
export function createDateColumn<TData>(
  options: DateColumnOptions<TData>,
): ColDef<TData> {
  const {
    field,
    header,
    width = 150,
    editable = false,
    sortable = true,
    sort,
    dateFormat = "slash",
    customEditor,
  } = options;

  const builder = createColumnDef<TData>()
    .field(field)
    .header(header)
    .width(width)
    .sortable(sortable)
    .filter("agDateColumnFilter");

  if (editable && customEditor) {
    builder.editable(true).editor(customEditor);
  } else if (editable) {
    builder.editable(true);
  }

  if (sort) {
    builder.sort(sort);
  }

  // Add formatter to display dates consistently
  builder.formatter((params) => {
    if (!params.value) return "";

    try {
      const date =
        typeof params.value === "string"
          ? new Date(params.value.split("T")[0])
          : params.value instanceof Date
            ? params.value
            : new Date(params.value as string | number | Date);

      if (Number.isNaN(date.getTime())) return "";

      const dateStr = date.toISOString().split("T")[0];
      return dateFormat === "slash" ? dateStr.replace(/-/g, "/") : dateStr;
    } catch {
      return "";
    }
  });

  return builder.build();
}

/**
 * Options for number column preset
 */
export interface NumberColumnOptions<TData> {
  field: keyof TData;
  header: string;
  width?: number;
  editable?: boolean;
  sortable?: boolean;
  min?: number;
  max?: number;
  decimals?: number;
}

/**
 * Create a number column with standard formatting and validation
 *
 * @example
 * ```typescript
 * const hoursColumn = createNumberColumn<WorkLog>({
 *   field: 'hours',
 *   header: 'Hours',
 *   width: 100,
 *   editable: true,
 *   min: 0,
 *   max: 24,
 *   decimals: 2
 * });
 * ```
 */
export function createNumberColumn<TData>(
  options: NumberColumnOptions<TData>,
): ColDef<TData> {
  const {
    field,
    header,
    width = 100,
    editable = false,
    sortable = true,
    min,
    max,
    decimals,
  } = options;

  const builder = createColumnDef<TData>()
    .field(field)
    .header(header)
    .width(width)
    .sortable(sortable)
    .filter("agNumberColumnFilter");

  if (editable) {
    builder.editable(true).editor("agTextCellEditor");

    // Add parser for number validation
    builder.parser((params) => {
      const value = params.newValue;
      if (!value || value === "") return params.oldValue as never;

      const num = typeof value === "string" ? parseFloat(value) : value;
      if (Number.isNaN(num)) return params.oldValue as never;
      if (min !== undefined && num < min) return params.oldValue as never;
      if (max !== undefined && num > max) return params.oldValue as never;

      return (decimals !== undefined ? num.toFixed(decimals) : value) as never;
    });
  }

  return builder.build();
}

/**
 * Options for select column preset
 */
export interface SelectColumnOptions<TData> {
  field: keyof TData;
  header: string;
  width?: number;
  editable?: boolean;
  sortable?: boolean;
  options: Array<{ id: string; name: string }>;
  idField?: string;
  nameField?: string;
  hide?: boolean;
}

/**
 * Create a select column with dropdown editor
 *
 * @example
 * ```typescript
 * const projectColumn = createSelectColumn<WorkLog>({
 *   field: 'projectId',
 *   header: 'Project',
 *   width: 200,
 *   editable: true,
 *   options: projects
 * });
 * ```
 */
export function createSelectColumn<TData>(
  options: SelectColumnOptions<TData>,
): ColDef<TData> {
  const {
    field,
    header,
    width = 200,
    editable = false,
    sortable = true,
    options: selectOptions,
    hide = false,
  } = options;

  const optionsMap = new Map(selectOptions.map((opt) => [opt.id, opt.name]));

  const builder = createColumnDef<TData>()
    .field(field)
    .header(header)
    .width(width)
    .sortable(sortable)
    .filter(true)
    .hide(hide);

  if (editable) {
    builder
      .editable(true)
      .editor("agSelectCellEditor")
      .editorParams({
        values: selectOptions.map((opt) => opt.id),
        formatValue: (value: string) => optionsMap.get(value) || value,
        valueListGap: 0,
        valueListMaxHeight: 200,
      });
  }

  // Display name but store ID
  builder.formatter((params) => {
    if (!params.value) return editable ? "選択してください" : "";
    return (
      optionsMap.get(params.value as string) || params.value?.toString() || ""
    );
  });

  return builder.build();
}

/**
 * Options for text column preset
 */
export interface TextColumnOptions<TData> {
  field: keyof TData;
  header: string;
  flex?: number;
  minWidth?: number;
  width?: number;
  editable?: boolean;
  sortable?: boolean;
  maxLength?: number;
  multiline?: boolean;
  hide?: boolean;
  defaultValue?: string;
}

/**
 * Create a text column with standard configuration
 *
 * @example
 * ```typescript
 * const nameColumn = createTextColumn<Project>({
 *   field: 'name',
 *   header: 'Project Name',
 *   flex: 1,
 *   minWidth: 200,
 *   editable: true,
 *   maxLength: 100
 * });
 * ```
 */
export function createTextColumn<TData>(
  options: TextColumnOptions<TData>,
): ColDef<TData> {
  const {
    field,
    header,
    flex,
    minWidth,
    width,
    editable = false,
    sortable = true,
    maxLength,
    multiline = false,
    hide = false,
    defaultValue = "-",
  } = options;

  const builder = createColumnDef<TData>()
    .field(field)
    .header(header)
    .sortable(sortable)
    .filter(true)
    .hide(hide);

  if (flex) {
    builder.flex(flex);
  }
  if (minWidth) {
    builder.minWidth(minWidth);
  }
  if (width) {
    builder.width(width);
  }

  if (editable) {
    if (multiline) {
      builder
        .editable(true)
        .editor("agLargeTextCellEditor")
        .editorParams({
          maxLength,
          rows: 3,
          cols: 50,
        })
        .custom({
          cellEditorPopup: true,
          wrapText: true,
          autoHeight: true,
          cellStyle: {
            lineHeight: "1.4",
            padding: "8px",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          },
        });
    } else {
      builder.editable(true).editor("agTextCellEditor");
      if (maxLength) {
        builder.editorParams({ maxLength });
      }
    }
  }

  // Add formatter for empty values
  builder.formatter((params) => params.value?.toString() || defaultValue);

  return builder.build();
}

/**
 * Options for boolean column preset
 */
export interface BooleanColumnOptions<TData> {
  field: keyof TData;
  header: string;
  width?: number;
  sortable?: boolean;
  trueLabel?: string;
  falseLabel?: string;
  trueVariant?: string;
  falseVariant?: string;
  customRenderer?: (
    params: ICellRendererParams<TData>,
  ) => React.JSX.Element | string | null;
}

/**
 * Create a boolean column with badge display
 *
 * @example
 * ```typescript
 * import { Badge } from "@/components/ui/badge";
 *
 * const statusColumn = createBooleanColumn<Project>({
 *   field: 'isActive',
 *   header: 'Status',
 *   width: 120,
 *   trueLabel: 'Active',
 *   falseLabel: 'Inactive',
 *   customRenderer: (params) => (
 *     <Badge variant={params.value ? "success" : "secondary"}>
 *       {params.value ? 'Active' : 'Inactive'}
 *     </Badge>
 *   )
 * });
 * ```
 */
export function createBooleanColumn<TData>(
  options: BooleanColumnOptions<TData>,
): ColDef<TData> {
  const {
    field,
    header,
    width = 120,
    sortable = true,
    trueLabel = "Yes",
    falseLabel = "No",
    customRenderer,
  } = options;

  const builder = createColumnDef<TData>()
    .field(field)
    .header(header)
    .width(width)
    .sortable(sortable)
    .filter(true);

  if (customRenderer) {
    builder.renderer(customRenderer);
  } else {
    builder.formatter((params) => {
      const value = params.value as boolean;
      return value ? trueLabel : falseLabel;
    });
  }

  return builder.build();
}

/**
 * Options for actions column preset
 */
export interface ActionsColumnOptions<TData> {
  header?: string;
  width?: number;
  pinned?: "left" | "right";
  cellRenderer: (
    params: ICellRendererParams<TData>,
  ) => React.JSX.Element | string | null;
}

/**
 * Create an actions column with custom renderer
 *
 * @example
 * ```typescript
 * const actionsColumn = createActionsColumn<Project>({
 *   width: 150,
 *   pinned: 'right',
 *   cellRenderer: (params) => (
 *     <div className="flex gap-2">
 *       <Button size="sm" onClick={() => handleEdit(params.data)}>Edit</Button>
 *       <Button size="sm" onClick={() => handleDelete(params.data)}>Delete</Button>
 *     </div>
 *   )
 * });
 * ```
 */
export function createActionsColumn<TData>(
  options: ActionsColumnOptions<TData>,
): ColDef<TData> {
  const {
    header = "Actions",
    width = 150,
    pinned = "right",
    cellRenderer,
  } = options;

  return createColumnDef<TData>()
    .header(header)
    .width(width)
    .sortable(false)
    .filter(false)
    .pinned(pinned)
    .cellClass("actions-cell")
    .renderer(cellRenderer)
    .build();
}

/**
 * Options for checkbox selection column
 */
export interface CheckboxColumnOptions {
  width?: number;
  headerCheckboxSelection?: boolean;
}

/**
 * Create a checkbox selection column
 *
 * @example
 * ```typescript
 * const checkboxColumn = createCheckboxColumn({
 *   width: 50,
 *   headerCheckboxSelection: true
 * });
 * ```
 */
export function createCheckboxColumn(
  options: CheckboxColumnOptions = {},
): ColDef {
  const { width = 50, headerCheckboxSelection = true } = options;

  return {
    headerName: "",
    checkboxSelection: true,
    headerCheckboxSelection,
    width,
    pinned: "left",
    lockPosition: "left",
    sortable: false,
    filter: false,
  };
}
