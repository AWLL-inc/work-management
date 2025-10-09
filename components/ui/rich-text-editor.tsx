"use client";

import dynamic from "next/dynamic";

// Completely disable SSR for the rich text editor
const RichTextEditorNoSSR = dynamic(
  () => import("./rich-text-editor-no-ssr").then((mod) => ({ default: mod.RichTextEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="border rounded-md overflow-hidden bg-white min-h-[200px] flex items-center justify-center">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    ),
  }
);

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function RichTextEditor(props: RichTextEditorProps) {
  return <RichTextEditorNoSSR {...props} />;
}
