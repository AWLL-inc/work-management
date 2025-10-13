"use client";

import { Copy, Info, Plus, Redo, Trash2, Undo } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ToolbarProps } from "../types/grid-types";

export function GridToolbar({
  onAddRow,
  onDuplicateRows,
  onDeleteRows,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  selectedRowCount,
  batchEditingEnabled = false,
}: ToolbarProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 p-4 border-b bg-muted/50">
        {/* Row Operations */}
        <div className="flex items-center gap-1 border-r pr-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddRow}
                disabled={!batchEditingEnabled}
                className={`h-8 px-3 ${!batchEditingEnabled ? "opacity-50" : ""}`}
                data-testid="add-row-button"
              >
                <Plus className="w-4 h-4 mr-1" />
                行追加
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>新しい行を先頭に追加します</p>
              {!batchEditingEnabled && (
                <p className="text-xs text-orange-500">
                  一括編集モードで利用可能
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                ショートカット: Ctrl+N
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onDuplicateRows}
                disabled={!batchEditingEnabled}
                className={`h-8 px-3 ${!batchEditingEnabled ? "opacity-50" : ""}`}
                data-testid="duplicate-row-button"
              >
                <Copy className="w-4 h-4 mr-1" />
                行複製
                {selectedRowCount > 0 && (
                  <span className="ml-1 text-xs bg-primary text-primary-foreground rounded px-1">
                    {selectedRowCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>選択された行を複製します</p>
              {!batchEditingEnabled && (
                <p className="text-xs text-orange-500">
                  一括編集モードで利用可能
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                ショートカット: Ctrl+D
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onDeleteRows}
                disabled={selectedRowCount === 0}
                className={`h-8 px-3 text-destructive hover:text-destructive ${selectedRowCount === 0 ? "opacity-50" : ""}`}
                data-testid="delete-row-button"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                行削除
                {selectedRowCount > 0 && (
                  <span className="ml-1 text-xs bg-destructive text-destructive-foreground rounded px-1">
                    {selectedRowCount}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>選択された行を削除します</p>
              {selectedRowCount === 0 && (
                <p className="text-xs text-orange-500">行を選択してください</p>
              )}
              <p className="text-xs text-muted-foreground">
                ショートカット: Delete
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Undo/Redo Operations */}
        <div className="flex items-center gap-1 border-r pr-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onUndo}
                disabled={!canUndo || !batchEditingEnabled}
                className={`h-8 px-3 ${!batchEditingEnabled ? "opacity-50" : ""}`}
                data-testid="undo-button"
              >
                <Undo className="w-4 h-4 mr-1" />
                元に戻す
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>直前の編集を元に戻します</p>
              {!batchEditingEnabled && (
                <p className="text-xs text-orange-500">
                  一括編集モードで利用可能
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                ショートカット: Ctrl+Z
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onRedo}
                disabled={!canRedo || !batchEditingEnabled}
                className={`h-8 px-3 ${!batchEditingEnabled ? "opacity-50" : ""}`}
                data-testid="redo-button"
              >
                <Redo className="w-4 h-4 mr-1" />
                やり直し
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>元に戻した編集を再実行します</p>
              {!batchEditingEnabled && (
                <p className="text-xs text-orange-500">
                  一括編集モードで利用可能
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                ショートカット: Ctrl+Y
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground"
              >
                <Info className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <div className="space-y-2">
                <p className="font-semibold">キーボードショートカット</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Ctrl+C</span>
                    <span>コピー</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ctrl+V</span>
                    <span>ペースト</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ctrl+N</span>
                    <span>行追加</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ctrl+D</span>
                    <span>行複製</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delete</span>
                    <span>行削除</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ctrl+Z</span>
                    <span>元に戻す</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ctrl+Y</span>
                    <span>やり直し</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enter</span>
                    <span>次の行に移動</span>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Status Info */}
        <div className="flex-1" />

        {selectedRowCount > 0 && (
          <div className="text-sm text-muted-foreground">
            {selectedRowCount}行選択中
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
