"use client";

import type { ICellEditor, ICellEditorParams } from "ag-grid-community";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

interface CustomDateEditorProps extends ICellEditorParams {}

export const CustomDateEditor = forwardRef<ICellEditor, CustomDateEditorProps>(
  (props, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // Get the initial value from the cell
    const getInitialValue = useCallback(() => {
      const fieldName = props.colDef?.field;
      if (!fieldName) return "";

      const value = props.data[fieldName];

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
    }, [props.colDef?.field, props.data]);

    useEffect(() => {
      // Set initial value and focus
      if (inputRef.current) {
        inputRef.current.value = getInitialValue();
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [getInitialValue]);

    // AG Grid interface methods
    useImperativeHandle(ref, () => ({
      getValue: () => {
        if (!inputRef.current || !inputRef.current.value) {
          return null;
        }

        // Return the date string in YYYY-MM-DD format
        return inputRef.current.value;
      },

      getGui: () => inputRef.current as HTMLInputElement,

      afterGuiAttached: () => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      },

      isPopup: () => false,

      isCancelBeforeStart: () => false,

      isCancelAfterEnd: () => false,

      focusIn: () => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      },

      focusOut: () => {
        // Not needed for this implementation
      },
    }));

    return (
      <input
        ref={inputRef}
        type="date"
        className="ag-input-field-input ag-text-field-input"
        style={{
          width: "100%",
          height: "100%",
          padding: "0 8px",
          border: "none",
          outline: "none",
          fontSize: "inherit",
          fontFamily: "inherit",
        }}
        onKeyDown={(e) => {
          // Allow normal keyboard navigation
          if (e.key === "Enter" || e.key === "Tab") {
            // Let AG Grid handle navigation
            return;
          }
        }}
      />
    );
  },
);

CustomDateEditor.displayName = "CustomDateEditor";
