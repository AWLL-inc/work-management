/**
 * Type-safe column definition builder for AG Grid
 *
 * Provides a fluent API for building AG Grid column definitions with full TypeScript support.
 * Reduces boilerplate and ensures type safety throughout the column configuration process.
 *
 * @example
 * ```typescript
 * const column = createColumnDef<WorkLog>()
 *   .field('date')
 *   .header('Date')
 *   .width(120)
 *   .sortable(true)
 *   .editable(true)
 *   .build();
 * ```
 */

import type {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
  ValueGetterParams,
  ValueParserParams,
  ValueSetterParams,
} from "ag-grid-community";
import type React from "react";

/**
 * Validation result from a validator function
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validator function type
 */
export type ValidatorFunction<T = unknown> = (value: T) => ValidationResult;

/**
 * Column builder class that provides a fluent API for building AG Grid column definitions
 */
export class ColumnDefBuilder<TData, TValue = unknown> {
  private colDef: ColDef<TData, TValue>;

  constructor() {
    this.colDef = {} as ColDef<TData, TValue>;
  }

  /**
   * Set the field name for the column
   * @param fieldName - The field name from the data object
   */
  field<K extends keyof TData>(
    fieldName: K,
  ): ColumnDefBuilder<TData, TData[K]> {
    this.colDef.field = String(fieldName) as never;
    return this as never as ColumnDefBuilder<TData, TData[K]>;
  }

  /**
   * Set the header name for the column
   * @param name - The header text to display
   */
  header(name: string): this {
    this.colDef.headerName = name;
    return this;
  }

  /**
   * Set the column width
   * @param width - Fixed width in pixels
   */
  width(width: number): this {
    this.colDef.width = width;
    return this;
  }

  /**
   * Set the column minimum width
   * @param minWidth - Minimum width in pixels
   */
  minWidth(minWidth: number): this {
    this.colDef.minWidth = minWidth;
    return this;
  }

  /**
   * Set the column flex (for responsive width)
   * @param flex - Flex value (default: 1)
   */
  flex(flex: number = 1): this {
    this.colDef.flex = flex;
    return this;
  }

  /**
   * Enable or disable sorting
   * @param enabled - Whether sorting is enabled
   */
  sortable(enabled: boolean = true): this {
    this.colDef.sortable = enabled;
    return this;
  }

  /**
   * Enable or disable filtering
   * @param enabled - Whether filtering is enabled (true) or filter type (string)
   */
  filter(enabled: boolean | string = true): this {
    this.colDef.filter = enabled;
    return this;
  }

  /**
   * Enable or disable resizing
   * @param enabled - Whether resizing is enabled
   */
  resizable(enabled: boolean = true): this {
    this.colDef.resizable = enabled;
    return this;
  }

  /**
   * Enable or disable editing
   * @param enabled - Whether editing is enabled
   */
  editable(
    enabled: boolean | ((params: { data: TData }) => boolean) = true,
  ): this {
    this.colDef.editable = enabled as boolean | ((params: unknown) => boolean);
    return this;
  }

  /**
   * Set the cell editor type
   * @param editor - The editor type or component
   */
  editor(editor: string | unknown): this {
    this.colDef.cellEditor = editor as string;
    return this;
  }

  /**
   * Set the cell editor parameters
   * @param params - The editor parameters
   */
  editorParams(params: unknown): this {
    this.colDef.cellEditorParams = params;
    return this;
  }

  /**
   * Set a custom cell renderer
   * @param renderer - The renderer function or component
   */
  renderer(
    renderer: (
      params: ICellRendererParams<TData, TValue>,
    ) => string | React.JSX.Element | null,
  ): this {
    this.colDef.cellRenderer = renderer as unknown;
    return this;
  }

  /**
   * Set a value formatter
   * @param formatter - The formatter function
   */
  formatter(
    formatter: (params: ValueFormatterParams<TData, TValue>) => string,
  ): this {
    this.colDef.valueFormatter = formatter as never;
    return this;
  }

