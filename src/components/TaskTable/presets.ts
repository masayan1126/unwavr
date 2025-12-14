import { ColumnId, TaskTableConfig, ColumnConfig } from "./types";

// 列の定義
export const COLUMN_DEFINITIONS: Record<ColumnId, ColumnConfig> = {
  title: {
    id: "title",
    header: "タイトル",
    width: "flex-1",
    sortable: true,
  },
  created: {
    id: "created",
    header: "作成日",
    width: "w-[120px]",
    sortable: true,
  },
  planned: {
    id: "planned",
    header: "実行日",
    width: "w-[120px]",
    sortable: true,
    editable: true,
  },
  scheduled: {
    id: "scheduled",
    header: "設定（曜日/期間）",
    width: "w-[160px]",
    sortable: true,
  },
  type: {
    id: "type",
    header: "種別",
    width: "w-[128px]",
    sortable: true,
  },
  milestone: {
    id: "milestone",
    header: "マイルストーン",
    width: "w-[160px]",
    sortable: true,
  },
  archivedAt: {
    id: "archivedAt",
    header: "アーカイブ日",
    width: "w-[120px]",
    sortable: true,
  },
};

// よく使う列のセット
export const COLUMNS = {
  // 最小限
  minimal: ["title", "type"] as ColumnId[],
  // 標準（計画日付あり）
  standard: ["title", "planned", "type"] as ColumnId[],
  // 全列
  full: ["title", "created", "planned", "scheduled", "type", "milestone"] as ColumnId[],
  // アーカイブ向け
  archived: ["title", "type", "archivedAt"] as ColumnId[],
  // スケジュール向け
  scheduled: ["title", "scheduled", "type"] as ColumnId[],
  // 期限切れ向け
  overdue: ["title", "created", "planned", "type"] as ColumnId[],
} as const;

// プリセット設定
export const PRESETS = {
  // 最もシンプル - weekendページ向け
  simple: {
    columns: COLUMNS.minimal,
    selection: { enabled: false },
    dragDrop: { enabled: false },
    swipe: { enabled: false },
    contextMenu: { enabled: false },
    bulkActions: { enabled: false },
  } satisfies TaskTableConfig,

  // 標準 - homeページ向け
  standard: {
    columns: COLUMNS.standard,
    selection: { enabled: true },
    dragDrop: { enabled: true },
    swipe: { enabled: true },
    contextMenu: { enabled: true },
    bulkActions: { enabled: true },
  } satisfies TaskTableConfig,

  // 毎日タスク向け
  daily: {
    columns: COLUMNS.minimal,
    selection: { enabled: true },
    dragDrop: { enabled: true },
    swipe: { enabled: true },
    contextMenu: { enabled: true },
    bulkActions: { enabled: true },
  } satisfies TaskTableConfig,

  // 積み上げ候補向け
  backlog: {
    columns: COLUMNS.standard,
    selection: { enabled: true },
    dragDrop: { enabled: true },
    swipe: { enabled: true },
    contextMenu: { enabled: true },
    bulkActions: { enabled: true },
  } satisfies TaskTableConfig,

  // 特定曜日向け
  scheduled: {
    columns: COLUMNS.scheduled,
    selection: { enabled: true },
    dragDrop: { enabled: true },
    swipe: { enabled: true },
    contextMenu: { enabled: true },
    bulkActions: { enabled: true },
  } satisfies TaskTableConfig,

  // アーカイブ向け
  archived: {
    columns: COLUMNS.archived,
    selection: { enabled: true },
    dragDrop: { enabled: false },
    swipe: { enabled: false },
    contextMenu: { enabled: true },
    bulkActions: { enabled: true },
  } satisfies TaskTableConfig,

  // 期限切れ向け
  overdue: {
    columns: COLUMNS.overdue,
    selection: { enabled: true },
    dragDrop: { enabled: false },
    swipe: { enabled: false },
    contextMenu: { enabled: true },
    bulkActions: { enabled: true },
  } satisfies TaskTableConfig,
} as const;

// プリセットをマージするヘルパー
export function mergeConfig(
  base: TaskTableConfig,
  override?: Partial<TaskTableConfig>
): TaskTableConfig {
  if (!override) return base;
  return {
    ...base,
    ...override,
    columns: override.columns ?? base.columns,
    selection: {
      enabled: override.selection?.enabled ?? base.selection?.enabled ?? false,
      ...base.selection,
      ...override.selection,
    },
    dragDrop: {
      enabled: override.dragDrop?.enabled ?? base.dragDrop?.enabled ?? false,
      ...base.dragDrop,
      ...override.dragDrop,
    },
    swipe: {
      enabled: override.swipe?.enabled ?? base.swipe?.enabled ?? false,
      ...base.swipe,
      ...override.swipe,
    },
    contextMenu: {
      enabled: override.contextMenu?.enabled ?? base.contextMenu?.enabled ?? false,
      ...base.contextMenu,
      ...override.contextMenu,
    },
    bulkActions: {
      enabled: override.bulkActions?.enabled ?? base.bulkActions?.enabled ?? false,
      ...base.bulkActions,
      ...override.bulkActions,
    },
    sorting: { ...base.sorting, ...override.sorting },
    filtering: { ...base.filtering, ...override.filtering },
  };
}

// 列設定を解決するヘルパー
export function resolveColumns(columns: ColumnId[]): ColumnConfig[] {
  return columns.map((id) => COLUMN_DEFINITIONS[id]);
}
