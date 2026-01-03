"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, X, Search } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { Task } from "@/lib/types";

interface ParentTaskSelectorProps {
  taskId?: string;
  currentParentId?: string;
  onChange: (parentId: string | undefined) => void;
  disabled?: boolean;
}

function getDescendants(tasks: Task[], parentId: string): Task[] {
  const children = tasks.filter((t) => t.parentTaskId === parentId);
  return children.flatMap((c) => [c, ...getDescendants(tasks, c.id)]);
}

function getSelectableTasks(
  allTasks: Task[],
  currentTaskId?: string
): Task[] {
  const activeTasks = allTasks.filter((t) => !t.archived);

  if (!currentTaskId) {
    return activeTasks;
  }

  const descendants = getDescendants(allTasks, currentTaskId);
  const excludeIds = new Set([currentTaskId, ...descendants.map((t) => t.id)]);

  return activeTasks.filter((t) => !excludeIds.has(t.id));
}

export function ParentTaskSelector({
  taskId,
  currentParentId,
  onChange,
  disabled = false,
}: ParentTaskSelectorProps) {
  const tasks = useAppStore((s) => s.tasks);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentParentTask = useMemo(() => {
    if (!currentParentId) return undefined;
    return tasks.find((t) => t.id === currentParentId);
  }, [currentParentId, tasks]);

  const selectableTasks = useMemo(() => {
    return getSelectableTasks(tasks, taskId);
  }, [tasks, taskId]);

  const filteredTasks = useMemo(() => {
    if (!search.trim()) return selectableTasks;
    const q = search.toLowerCase();
    return selectableTasks.filter((t) =>
      t.title?.toLowerCase().includes(q)
    );
  }, [selectableTasks, search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (parentId: string | undefined) => {
    onChange(parentId);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="px-2 py-1 text-sm rounded hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-1 disabled:opacity-50"
      >
        {currentParentTask ? (
          <span className="truncate max-w-[200px]">{currentParentTask.title}</span>
        ) : (
          <span className="text-muted-foreground">未設定</span>
        )}
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-72 bg-popover border border-border rounded-md shadow-lg">
          {/* 検索入力 */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="タスクを検索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-sm bg-transparent border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>

          {/* クリアボタン */}
          {currentParentId && (
            <button
              type="button"
              onClick={() => handleSelect(undefined)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left border-b border-border"
            >
              <X size={14} className="text-muted-foreground" />
              <span>クリア（ルートタスクに戻す）</span>
            </button>
          )}

          {/* タスクリスト */}
          <div className="max-h-60 overflow-auto">
            {filteredTasks.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {search ? "該当するタスクがありません" : "選択可能なタスクがありません"}
              </div>
            ) : (
              filteredTasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelect(t.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left ${
                    t.id === currentParentId ? "bg-muted" : ""
                  }`}
                >
                  <span className="truncate">{t.title || "無題"}</span>
                  {t.id === currentParentId && (
                    <span className="ml-auto text-primary">✓</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
