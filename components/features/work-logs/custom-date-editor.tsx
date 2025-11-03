"use client";

import type { ICellEditorParams } from "ag-grid-community";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export const CustomDateEditor = forwardRef((props: ICellEditorParams, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Get initial value
  const getInitialValue = () => {
    const value = props.value;
    if (!value) return "";

    // Convert Date object to YYYY-MM-DD string
    if (value instanceof Date) {
      return value.toISOString().split("T")[0];
    }

    // If it's already a string, ensure it's in the right format
    if (typeof value === "string") {
      return value.split("T")[0]; // Remove time part if present
    }

    return "";
  };

  const [value, setValue] = useState(getInitialValue());

  // Expose AG Grid required methods
  useImperativeHandle(ref, () => ({
    getValue: () => {
      return value || null;
    },

    afterGuiAttached: () => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Open the date picker automatically
        inputRef.current.showPicker?.();
      }
    },
  }));

  return (
    <input
      ref={inputRef}
      type="date"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      style={{
        width: "100%",
        height: "100%",
        padding: "12px 16px",
        border: "none",
        outline: "none",
        fontSize: "14px",
        fontFamily: "inherit",
        backgroundColor: "transparent",
        boxSizing: "border-box",
      }}
    />
  );
});

CustomDateEditor.displayName = "CustomDateEditor";
