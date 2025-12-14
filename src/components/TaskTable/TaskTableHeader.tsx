"use client";

import {
  CheckCircle2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Type,
  CalendarPlus,
  CalendarCheck,
  CalendarRange,
  Tag,
  Flag,
  Archive,
} from "lucide-react";
import { ColumnConfig, SortingConfig, ColumnId } from "./types";

// 列ごとのアイコン
const COLUMN_ICONS: Record<ColumnId, React.ReactNode> = {
  title: <Type size={12} className="opacity-60" />,
  created: <CalendarPlus size={12} className="opacity-60" />,
  planned: <CalendarCheck size={12} className="opacity-60" />,
  scheduled: <CalendarRange size={12} className="opacity-60" />,
  type: <Tag size={12} className="opacity-60" />,
  milestone: <Flag size={12} className="opacity-60" />,
  archivedAt: <Archive size={12} className="opacity-60" />,
};

interface TaskTableHeaderProps {
  columns: ColumnConfig[];
  selectionEnabled: boolean;
  allChecked: boolean;
  onSelectAll: (checked: boolean) => void;
  sorting?: SortingConfig;
  dragDropEnabled: boolean;
}

export function TaskTableHeader({
  columns,
  selectionEnabled,
  allChecked,
  onSelectAll,
  sorting,
  dragDropEnabled,
}: TaskTableHeaderProps) {
  const handleSort = (columnId: string, sortable?: boolean) => {
    if (!sortable || !sorting?.onSortChange) return;
    const key = columnId === "created" ? "createdAt" : columnId;
    if (sorting.key === key) {
      sorting.onSortChange(key, !sorting.ascending);
    } else {
      sorting.onSortChange(key, true);
    }
  };

  const getSortIcon = (columnId: string) => {
    const key = columnId === "created" ? "createdAt" : columnId;
    if (sorting?.key !== key) {
      return <ArrowUpDown size={12} className="opacity-40" />;
    }
    return sorting.ascending ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  return (
    <div className="flex items-center gap-2 py-2 px-2 text-xs text-foreground/60 border-b border-border/60 font-medium">
      {/* ドラッグハンドル用のスペース */}
      {dragDropEnabled && <div className="w-[24px] flex-shrink-0" />}

      {/* 選択チェックボックス */}
      {selectionEnabled && (
        <div className="w-[24px] flex-shrink-0 flex justify-center">
          <button
            type="button"
            onClick={() => onSelectAll(!allChecked)}
            className={`w-4 h-4 rounded-[4px] border transition-all flex items-center justify-center ${
              allChecked
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/30 hover:border-primary/60 bg-transparent"
            }`}
          >
            {allChecked && <CheckCircle2 size={10} strokeWidth={3} />}
          </button>
        </div>
      )}

      {/* 完了チェック用のスペース */}
      <div className="w-5 flex-shrink-0" />

      {/* 列ヘッダー */}
      {columns.map((col) => {
        const isTitle = col.id === "title";
        const icon = COLUMN_ICONS[col.id];

        return (
          <div
            key={col.id}
            className={`${
              isTitle ? "flex-1 min-w-0" : `hidden sm:block ${col.width}`
            } flex items-center gap-1.5 px-2 ${
              col.sortable ? "cursor-pointer hover:text-foreground" : ""
            }`}
            onClick={() => handleSort(col.id, col.sortable)}
          >
            {icon}
            <span className="truncate">{col.header}</span>
            {col.sortable && getSortIcon(col.id)}
          </div>
        );
      })}
    </div>
  );
}
