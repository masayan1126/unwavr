"use client";

import { Reorder, useDragControls, useMotionValue, useTransform, motion } from "framer-motion";
import { GripVertical, CheckCircle2, Trash2, Check } from "lucide-react";
import { Task, Milestone } from "@/lib/types";
import { ColumnId, TaskTableConfig } from "./types";
import {
  TitleColumn,
  CreatedColumn,
  PlannedColumn,
  ScheduledColumn,
  TypeColumn,
  MilestoneColumn,
  ArchivedAtColumn,
} from "./columns";

interface TaskTableRowProps {
  task: Task;
  config: TaskTableConfig;
  milestones: Milestone[];
  selected: boolean;
  isActive: boolean;
  activeIndex: number;
  isDailyDoneToday: boolean;
  editingPlannedTaskId: string | null;
  tempPlannedDate: string;
  onEdit: (task: Task) => void;
  onContext: (e: React.MouseEvent, task: Task) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onToggle: (task: Task) => void;
  onSwipeComplete?: (task: Task) => void;
  onSwipeDelete?: (task: Task) => void;
  setTempPlannedDate: (date: string) => void;
  savePlannedDate: (taskId: string) => void;
  cancelEditPlannedDate: () => void;
  startEditPlannedDate: (task: Task) => void;
}

export function TaskTableRow({
  task,
  config,
  milestones,
  selected,
  isActive,
  activeIndex,
  isDailyDoneToday,
  editingPlannedTaskId,
  tempPlannedDate,
  onEdit,
  onContext,
  onSelectOne,
  onToggle,
  onSwipeComplete,
  onSwipeDelete,
  setTempPlannedDate,
  savePlannedDate,
  cancelEditPlannedDate,
  startEditPlannedDate,
}: TaskTableRowProps) {
  const controls = useDragControls();
  const x = useMotionValue(0);
  const opacityRight = useTransform(x, [0, 50], [0, 1]);
  const opacityLeft = useTransform(x, [-50, 0], [1, 0]);

  const columns = config.columns ?? ["title", "type"];
  const selectionEnabled = config.selection?.enabled ?? false;
  const dragDropEnabled = config.dragDrop?.enabled ?? false;
  const swipeEnabled = config.swipe?.enabled ?? false;

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (!swipeEnabled) return;

    const offset = info.offset.x;
    const threshold = 100;

    if (offset > threshold && onSwipeComplete) {
      onSwipeComplete(task);
    } else if (offset < -threshold && onSwipeDelete) {
      onSwipeDelete(task);
    }
  };

  const isCompleted = task.type === "daily" ? isDailyDoneToday : task.completed;

  const renderColumn = (columnId: ColumnId) => {
    switch (columnId) {
      case "title":
        return null; // タイトルは別で処理
      case "created":
        return <CreatedColumn key={columnId} task={task} />;
      case "planned":
        return (
          <PlannedColumn
            key={columnId}
            task={task}
            isEditing={editingPlannedTaskId === task.id}
            tempDate={tempPlannedDate}
            onTempDateChange={setTempPlannedDate}
            onSave={() => savePlannedDate(task.id)}
            onCancel={cancelEditPlannedDate}
            onStartEdit={() => startEditPlannedDate(task)}
          />
        );
      case "scheduled":
        return <ScheduledColumn key={columnId} task={task} />;
      case "type":
        return <TypeColumn key={columnId} task={task} />;
      case "milestone":
        return <MilestoneColumn key={columnId} task={task} milestones={milestones} />;
      case "archivedAt":
        return <ArchivedAtColumn key={columnId} task={task} />;
      default:
        return null;
    }
  };

  const rowContent = (
    <div
      className={`flex items-center gap-2 py-2 px-2 min-w-0 transition-colors border-b border-border/40 hover:bg-black/5 dark:hover:bg-white/5 group ${
        isActive ? "bg-[var(--primary)]/10 dark:bg-[var(--primary)]/20" : ""
      }`}
      onContextMenu={(e) => {
        if (config.contextMenu?.enabled) {
          e.preventDefault();
          onContext(e, task);
        }
      }}
    >
      {/* ドラッグハンドル */}
      {dragDropEnabled && (
        <div
          className="flex-shrink-0 w-[24px] flex justify-center items-center cursor-grab active:cursor-grabbing text-foreground/50 hover:text-foreground transition-colors touch-none select-none"
          onPointerDown={(e) => controls.start(e)}
        >
          <GripVertical size={16} />
        </div>
      )}

      {/* 選択チェックボックス */}
      {selectionEnabled && (
        <div className="flex-shrink-0 w-[24px] flex justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectOne(task.id, !selected);
            }}
            className={`w-4 h-4 rounded-[4px] border transition-all flex items-center justify-center ${
              selected
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/30 hover:border-primary/60 bg-transparent"
            }`}
          >
            {selected && <CheckCircle2 size={10} strokeWidth={3} />}
          </button>
        </div>
      )}

      {/* 完了チェック */}
      <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={() => onToggle(task)}
            title={isCompleted ? "完了を解除" : "完了にする"}
            className={`w-5 h-5 rounded-full border transition-all duration-200 flex items-center justify-center hover:scale-105 ${
              isCompleted
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/40 hover:border-primary hover:bg-primary/10 dark:hover:bg-primary/20"
            }`}
          >
            {isCompleted && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>

        {/* タイトル列 */}
        <TitleColumn
          task={task}
          onClick={() => onEdit(task)}
          isActive={isActive}
          activeIndex={activeIndex}
        />
      </div>

      {/* その他の列 */}
      {columns.filter((col) => col !== "title").map(renderColumn)}
    </div>
  );

  // スワイプが有効な場合
  if (swipeEnabled) {
    return (
      <Reorder.Item
        value={task}
        id={task.id}
        className="relative overflow-hidden"
        dragListener={false}
        dragControls={controls}
        initial={false}
        transition={{ duration: 0 }}
      >
        {/* Swipe Background Layer */}
        <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none z-0">
          <motion.div
            style={{ opacity: opacityRight }}
            className="flex items-center justify-start w-full h-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          >
            <Check size={24} className="ml-4" />
          </motion.div>
          <motion.div
            style={{ opacity: opacityLeft }}
            className="absolute inset-0 flex items-center justify-end w-full h-full bg-red-500/20 text-red-600 dark:text-red-400"
          >
            <Trash2 size={24} className="mr-4" />
          </motion.div>
        </div>

        {/* Swipeable Content */}
        <motion.div
          className="relative z-10 bg-background"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          style={{ x }}
          onDragEnd={handleDragEnd}
        >
          {rowContent}
        </motion.div>
      </Reorder.Item>
    );
  }

  // ドラッグ&ドロップのみ有効な場合
  if (dragDropEnabled) {
    return (
      <Reorder.Item
        value={task}
        id={task.id}
        className="relative"
        dragListener={false}
        dragControls={controls}
        initial={false}
        transition={{ duration: 0 }}
      >
        {rowContent}
      </Reorder.Item>
    );
  }

  // どちらも無効な場合
  return <div className="relative">{rowContent}</div>;
}
