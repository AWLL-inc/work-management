/**
 * Tests for column builder
 */

import { describe, expect, it } from "vitest";
import { createColumnDef } from "../column-builder";

interface TestData {
  id: string;
  name: string;
  age: number;
  email: string;
  isActive: boolean;
}

describe("ColumnDefBuilder", () => {
  describe("basic configuration", () => {
    it("should create a basic column definition", () => {
      const column = createColumnDef<TestData>()
        .field("name")
        .header("Name")
        .build();

      expect(column.field).toBe("name");
      expect(column.headerName).toBe("Name");
    });

    it("should set width properties", () => {
      const column = createColumnDef<TestData>()
        .field("name")
        .width(150)
        .minWidth(100)
        .build();

      expect(column.width).toBe(150);
      expect(column.minWidth).toBe(100);
    });

    it("should set flex property", () => {
      const column = createColumnDef<TestData>().field("name").flex(2).build();

      expect(column.flex).toBe(2);
    });
  });

  describe("column features", () => {
    it("should configure sortable", () => {
      const column = createColumnDef<TestData>()
        .field("name")
        .sortable(true)
        .build();

      expect(column.sortable).toBe(true);
    });

    it("should configure filter", () => {
      const column = createColumnDef<TestData>()
        .field("name")
        .filter(true)
        .build();

      expect(column.filter).toBe(true);
    });

    it("should configure filter with type", () => {
      const column = createColumnDef<TestData>()
        .field("age")
        .filter("agNumberColumnFilter")
        .build();

      expect(column.filter).toBe("agNumberColumnFilter");
    });

    it("should configure resizable", () => {
      const column = createColumnDef<TestData>()
        .field("name")
        .resizable(false)
        .build();

      expect(column.resizable).toBe(false);
    });

    it("should configure hide", () => {
      const column = createColumnDef<TestData>()
        .field("name")
        .hide(true)
        .build();

      expect(column.hide).toBe(true);
    });
  });

  describe("editing configuration", () => {
    it("should configure editable", () => {
      const column = createColumnDef<TestData>()
        .field("name")
        .editable(true)
        .build();

      expect(column.editable).toBe(true);
    });

    it("should configure editor", () => {
      const column = createColumnDef<TestData>()
        .field("name")
        .editable(true)
        .editor("agTextCellEditor")
        .build();

      expect(column.cellEditor).toBe("agTextCellEditor");
    });

    it("should configure editor params", () => {
      const params = { maxLength: 100 };
      const column = createColumnDef<TestData>()
        .field("name")
        .editable(true)
        .editor("agTextCellEditor")
        .editorParams(params)
        .build();

      expect(column.cellEditorParams).toEqual(params);
    });
  });

  describe("value formatting", () => {
    it("should configure formatter", () => {
      const formatter = (params: { value: string }) =>
        params.value?.toUpperCase() || "";
      const column = createColumnDef<TestData>()
        .field("name")
        .formatter(formatter as never)
        .build();

      expect(column.valueFormatter).toBeDefined();
    });

    it("should configure getter", () => {
      const getter = (params: { data: TestData }) => params.data.name;
      const column = createColumnDef<TestData>()
        .field("name")
        .getter(getter as never)
        .build();

      expect(column.valueGetter).toBeDefined();
    });

    it("should configure setter", () => {
      const setter = (params: { data: TestData; newValue: string }) => {
        params.data.name = params.newValue;
        return true;
      };
      const column = createColumnDef<TestData>()
        .field("name")
        .setter(setter as never)
        .build();

      expect(column.valueSetter).toBeDefined();
    });

    it("should configure parser", () => {
      const parser = (params: { newValue: string }) => params.newValue.trim();
      const column = createColumnDef<TestData>()
        .field("name")
        .parser(parser as never)
        .build();

      expect(column.valueParser).toBeDefined();
    });
  });

  describe("styling", () => {
    it("should configure cell class", () => {
      const column = createColumnDef<TestData>()
        .field("name")
        .cellClass("custom-cell")
        .build();

      expect(column.cellClass).toBe("custom-cell");
    });

    it("should configure cell style", () => {
      const style = { color: "red" };
      const column = createColumnDef<TestData>()
        .field("name")
        .cellStyle(style)
        .build();

      expect(column.cellStyle).toEqual(style);
    });

    it("should configure pinned", () => {
      const column = createColumnDef<TestData>()
        .field("name")
        .pinned("left")
        .build();

      expect(column.pinned).toBe("left");
    });
  });

  describe("sorting", () => {
    it("should configure default sort order", () => {
      const column = createColumnDef<TestData>()
        .field("name")
        .sort("desc")
        .build();

      expect(column.sort).toBe("desc");
    });
  });

  describe("validator integration", () => {
    it("should add validation styling", () => {
      const validator = (value: unknown) => {
        if (!value) {
          return { valid: false, message: "Required" };
        }
        return { valid: true };
      };

      const column = createColumnDef<TestData>()
        .field("name")
        .validator(validator)
        .build();

      expect(column.cellClass).toBeDefined();
      expect(column.tooltipValueGetter).toBeDefined();
    });
  });

  describe("custom properties", () => {
    it("should allow custom ColDef properties", () => {
      const column = createColumnDef<TestData>()
        .field("name")
        .custom({
          lockPosition: "left",
          suppressMovable: true,
        })
        .build();

      expect(column.lockPosition).toBe("left");
      expect(column.suppressMovable).toBe(true);
    });
  });

  describe("fluent API", () => {
    it("should chain multiple methods", () => {
      const column = createColumnDef<TestData>()
        .field("name")
        .header("Full Name")
        .width(200)
        .sortable(true)
        .filter(true)
        .editable(true)
        .build();

      expect(column.field).toBe("name");
      expect(column.headerName).toBe("Full Name");
      expect(column.width).toBe(200);
      expect(column.sortable).toBe(true);
      expect(column.filter).toBe(true);
      expect(column.editable).toBe(true);
    });
  });
});
