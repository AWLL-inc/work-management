"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter details...",
  className,
  disabled = false,
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [content, setContent] = useState(value || "");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setContent(value || "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);
    onChange?.(newValue);
  };

  if (!isMounted) {
    return (
      <div
        className={cn(
          "border rounded-md overflow-hidden bg-white min-h-[200px] flex items-center justify-center",
          disabled && "opacity-50 pointer-events-none",
          className,
        )}
      >
        <div className="text-gray-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border rounded-md overflow-hidden bg-white",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      <textarea
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full p-4 min-h-[150px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border-0"
      />
    </div>
  );
}
