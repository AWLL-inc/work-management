"use client";

import {
  Copy,
  Edit,
  Filter,
  Info,
  Plus,
  Redo,
  RefreshCw,
  Search,
  Trash2,
  Undo,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ToolbarProps } from "../types/grid-types";

export function GridToolbar({
  gridApi,
  onAddRow,
  onDuplicateRows,
  onDeleteRows,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  selectedRowCount,
  batchEditingEnabled = false,
  enableQuickFilter = false,
  quickFilterText = "",
  onQuickFilterChange,
  enableFilterToolPanel = false,
  onToggleBatchEdit,
  onAddWorkLog,
  onBatchSave,
  onCancelBatchEdit,
  isSavingBatch = false,
}: ToolbarProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        {/* Left side - Standard grid operations */}
        <div className="flex items-center gap-2">
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

        {/* Quick Filter */}
        {enableQuickFilter && (
          <div className="flex items-center gap-1 border-r pr-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="検索..."
                value={quickFilterText}
                onChange={(e) => onQuickFilterChange?.(e.target.value)}
                className="pl-8 pr-8 w-48 h-8"
              />
              {quickFilterText && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => onQuickFilterChange?.("")}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Filter Tool Panel Toggle */}
        {enableFilterToolPanel && (
          <div className="flex items-center gap-1 border-r pr-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => {
                    if (gridApi) {
                      const isToolPanelShowing = gridApi.isToolPanelShowing();
                      if (isToolPanelShowing) {
                        gridApi.closeToolPanel();
                      } else {
                        gridApi.openToolPanel("filters");
                      }
                    }
                  }}
                  data-testid="filter-panel-button"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  フィルター
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>詳細フィルターパネルを開く/閉じる</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

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

        {/* Right side - Work Log specific buttons */}
        {(onToggleBatchEdit || onAddWorkLog || onBatchSave || onCancelBatchEdit) && (
          <div className="flex items-center gap-2">
            {!batchEditingEnabled ? (
              <>
                {onToggleBatchEdit && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onToggleBatchEdit}
                        className="h-8 px-3"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        一括編集
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>一括編集モードを有効にします</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {onAddWorkLog && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={onAddWorkLog}
                        className="h-8 px-3"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        追加
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>新しい作業ログを追加します</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </>
            ) : (
              <>
                {onBatchSave && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={onBatchSave}
                        disabled={isSavingBatch}
                        className="h-8 px-3"
                      >
                        {isSavingBatch && (
                          <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        )}
                        {isSavingBatch ? "保存中..." : "保存"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>編集内容を保存します</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {onCancelBatchEdit && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onCancelBatchEdit}
                        disabled={isSavingBatch}
                        className="h-8 px-3"
                      >
                        <X className="w-4 h-4 mr-1" />
                        キャンセル
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>編集をキャンセルします</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
