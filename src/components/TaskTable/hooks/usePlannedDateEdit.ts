import { useState, useCallback } from "react";
import { Task } from "@/lib/types";

interface UsePlannedDateEditProps {
  onSave?: (taskId: string, date: number) => void | Promise<void>;
}

export function usePlannedDateEdit({ onSave }: UsePlannedDateEditProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<string>("");

  // 編集開始
  const startEdit = useCallback((task: Task) => {
    const planned = (task.plannedDates ?? []).slice().sort((a, b) => a - b);
    if (planned.length > 0) {
      const d = new Date(planned[0]);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setTempDate(`${yyyy}-${mm}-${dd}`);
    } else {
      setTempDate("");
    }
    setEditingTaskId(task.id);
  }, []);

  // 保存
  const saveEdit = useCallback(
    async (taskId: string) => {
      if (!tempDate) {
        setEditingTaskId(null);
        return;
      }
      const dateTimestamp = new Date(tempDate).getTime();
      if (onSave) {
        await onSave(taskId, dateTimestamp);
      }
      setEditingTaskId(null);
      setTempDate("");
    },
    [tempDate, onSave]
  );

  // キャンセル
  const cancelEdit = useCallback(() => {
    setEditingTaskId(null);
    setTempDate("");
  }, []);

  return {
    editingTaskId,
    tempDate,
    setTempDate,
    startEdit,
    saveEdit,
    cancelEdit,
  };
}
