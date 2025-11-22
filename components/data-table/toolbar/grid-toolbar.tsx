"use client";

import {
  Copy,
  Edit,
  Filter,
  Plus,
  Redo,
  RefreshCw,
  Search,
  Trash2,
  Undo,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyboardShortcutsDialog } from "@/components/ui/keyboard-shortcuts-dialog";
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
  const t = useTranslations("workLogs");

  return (
    <TooltipProvider>
      <div
        className={`flex items-center justify-between p-2 rounded-md transition-colors duration-200 ${
          batchEditingEnabled
            ? "bg-[#E0F2F1] dark:bg-[#E0F2F1]/20"
            : "bg-muted/50"
        }`}
      >
        {/* Left side - Standard grid operations */}
        <div className="flex items-center gap-2">
          {/* Editing mode badge */}
          {batchEditingEnabled && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4DB6AC] text-white text-xs font-bold rounded-full shadow-sm">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              編集中
            </div>
          )}

          {/* Row Operations - Only show in batch editing mode */}
          {batchEditingEnabled && (
            <div className="flex items-center gap-2 border-r border-gray-300/50 pr-3 ml-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onAddRow}
                    disabled={!batchEditingEnabled}
                    className="h-8 px-3 bg-white hover:bg-[#E0F2F1] hover:text-[#00695C] hover:border-[#4DB6AC] text-gray-700 shadow-sm border border-transparent transition-all"
                    data-testid="add-row-button"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {t("toolbar.addRow")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("toolbar.addRowTooltip")}</p>
                  {!batchEditingEnabled && (
                    <p className="text-xs text-orange-500">
                      {t("toolbar.batchEditModeRequired")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("toolbar.shortcut")}: Ctrl+N
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onDuplicateRows}
                    disabled={!batchEditingEnabled}
                    className="h-8 px-3 bg-white hover:bg-[#E0F2F1] hover:text-[#00695C] hover:border-[#4DB6AC] text-gray-700 shadow-sm border border-transparent transition-all"
                    data-testid="duplicate-row-button"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    {t("toolbar.duplicateRow")}
                    {selectedRowCount > 0 && (
                      <span className="ml-1 text-xs bg-primary text-primary-foreground rounded px-1">
                        {selectedRowCount}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("toolbar.duplicateRowTooltip")}</p>
                  {!batchEditingEnabled && (
                    <p className="text-xs text-orange-500">
                      {t("toolbar.batchEditModeRequired")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("toolbar.shortcut")}: Ctrl+D
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onDeleteRows}
                    disabled={selectedRowCount === 0}
                    className={`h-8 px-3 bg-white hover:bg-red-50 text-red-500 shadow-sm border border-transparent transition-all ${selectedRowCount === 0 ? "opacity-50" : ""}`}
                    data-testid="delete-row-button"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t("toolbar.deleteRow")}
                    {selectedRowCount > 0 && (
                      <span className="ml-1 text-xs bg-destructive text-destructive-foreground rounded px-1">
                        {selectedRowCount}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("toolbar.deleteRowTooltip")}</p>
                  {selectedRowCount === 0 && (
                    <p className="text-xs text-orange-500">
                      {t("toolbar.selectRowsToDelete")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("toolbar.shortcut")}: Delete
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Undo/Redo Operations - Only show in batch editing mode */}
          {batchEditingEnabled && (
            <div className="flex items-center gap-2 border-r border-gray-300/50 pr-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onUndo}
                    disabled={!canUndo || !batchEditingEnabled}
                    className="h-8 px-3 bg-white hover:bg-gray-50 text-gray-700 shadow-sm border-0"
                    data-testid="undo-button"
                  >
                    <Undo className="w-4 h-4 mr-1" />
                    {t("toolbar.undo")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("toolbar.undoTooltip")}</p>
                  {!batchEditingEnabled && (
                    <p className="text-xs text-orange-500">
                      {t("toolbar.batchEditModeRequired")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("toolbar.shortcut")}: Ctrl+Z
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onRedo}
                    disabled={!canRedo || !batchEditingEnabled}
                    className="h-8 px-3 bg-white hover:bg-gray-50 text-gray-700 shadow-sm border-0"
                    data-testid="redo-button"
                  >
                    <Redo className="w-4 h-4 mr-1" />
                    {t("toolbar.redo")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("toolbar.redoTooltip")}</p>
                  {!batchEditingEnabled && (
                    <p className="text-xs text-orange-500">
                      {t("toolbar.batchEditModeRequired")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("toolbar.shortcut")}: Ctrl+Y
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Quick Filter */}
          {enableQuickFilter && batchEditingEnabled && (
            <div className="flex items-center gap-1 border-r border-gray-300/50 pr-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t("toolbar.searchPlaceholder")}
                  value={quickFilterText}
                  onChange={(e) => onQuickFilterChange?.(e.target.value)}
                  className="pl-8 pr-8 w-48 h-8 focus-visible:ring-0 bg-white border-0 shadow-sm"
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
          {enableFilterToolPanel && batchEditingEnabled && (
            <div className="flex items-center gap-1 border-r border-gray-300/50 pr-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 px-3 bg-white hover:bg-gray-50 text-gray-700 shadow-sm border-0"
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
                    {t("toolbar.filter")}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("toolbar.filterTooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Keyboard Shortcuts Help - Only show in batch editing mode */}
          {batchEditingEnabled && <KeyboardShortcutsDialog />}

          {/* Status Info */}
          <div className="flex-1" />

          {selectedRowCount > 0 && (
            <div className="text-xs sm:text-sm text-muted-foreground">
              {t("toolbar.rowsSelected", { count: selectedRowCount })}
            </div>
          )}
        </div>

        {/* Right side - Work Log specific buttons */}
        {(onToggleBatchEdit ||
          onAddWorkLog ||
          onBatchSave ||
          onCancelBatchEdit) && (
          <div className="flex items-center gap-2">
            {!batchEditingEnabled ? (
              onToggleBatchEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={onToggleBatchEdit}
                      className="h-9 px-4 bg-[#4DB6AC] hover:bg-[#4DB6AC]/90 text-white shadow-sm"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      編集
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("toolbar.enableBatchEdit")}</p>
                  </TooltipContent>
                </Tooltip>
              )
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
                        className="h-9 px-4 bg-[#4DB6AC] hover:bg-[#4DB6AC]/90 text-white shadow-sm"
                      >
                        {isSavingBatch && (
                          <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        )}
                        {isSavingBatch ? t("saving") : t("save")}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("toolbar.saveChanges")}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {onCancelBatchEdit && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={onCancelBatchEdit}
                        disabled={isSavingBatch}
                        className="h-9 px-4 bg-white hover:bg-gray-50 text-gray-700 shadow-sm border-0"
                      >
                        <X className="w-4 h-4 mr-1" />
                        {t("cancel")}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("toolbar.cancelEditing")}</p>
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
