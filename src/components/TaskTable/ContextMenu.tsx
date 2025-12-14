"use client";

import { useEffect, useRef } from "react";
import { Task } from "@/lib/types";
import { ContextMenuAction, ContextMenuState } from "./types";

interface ContextMenuProps {
  state: ContextMenuState | null;
  actions: ContextMenuAction[];
  onClose: () => void;
}

export function ContextMenu({ state, actions, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (state) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [state, onClose]);

  if (!state) return null;

  const { task, position } = state;

  // 条件を満たすアクションのみ表示
  const visibleActions = actions.filter(
    (action) => !action.condition || action.condition(task)
  );

  const handleAction = async (action: ContextMenuAction, task: Task) => {
    onClose();
    await action.onClick(task);
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] bg-popover border border-border rounded-lg shadow-lg py-1 animate-in fade-in zoom-in-95"
      style={{
        top: position.y,
        left: position.x,
      }}
    >
      {visibleActions.map((action, index) => (
        <div key={action.id}>
          {action.separator && index > 0 && (
            <div className="h-px bg-border my-1" />
          )}
          <button
            type="button"
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors ${
              action.variant === "danger"
                ? "text-red-600 dark:text-red-400"
                : "text-foreground"
            }`}
            onClick={() => handleAction(action, task)}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
