// Main component
export { TaskTable } from "./TaskTable";

// Types
export type {
  ColumnId,
  ColumnConfig,
  ContextMenuAction,
  BulkAction,
  SelectionConfig,
  DragDropConfig,
  SwipeConfig,
  ContextMenuConfig,
  BulkActionsConfig,
  SortingConfig,
  FilteringConfig,
  TaskTableConfig,
  TaskTableProps,
  ColumnProps,
  ContextMenuState,
} from "./types";

// Presets
export {
  COLUMN_DEFINITIONS,
  COLUMNS,
  PRESETS,
  mergeConfig,
  resolveColumns,
} from "./presets";

// Hooks (for advanced usage)
export {
  useTaskTableSelection,
  useContextMenu,
  usePlannedDateEdit,
  useTaskTableSort,
} from "./hooks";

// Sub-components (for advanced usage)
export { TaskTableHeader } from "./TaskTableHeader";
export { TaskTableRow } from "./TaskTableRow";
export { ContextMenu } from "./ContextMenu";
export { BulkActionsMenu } from "./BulkActionsMenu";

// Column components (for advanced usage)
export {
  TitleColumn,
  CreatedColumn,
  PlannedColumn,
  ScheduledColumn,
  TypeColumn,
  MilestoneColumn,
  ArchivedAtColumn,
} from "./columns";
