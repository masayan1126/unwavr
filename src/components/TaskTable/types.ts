import { ReactNode } from "react";
import { Task } from "@/lib/types";

// 列の識別子
export type ColumnId =
  | "title"
  | "created"
  | "planned"
  | "scheduled"
  | "type"
  | "milestone"
  | "archivedAt";

// 列の設定
export interface ColumnConfig {
  id: ColumnId;
  header: string;
  width: string;
  visible?: boolean;
  sortable?: boolean;
  editable?: boolean;
}

// コンテキストメニューアクション
export interface ContextMenuAction {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: (task: Task) => void | Promise<void>;
  variant?: "default" | "danger";
  separator?: boolean;
  condition?: (task: Task) => boolean;
}

// 一括操作アクション
export interface BulkAction {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: (selectedIds: string[], selectedTasks: Task[]) => void | Promise<void>;
  variant?: "default" | "danger";
  condition?: (selectedTasks: Task[]) => boolean;
}

// 選択設定
export interface SelectionConfig {
  enabled: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
}

// ドラッグ&ドロップ設定
export interface DragDropConfig {
  enabled: boolean;
  onReorder?: (tasks: Task[]) => void;
}

// スワイプジェスチャー設定
export interface SwipeConfig {
  enabled: boolean;
  onSwipeComplete?: (task: Task) => void;
  onSwipeDelete?: (task: Task) => void;
}

// コンテキストメニュー設定
export interface ContextMenuConfig {
  enabled: boolean;
  actions?: ContextMenuAction[];
}

// 一括操作設定
export interface BulkActionsConfig {
  enabled: boolean;
  actions?: BulkAction[];
}

// ソート設定
export interface SortingConfig {
  key?: string;
  ascending?: boolean;
  onSortChange?: (key: string, ascending: boolean) => void;
}

// フィルター設定
export interface FilteringConfig {
  type?: "all" | "daily" | "backlog" | "scheduled";
  status?: "all" | "completed" | "incomplete";
  onFilterChange?: (type: string, status: string) => void;
}

// メインの設定オブジェクト
export interface TaskTableConfig {
  columns?: ColumnId[];
  selection?: SelectionConfig;
  dragDrop?: DragDropConfig;
  swipe?: SwipeConfig;
  contextMenu?: ContextMenuConfig;
  bulkActions?: BulkActionsConfig;
  sorting?: SortingConfig;
  filtering?: FilteringConfig;
}

// TaskTableのprops
export interface TaskTableProps {
  title: string;
  tasks: Task[];
  config?: TaskTableConfig;
  emptyMessage?: string;
  className?: string;
}

// 列コンポーネント用のprops
export interface ColumnProps {
  task: Task;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onSaveEdit?: (value: unknown) => void;
  onCancelEdit?: () => void;
}

// コンテキストメニューのstate
export interface ContextMenuState {
  task: Task;
  position: { x: number; y: number };
}
