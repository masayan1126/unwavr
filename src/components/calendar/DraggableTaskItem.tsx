"use client";

import { Task } from "@/lib/types";
import { GripVertical } from "lucide-react";

type DraggableTaskItemProps = {
  task: Task;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
};

const typeColors: Record<string, { bg: string; border: string; text: string }> = {
  daily: { bg: "bg-emerald-100 dark:bg-emerald-900/40", border: "border-emerald-300 dark:border-emerald-700", text: "text-emerald-800 dark:text-emerald-200" },
  scheduled: { bg: "bg-blue-100 dark:bg-blue-900/40", border: "border-blue-300 dark:border-blue-700", text: "text-blue-800 dark:text-blue-200" },
  backlog: { bg: "bg-amber-100 dark:bg-amber-900/40", border: "border-amber-300 dark:border-amber-700", text: "text-amber-800 dark:text-amber-200" },
};

const typeLabels: Record<string, string> = {
  daily: "毎日",
  scheduled: "曜日",
  backlog: "積上",
};

export default function DraggableTaskItem({ task, onDragStart }: DraggableTaskItemProps) {
  const colors = typeColors[task.type] || typeColors.backlog;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-grab active:cursor-grabbing
        ${colors.bg} ${colors.border} hover:shadow-sm transition-shadow`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(
          "application/json",
          JSON.stringify({
            type: "unscheduled-task",
            taskId: task.id,
            taskType: task.type,
            title: task.title,
          })
        );
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(e, task);
      }}
    >
      <GripVertical size={14} className="text-muted-foreground shrink-0" />
      <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors.text} bg-white/50 dark:bg-black/20`}>
        {typeLabels[task.type] || task.type}
      </span>
      <span className="flex-1 text-sm truncate">{task.title}</span>
    </div>
  );
}
