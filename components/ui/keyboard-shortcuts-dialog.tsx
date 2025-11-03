/**
 * KeyboardShortcutsDialog - Keyboard Shortcuts Help
 *
 * Displays available keyboard shortcuts for the application.
 * Accessible via ? key or Help button.
 */

"use client";

import { HelpCircle, Keyboard } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    title: "一般操作",
    shortcuts: [
      { keys: ["?"], description: "このヘルプを表示" },
      { keys: ["Esc"], description: "ダイアログを閉じる / 編集をキャンセル" },
    ],
  },
  {
    title: "一括編集モード",
    shortcuts: [
      { keys: ["Ctrl", "Z"], description: "元に戻す（最大20ステップ）" },
      { keys: ["Ctrl", "Y"], description: "やり直し" },
      { keys: ["Ctrl", "Shift", "Z"], description: "やり直し（代替）" },
      { keys: ["Ctrl", "N"], description: "新しい行を追加" },
      { keys: ["Ctrl", "D"], description: "選択した行を複製" },
      { keys: ["Delete"], description: "選択した行を削除" },
    ],
  },
  {
    title: "グリッドナビゲーション",
    shortcuts: [
      { keys: ["Tab"], description: "次のセルに移動" },
      { keys: ["Shift", "Tab"], description: "前のセルに移動" },
      { keys: ["↑", "↓", "←", "→"], description: "セル間を移動" },
      { keys: ["Enter"], description: "セルの編集を開始 / 終了" },
      { keys: ["Space"], description: "行を選択 / 選択解除" },
    ],
  },
];

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ダイアログが既に開いている場合は何もしない
      if (open) return;

      // Open dialog with ? key
      if (
        event.key === "?" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        // Check if we're not in an input field
        const target = event.target as HTMLElement;
        if (
          target.tagName !== "INPUT" &&
          target.tagName !== "TEXTAREA" &&
          !target.isContentEditable
        ) {
          event.preventDefault();
          setOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div suppressHydrationWarning>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            aria-label="キーボードショートカットヘルプを表示"
          >
            <Keyboard className="h-4 w-4" aria-hidden="true" />
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DialogTrigger>
        <DialogContent
          className="max-w-2xl max-h-[80vh] overflow-y-auto"
          aria-describedby="keyboard-shortcuts-description"
        >
          <DialogHeader>
            <DialogTitle>キーボードショートカット</DialogTitle>
            <DialogDescription id="keyboard-shortcuts-description">
              利用可能なキーボードショートカットの一覧です。
              <kbd className="ml-2 px-2 py-1 text-xs font-semibold bg-muted rounded">
                ?
              </kbd>{" "}
              キーでいつでもこのヘルプを表示できます。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {SHORTCUTS.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.description}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex gap-1">
                        <span className="sr-only">
                          ショートカット: {shortcut.keys.join(" + ")}
                        </span>
                        {shortcut.keys.map((key) => (
                          <kbd
                            key={`${shortcut.description}-${key}`}
                            className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded min-w-[2rem] text-center"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>注意:</strong>{" "}
              一括編集モードのショートカットは、一括編集が有効な場合のみ機能します。
              セル編集中はグリッドナビゲーションショートカットが優先されます。
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
