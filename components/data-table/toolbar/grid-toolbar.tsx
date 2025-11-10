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
        className={`flex items-center justify-between p-4 border-b transition-colors duration-200 ${
          batchEditingEnabled ? "bg-blue-50 dark:bg-blue-900/20" : "bg-muted/50"
        }`}
      >
        {/* Left side - Standard grid operations */}
        <div className="flex items-center gap-2">
          {/* Editing mode badge */}
          {batchEditingEnabled && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-md">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              編集中
            </div>
          )}

          {/* Row Operations - Only show in batch editing mode */}
          {batchEditingEnabled && (
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
                    variant="outline"
                    size="sm"
                    onClick={onDuplicateRows}
                    disabled={!batchEditingEnabled}
                    className={`h-8 px-3 ${!batchEditingEnabled ? "opacity-50" : ""}`}
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
                    variant="outline"
                    size="sm"
                    onClick={onDeleteRows}
                    disabled={selectedRowCount === 0}
                    className={`h-8 px-3 text-destructive hover:text-destructive ${selectedRowCount === 0 ? "opacity-50" : ""}`}
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
                    variant="outline"
                    size="sm"
                    onClick={onRedo}
                    disabled={!canRedo || !batchEditingEnabled}
                    className={`h-8 px-3 ${!batchEditingEnabled ? "opacity-50" : ""}`}
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
            <div className="flex items-center gap-1 border-r pr-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t("toolbar.searchPlaceholder")}
                  value={quickFilterText}
                  onChange={(e) => onQuickFilterChange?.(e.target.value)}
                  className="pl-8 pr-8 w-48 h-8 focus-visible:ring-0"
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
                      variant="outline"
                      size="sm"
                      onClick={onToggleBatchEdit}
                      className="h-8 px-3"
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
                        className="h-8 px-3"
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
                        variant="outline"
                        size="sm"
                        onClick={onCancelBatchEdit}
                        disabled={isSavingBatch}
                        className="h-8 px-3"
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
