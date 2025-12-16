"use client";

import { useMemo, useState, useCallback } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { X, Clock, GripVertical } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Task, TimeSlot } from "@/lib/types";
import TimelineGrid from "./TimelineGrid";
import TaskTimeBlock from "./TaskTimeBlock";
import DroppableTimeSlot from "./DroppableTimeSlot";

type DayDetailPanelProps = {
  date: Date;
  onClose: () => void;
};

export default function DayDetailPanel({ date, onClose }: DayDetailPanelProps) {
  const tasks = useAppStore((s) => s.tasks);
  const addTimeSlot = useAppStore((s) => s.addTimeSlot);
  const removeTimeSlot = useAppStore((s) => s.removeTimeSlot);
  const updateTimeSlot = useAppStore((s) => s.updateTimeSlot);

  // 日付をUTC 0時のタイムスタンプに変換
  const dateUtc = useMemo(() => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d.getTime();
  }, [date]);

  // この日に関連するタスクとそのtimeSlotsを取得
  const scheduledItems = useMemo(() => {
    const items: { task: Task; slot: TimeSlot; slotIndex: number }[] = [];

    for (const task of tasks) {
      if (task.archived) continue;
      const slots = task.timeSlots ?? [];
      slots.forEach((slot, idx) => {
        if (slot.date === dateUtc) {
          items.push({ task, slot, slotIndex: idx });
        }
      });
    }

    // 開始時刻でソート
    items.sort((a, b) => {
      const aTime = a.slot.startTime;
      const bTime = b.slot.startTime;
      return aTime.localeCompare(bTime);
    });

    return items;
  }, [tasks, dateUtc]);

  // 今日のタスク（まだスケジュールされていないもの）
  const unscheduledTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.archived) return false;
      // この日にtimeSlotがないタスク
      const hasSlotToday = t.timeSlots?.some((s) => s.date === dateUtc);
      if (hasSlotToday) return false;
      // 今日が対象日のタスク
      if (t.type === "daily") return true;
      if (t.type === "scheduled") {
        const dow = date.getDay();
        return t.scheduled?.daysOfWeek?.includes(dow) ?? false;
      }
      if (t.type === "backlog") {
        return t.plannedDates?.includes(dateUtc) ?? false;
      }
      return false;
    });
  }, [tasks, dateUtc, date]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [inputStartTime, setInputStartTime] = useState("09:00");
  const [inputEndTime, setInputEndTime] = useState("10:00");

  const handleTimeSlotClick = useCallback((hour: number, minute: number) => {
    const startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    const endHour = hour + 1;
    const endTime = `${endHour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    setInputStartTime(startTime);
    setInputEndTime(endTime);
    setShowTimeInput(true);
  }, []);

  const handleAddTimeSlot = useCallback(() => {
    if (!selectedTask) return;
    addTimeSlot(selectedTask.id, {
      date: dateUtc,
      startTime: inputStartTime,
      endTime: inputEndTime,
    });
    setSelectedTask(null);
    setShowTimeInput(false);
  }, [selectedTask, dateUtc, inputStartTime, inputEndTime, addTimeSlot]);

  const handleRemoveSlot = useCallback((taskId: string, slotIndex: number) => {
    removeTimeSlot(taskId, slotIndex);
  }, [removeTimeSlot]);

  // D&Dでタスクをドロップしたときの処理
  const handleTimelineDrop = useCallback(
    (hour: number, minute: number, data: unknown) => {
      const dropData = data as { type?: string; taskId?: string };
      if (dropData.type !== "unscheduled-task" || !dropData.taskId) return;

      const task = tasks.find((t) => t.id === dropData.taskId);
      if (!task) return;

      // デフォルト1時間のスロットを作成
      const startTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const endHour = hour + 1;
      const endMinute = minute;
      const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;

      addTimeSlot(dropData.taskId, {
        date: dateUtc,
        startTime,
        endTime,
      });
    },
    [tasks, dateUtc, addTimeSlot]
  );

  return (
    <div className="flex flex-col h-full bg-background border-l">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <div className="text-lg font-semibold">
            {format(date, "M月d日", { locale: ja })}
          </div>
          <div className="text-xs text-muted-foreground">
            {format(date, "EEEE", { locale: ja })}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto">
        {/* 未スケジュールタスク（ドラッグ可能） */}
        {unscheduledTasks.length > 0 && (
          <div className="p-4 border-b">
            <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Clock size={12} />
              未スケジュール ({unscheduledTasks.length})
              <span className="ml-auto text-[10px] opacity-60">ドラッグしてスケジュール</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {unscheduledTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-grab active:cursor-grabbing transition-all
                    ${selectedTask?.id === task.id
                      ? "bg-primary/10 border border-primary"
                      : "bg-muted/50 hover:bg-muted border border-transparent"
                    } hover:shadow-sm`}
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
                  }}
                  onClick={() => {
                    setSelectedTask(task);
                    setShowTimeInput(true);
                  }}
                >
                  <GripVertical size={14} className="text-muted-foreground shrink-0" />
                  <TypeBadge type={task.type} />
                  <span className="flex-1 truncate">{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 時間入力モーダル */}
        {showTimeInput && selectedTask && (
          <div className="p-4 border-b bg-muted/30">
            <div className="text-xs font-medium mb-2">
              「{selectedTask.title}」をスケジュール
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="time"
                value={inputStartTime}
                onChange={(e) => setInputStartTime(e.target.value)}
                className="px-2 py-1 text-sm border rounded"
              />
              <span className="text-sm">〜</span>
              <input
                type="time"
                value={inputEndTime}
                onChange={(e) => setInputEndTime(e.target.value)}
                className="px-2 py-1 text-sm border rounded"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedTask(null);
                  setShowTimeInput(false);
                }}
                className="px-3 py-1 text-sm border rounded hover:bg-muted transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddTimeSlot}
                className="px-3 py-1 text-sm bg-foreground text-background rounded hover:opacity-90 transition-opacity"
              >
                追加
              </button>
            </div>
          </div>
        )}

        {/* タイムライン（ドロップ可能） */}
        <div className="p-4">
          <div className="text-xs font-medium text-muted-foreground mb-3 flex items-center justify-between">
            <span>タイムライン</span>
            <div className="flex items-center gap-2">
              {scheduledItems.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                  {scheduledItems.length}件
                </span>
              )}
              <span className="text-[10px] opacity-60">タスクをここにドロップ</span>
            </div>
          </div>
          <DroppableTimeSlot onDrop={handleTimelineDrop}>
            <TimelineGrid onTimeSlotClick={handleTimeSlotClick}>
              {scheduledItems.map(({ task, slot, slotIndex }) => (
                <TaskTimeBlock
                  key={`${task.id}-${slotIndex}`}
                  task={task}
                  slot={slot}
                  slotIndex={slotIndex}
                  onClick={() => {
                    // 編集モード（簡易的に削除ボタンを表示）
                    if (confirm(`「${task.title}」の時間枠を削除しますか？`)) {
                      handleRemoveSlot(task.id, slotIndex);
                    }
                  }}
                />
              ))}
            </TimelineGrid>
          </DroppableTimeSlot>
        </div>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    daily: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    backlog: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  };
  const labels: Record<string, string> = {
    daily: "毎日",
    scheduled: "曜日",
    backlog: "積上",
  };

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${styles[type] || ""}`}>
      {labels[type] || type}
    </span>
  );
}
