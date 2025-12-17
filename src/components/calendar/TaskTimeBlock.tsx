"use client";

import { useMemo } from "react";
import { Task, TimeSlot } from "@/lib/types";
import { getTimePosition, getTimeHeight } from "./TimelineGrid";

type TaskTimeBlockProps = {
  task: Task;
  slot: TimeSlot;
  slotIndex: number;
  startHour?: number;
  hourHeight?: number;
  column?: number;
  totalColumns?: number;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
};

const typeColors: Record<string, { bg: string; border: string; text: string }> = {
  daily: { bg: "bg-emerald-100 dark:bg-emerald-900/40", border: "border-emerald-400", text: "text-emerald-800 dark:text-emerald-200" },
  scheduled: { bg: "bg-blue-100 dark:bg-blue-900/40", border: "border-blue-400", text: "text-blue-800 dark:text-blue-200" },
  backlog: { bg: "bg-amber-100 dark:bg-amber-900/40", border: "border-amber-400", text: "text-amber-800 dark:text-amber-200" },
};

export default function TaskTimeBlock({
  task,
  slot,
  slotIndex,
  startHour = 6,
  hourHeight = 60,
  column = 0,
  totalColumns = 1,
  onClick,
  onDragStart,
}: TaskTimeBlockProps) {
  const position = useMemo(() => {
    const top = getTimePosition(slot.startTime, startHour, hourHeight);
    const height = getTimeHeight(slot.startTime, slot.endTime, hourHeight);

    // 並列表示の場合の幅と位置を計算
    const widthPercent = 100 / totalColumns;
    const leftPercent = column * widthPercent;

    return {
      top,
      height: Math.max(height, 24), // 最小高さ24px
      width: `calc(${widthPercent}% - 8px)`,
      left: `calc(${leftPercent}% + 4px)`,
    };
  }, [slot.startTime, slot.endTime, startHour, hourHeight, column, totalColumns]);

  const colors = typeColors[task.type] || typeColors.backlog;

  return (
    <div
      className={`absolute rounded border-l-4 px-2 py-1 cursor-grab active:cursor-grabbing
        hover:shadow-md transition-shadow overflow-hidden
        ${colors.bg} ${colors.border}`}
      style={{
        top: position.top,
        height: position.height,
        width: position.width,
        left: position.left,
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(
          "application/json",
          JSON.stringify({
            type: "task-time-block",
            taskId: task.id,
            slotIndex,
            startTime: slot.startTime,
            endTime: slot.endTime,
            googleEventId: slot.googleEventId,
          })
        );
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(e);
      }}
      onClick={onClick}
    >
      <div className={`text-xs font-medium truncate ${colors.text}`}>
        {task.title}
      </div>
      {position.height >= 36 && (
        <div className="text-[10px]">
          {slot.startTime} - {slot.endTime}
        </div>
      )}
    </div>
  );
}

type TaskTimeBlockPlaceholderProps = {
  startTime: string;
  endTime: string;
  startHour?: number;
  hourHeight?: number;
};

export function TaskTimeBlockPlaceholder({
  startTime,
  endTime,
  startHour = 6,
  hourHeight = 60,
}: TaskTimeBlockPlaceholderProps) {
  const position = useMemo(() => {
    const top = getTimePosition(startTime, startHour, hourHeight);
    const height = getTimeHeight(startTime, endTime, hourHeight);
    return { top, height: Math.max(height, 24) };
  }, [startTime, endTime, startHour, hourHeight]);

  return (
    <div
      className="absolute left-1 right-1 rounded border-2 border-dashed border-primary/40 bg-primary/10"
      style={{
        top: position.top,
        height: position.height,
      }}
    />
  );
}
