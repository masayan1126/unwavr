"use client";

import { X } from "lucide-react";
import { Task } from "@/lib/types";
import { BulkAction } from "./types";

interface BulkActionsMenuProps {
  selectedCount: number;
  selectedIds: string[];
  selectedTasks: Task[];
  actions: BulkAction[];
  onClearSelection: () => void;
}

export function BulkActionsMenu({
  selectedCount,
  selectedIds,
  selectedTasks,
  actions,
  onClearSelection,
}: BulkActionsMenuProps) {
  if (selectedCount === 0) return null;

  // 条件を満たすアクションのみ表示
  const visibleActions = actions.filter(
    (action) => !action.condition || action.condition(selectedTasks)
  );

  const handleAction = async (action: BulkAction) => {
    await action.onClick(selectedIds, selectedTasks);
    onClearSelection();
  };

  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-primary/10 dark:bg-primary/20 border-b border-primary/30">
      <span className="text-sm font-medium text-primary">
        {selectedCount}件選択中
      </span>

      <div className="flex items-center gap-1 ml-auto">
        {visibleActions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => handleAction(action)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              action.variant === "danger"
                ? "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={onClearSelection}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-foreground/60 hover:text-foreground transition-colors ml-2"
        >
          <X size={14} />
          <span>選択解除</span>
        </button>
      </div>
    </div>
  );
}
