import { useState, useMemo, useCallback, useEffect } from "react";
import { Task } from "@/lib/types";

interface UseTaskTableSelectionProps {
  tasks: Task[];
  enabled: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function useTaskTableSelection({
  tasks,
  enabled,
  onSelectionChange,
}: UseTaskTableSelectionProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // 選択されたIDの配列
  const selectedIds = useMemo(
    () => tasks.filter((t) => selected[t.id]).map((t) => t.id),
    [tasks, selected]
  );

  // 選択されたタスクの配列
  const selectedTasks = useMemo(
    () => tasks.filter((t) => selected[t.id]),
    [tasks, selected]
  );

  // 選択数
  const selectedCount = selectedIds.length;

  // 全選択状態
  const allChecked = useMemo(
    () => enabled && tasks.length > 0 && tasks.every((t) => selected[t.id]),
    [enabled, tasks, selected]
  );

  // 全選択/解除
  const selectAll = useCallback(
    (checked: boolean) => {
      if (!enabled) return;
      setSelected(Object.fromEntries(tasks.map((t) => [t.id, checked])));
    },
    [enabled, tasks]
  );

  // 個別選択
  const selectOne = useCallback(
    (id: string, checked: boolean) => {
      if (!enabled) return;
      setSelected((s) => ({ ...s, [id]: checked }));
    },
    [enabled]
  );

  // 選択をクリア
  const clearSelection = useCallback(() => {
    setSelected({});
  }, []);

  // 選択変更時のコールバック
  useEffect(() => {
    if (onSelectionChange && selectedIds.length >= 0) {
      onSelectionChange(selectedIds);
    }
  }, [selectedIds, onSelectionChange]);

  // タスクリストが変更されたら、存在しないIDを選択から削除
  useEffect(() => {
    const taskIds = new Set(tasks.map((t) => t.id));
    setSelected((prev) => {
      const next: Record<string, boolean> = {};
      for (const [id, checked] of Object.entries(prev)) {
        if (taskIds.has(id) && checked) {
          next[id] = true;
        }
      }
      return next;
    });
  }, [tasks]);

  return {
    selected,
    selectedIds,
    selectedTasks,
    selectedCount,
    allChecked,
    selectAll,
    selectOne,
    clearSelection,
  };
}
