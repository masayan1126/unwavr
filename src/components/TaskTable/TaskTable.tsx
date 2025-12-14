"use client";

import { Reorder } from "framer-motion";
import { useState, useCallback, useMemo } from "react";
import { Task, Milestone } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/Providers";
import { TaskTableProps, TaskTableConfig, ContextMenuAction, BulkAction } from "./types";
import { COLUMN_DEFINITIONS, resolveColumns, mergeConfig, PRESETS } from "./presets";
import {
  useTaskTableSelection,
  useContextMenu,
  usePlannedDateEdit,
  useTaskTableSort,
} from "./hooks";
import { TaskTableHeader } from "./TaskTableHeader";
import { TaskTableRow } from "./TaskTableRow";
import { ContextMenu } from "./ContextMenu";
import { BulkActionsMenu } from "./BulkActionsMenu";

interface TaskTableInternalProps extends TaskTableProps {
  milestones?: Milestone[];
  activeTaskIds?: string[];
  onReorder?: (tasks: Task[]) => void;
  onPlannedDateChange?: (taskId: string, date: number) => void;
}

export function TaskTable({
  title,
  tasks,
  config = PRESETS.standard,
  emptyMessage = "タスクがありません",
  className = "",
  milestones = [],
  activeTaskIds = [],
  onReorder,
  onPlannedDateChange,
}: TaskTableInternalProps) {
  const toast = useToast();
  const toggle = useAppStore((s) => s.toggleTask);
  const toggleDailyToday = useAppStore((s) => s.toggleDailyDoneForToday);
  const removeTask = useAppStore((s) => s.removeTask);

  // 設定を解決
  const resolvedConfig: TaskTableConfig = useMemo(() => {
    return {
      columns: config.columns ?? ["title", "type"],
      selection: { enabled: config.selection?.enabled ?? false, ...config.selection },
      dragDrop: { enabled: config.dragDrop?.enabled ?? false, ...config.dragDrop },
      swipe: { enabled: config.swipe?.enabled ?? false, ...config.swipe },
      contextMenu: { enabled: config.contextMenu?.enabled ?? false, ...config.contextMenu },
      bulkActions: { enabled: config.bulkActions?.enabled ?? false, ...config.bulkActions },
      sorting: config.sorting,
      filtering: config.filtering,
    };
  }, [config]);

  const columns = resolveColumns(resolvedConfig.columns ?? ["title", "type"]);

  // フック
  const {
    selected,
    selectedIds,
    selectedTasks,
    selectedCount,
    allChecked,
    selectAll,
    selectOne,
    clearSelection,
  } = useTaskTableSelection({
    tasks,
    enabled: resolvedConfig.selection?.enabled ?? false,
    onSelectionChange: resolvedConfig.selection?.onSelectionChange,
  });

  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu({
    enabled: resolvedConfig.contextMenu?.enabled ?? false,
  });

  const {
    editingTaskId: editingPlannedTaskId,
    tempDate: tempPlannedDate,
    setTempDate: setTempPlannedDate,
    startEdit: startEditPlannedDate,
    saveEdit: savePlannedDate,
    cancelEdit: cancelEditPlannedDate,
  } = usePlannedDateEdit({
    onSave: onPlannedDateChange,
  });

  const { orderedTasks, setOrderedTasks } = useTaskTableSort({
    tasks,
    milestones,
    sortKey: resolvedConfig.sorting?.key as "title" | "createdAt" | "planned" | "scheduled" | "type" | "milestone" | "archivedAt" | undefined,
    sortAsc: resolvedConfig.sorting?.ascending,
    activeTaskIds,
  });

  // 編集モーダル用state
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // 日時チェック用のヘルパー
  const isDailyDoneToday = useCallback((task: Task): boolean => {
    if (task.type !== "daily") return false;
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    const today = d.getTime();
    return (task.dailyDoneDates ?? []).includes(today);
  }, []);

  // タスク完了トグル
  const handleToggle = useCallback(
    (task: Task) => {
      if (task.type === "daily") {
        toggleDailyToday(task.id);
        toast.show(
          `「${task.title}」を${isDailyDoneToday(task) ? "未完了" : "完了"}にしました`,
          "success"
        );
      } else {
        toggle(task.id);
        toast.show(
          `「${task.title}」を${task.completed ? "未完了" : "完了"}にしました`,
          "success"
        );
      }
    },
    [toggle, toggleDailyToday, toast, isDailyDoneToday]
  );

  // スワイプ完了
  const handleSwipeComplete = useCallback(
    (task: Task) => {
      handleToggle(task);
    },
    [handleToggle]
  );

  // スワイプ削除
  const handleSwipeDelete = useCallback(
    (task: Task) => {
      removeTask(task.id);
      toast.show("タスクを削除しました", "success");
    },
    [removeTask, toast]
  );

  // 並び替え
  const handleReorder = useCallback(
    (newOrder: Task[]) => {
      setOrderedTasks(newOrder);
      if (onReorder) {
        onReorder(newOrder);
      }
    },
    [setOrderedTasks, onReorder]
  );

  // デフォルトのコンテキストメニューアクション
  const defaultContextMenuActions: ContextMenuAction[] = useMemo(() => {
    return resolvedConfig.contextMenu?.actions ?? [];
  }, [resolvedConfig.contextMenu?.actions]);

  // デフォルトの一括操作アクション
  const defaultBulkActions: BulkAction[] = useMemo(() => {
    return resolvedConfig.bulkActions?.actions ?? [];
  }, [resolvedConfig.bulkActions?.actions]);

  // ドラッグ&ドロップが有効かどうか
  const isDragDropEnabled = resolvedConfig.dragDrop?.enabled && !resolvedConfig.sorting?.key;

  return (
    <div className={`rounded-lg border border-border bg-card overflow-hidden ${className}`}>
      {/* タイトル */}
      <div className="px-4 py-3 border-b border-border/60">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>

      {/* 一括操作メニュー */}
      {resolvedConfig.bulkActions?.enabled && selectedCount > 0 && (
        <BulkActionsMenu
          selectedCount={selectedCount}
          selectedIds={selectedIds}
          selectedTasks={selectedTasks}
          actions={defaultBulkActions}
          onClearSelection={clearSelection}
        />
      )}

      {/* ヘッダー */}
      <TaskTableHeader
        columns={columns}
        selectionEnabled={resolvedConfig.selection?.enabled ?? false}
        allChecked={allChecked}
        onSelectAll={selectAll}
        sorting={resolvedConfig.sorting}
        dragDropEnabled={isDragDropEnabled ?? false}
      />

      {/* タスクリスト */}
      {orderedTasks.length === 0 ? (
        <div className="py-8 text-center text-sm text-foreground/50">
          {emptyMessage}
        </div>
      ) : isDragDropEnabled ? (
        <Reorder.Group
          axis="y"
          values={orderedTasks}
          onReorder={handleReorder}
          className="divide-y divide-transparent"
        >
          {orderedTasks.map((task) => (
            <TaskTableRow
              key={task.id}
              task={task}
              config={resolvedConfig}
              milestones={milestones}
              selected={selected[task.id] ?? false}
              isActive={activeTaskIds.includes(task.id)}
              activeIndex={activeTaskIds.indexOf(task.id)}
              isDailyDoneToday={isDailyDoneToday(task)}
              editingPlannedTaskId={editingPlannedTaskId}
              tempPlannedDate={tempPlannedDate}
              onEdit={setEditingTask}
              onContext={openContextMenu}
              onSelectOne={selectOne}
              onToggle={handleToggle}
              onSwipeComplete={resolvedConfig.swipe?.enabled ? handleSwipeComplete : undefined}
              onSwipeDelete={resolvedConfig.swipe?.enabled ? handleSwipeDelete : undefined}
              setTempPlannedDate={setTempPlannedDate}
              savePlannedDate={(id) => savePlannedDate(id)}
              cancelEditPlannedDate={cancelEditPlannedDate}
              startEditPlannedDate={startEditPlannedDate}
            />
          ))}
        </Reorder.Group>
      ) : (
        <div className="divide-y divide-transparent">
          {orderedTasks.map((task) => (
            <TaskTableRow
              key={task.id}
              task={task}
              config={resolvedConfig}
              milestones={milestones}
              selected={selected[task.id] ?? false}
              isActive={activeTaskIds.includes(task.id)}
              activeIndex={activeTaskIds.indexOf(task.id)}
              isDailyDoneToday={isDailyDoneToday(task)}
              editingPlannedTaskId={editingPlannedTaskId}
              tempPlannedDate={tempPlannedDate}
              onEdit={setEditingTask}
              onContext={openContextMenu}
              onSelectOne={selectOne}
              onToggle={handleToggle}
              onSwipeComplete={resolvedConfig.swipe?.enabled ? handleSwipeComplete : undefined}
              onSwipeDelete={resolvedConfig.swipe?.enabled ? handleSwipeDelete : undefined}
              setTempPlannedDate={setTempPlannedDate}
              savePlannedDate={(id) => savePlannedDate(id)}
              cancelEditPlannedDate={cancelEditPlannedDate}
              startEditPlannedDate={startEditPlannedDate}
            />
          ))}
        </div>
      )}

      {/* コンテキストメニュー */}
      {resolvedConfig.contextMenu?.enabled && (
        <ContextMenu
          state={contextMenu}
          actions={defaultContextMenuActions}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}