  /**
   * Set a value getter
   * @param getter - The getter function
   */
  getter(getter: (params: ValueGetterParams<TData>) => TValue): this {
    this.colDef.valueGetter = getter as never;
    return this;
  }

  /**
   * Set a value setter
   * @param setter - The setter function
   */
  setter(setter: (params: ValueSetterParams<TData, TValue>) => boolean): this {
    this.colDef.valueSetter = setter as never;
    return this;
  }

  /**
   * Set a value parser
   * @param parser - The parser function
   */
  parser(parser: (params: ValueParserParams<TData, TValue>) => TValue): this {
    this.colDef.valueParser = parser as never;
    return this;
  }

  /**
   * Set a validator function
   * @param validatorFn - The validator function
   */
  validator(validatorFn: ValidatorFunction<TValue>): this {
    // Add cell class callback for validation styling
    const originalCellClass = this.colDef.cellClass;
    this.colDef.cellClass = (params) => {
      const value = params.value as TValue;
      const validation = validatorFn(value);
      const validationClass = validation.valid ? "" : "ag-cell-invalid";

      if (typeof originalCellClass === "function") {
        const existingClass = originalCellClass(params);
        return existingClass
          ? `${existingClass} ${validationClass}`
          : validationClass;
      }
      if (typeof originalCellClass === "string") {
        return originalCellClass
          ? `${originalCellClass} ${validationClass}`
          : validationClass;
      }
      return validationClass;
    };

    // Add tooltip for validation message
    const originalTooltip = this.colDef.tooltipValueGetter;
    this.colDef.tooltipValueGetter = (params) => {
      const value = params.value as TValue;
      const validation = validatorFn(value);

      if (originalTooltip && typeof originalTooltip === "function") {
        const existingTooltip = originalTooltip(params);
        return existingTooltip || validation.message || "";
      }
      return validation.message || "";
    };

    return this;
  }

  /**
   * Pin the column to left or right
   * @param position - The pin position
   */
  pinned(position: "left" | "right" | null): this {
    this.colDef.pinned = position;
    return this;
  }

  /**
   * Hide the column
   * @param hidden - Whether the column is hidden
   */
  hide(hidden: boolean = true): this {
    this.colDef.hide = hidden;
    return this;
  }

  /**
   * Set cell class
   * @param cellClass - CSS class name or function
   */
  cellClass(
    cellClass: string | ((params: { data: TData; value: TValue }) => string),
  ): this {
    this.colDef.cellClass = cellClass as string;
    return this;
  }

  /**
   * Set cell style
   * @param cellStyle - CSS style object or function
   */
  cellStyle(
    cellStyle:
      | Record<string, string>
      | ((params: { data: TData; value: TValue }) => Record<string, string>),
  ): this {
    this.colDef.cellStyle = cellStyle as Record<string, string>;
    return this;
  }

  /**
   * Set the default sort order
   * @param order - Sort order ('asc' or 'desc')
   */
  sort(order: "asc" | "desc"): this {
    this.colDef.sort = order;
    return this;
  }

  /**
   * Extend with custom ColDef properties
   * @param customProps - Custom AG Grid ColDef properties
   */
  custom(customProps: Partial<ColDef<TData, TValue>>): this {
    Object.assign(this.colDef, customProps);
    return this;
  }

  /**
   * Build and return the final ColDef object
   * @returns The built ColDef object
   */
  build(): ColDef<TData, TValue> {
    return this.colDef;
  }
}

/**
 * Factory function to create a new column definition builder
 *
 * @example
 * ```typescript
 * const dateColumn = createColumnDef<WorkLog>()
 *   .field('date')
 *   .header('Date')
 *   .width(120)
 *   .sortable(true)
 *   .build();
 * ```
 */
export function createColumnDef<TData, TValue = unknown>(): ColumnDefBuilder<
  TData,
  TValue
> {
  return new ColumnDefBuilder<TData, TValue>();
}
