"use client";

import type { ICellEditorParams } from "ag-grid-community";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export const CustomDateEditor = forwardRef((props: ICellEditorParams, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  // Use ref to store current value for getValue()
  const valueRef = useRef<string>("");

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

  // Initialize value ref
  useEffect(() => {
    const initialValue = getInitialValue();
    valueRef.current = initialValue;
    if (inputRef.current) {
      inputRef.current.value = initialValue;
    }
  }, []);

  // Auto-open date picker when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Try to open the date picker
        try {
          inputRef.current.showPicker?.();
        } catch (error) {
          // showPicker() might not be supported in all browsers
          console.debug("showPicker not supported:", error);
        }
      }
    }, 100); // Small delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, []);

  // Expose AG Grid required methods
  useImperativeHandle(ref, () => ({
    getValue: () => {
      // Return the current value from the input directly
      const currentValue = inputRef.current?.value || valueRef.current;
      console.log("CustomDateEditor getValue called:", currentValue);
      return currentValue || null;
    },

    // Prevent AG Grid from canceling the edit
    isCancelAfterEnd: () => {
      return false;
    },

    // This is not a popup editor
    isPopup: () => {
      return false;
    },

    afterGuiAttached: () => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Try to open the date picker after attachment
        setTimeout(() => {
          try {
            inputRef.current?.showPicker?.();
          } catch (error) {
            console.debug("showPicker not supported:", error);
          }
        }, 50);
      }
    },
  }));

  return (
    <input
      ref={inputRef}
      type="date"
      defaultValue={getInitialValue()}
      onChange={(e) => {
        // Update value ref when changed
        valueRef.current = e.target.value;
        console.log("Date changed to:", e.target.value);
      }}
      onClick={() => {
        // Also try to open on click
        try {
          inputRef.current?.showPicker?.();
        } catch (_error) {
          // Ignore error - browser might not support it
        }
      }}
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
        cursor: "pointer",
      }}
    />
  );
});

CustomDateEditor.displayName = "CustomDateEditor";
