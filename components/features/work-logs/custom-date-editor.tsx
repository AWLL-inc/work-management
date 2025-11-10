"use client";

import type { CustomCellEditorProps } from "ag-grid-react";
import { useEffect, useRef, useState } from "react";
import type { WorkLog } from "@/drizzle/schema";

export const CustomDateEditor = ({
  initialValue,
  onValueChange,
}: CustomCellEditorProps<WorkLog, Date | string>) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Format date value for input[type="date"]
  const formatDate = (val: Date | string | null | undefined): string => {
    if (!val) return "";
    if (val instanceof Date) {
      return val.toISOString().split("T")[0];
    }
    if (typeof val === "string") {
      return val.split("T")[0];
    }
    return "";
  };

  const [currentValue, setCurrentValue] = useState(formatDate(initialValue));

  // Focus and open date picker on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        try {
          inputRef.current.showPicker?.();
        } catch (error) {
          // showPicker() not supported in all browsers
          console.debug("showPicker not supported:", error);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCurrentValue(newValue);
    onValueChange(newValue || null); // Immediately notify grid
  };

  return (
    <input
      ref={inputRef}
      type="date"
      value={currentValue}
      onChange={handleChange}
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
        padding: 0,
        border: "none",
        outline: "none",
        fontSize: "14px",
        fontFamily: "inherit",
        backgroundColor: "transparent",
        boxShadow: "none",
        boxSizing: "border-box",
        cursor: "pointer",
        appearance: "none",
        WebkitAppearance: "none",
      }}
    />
  );
};

CustomDateEditor.displayName = "CustomDateEditor";
