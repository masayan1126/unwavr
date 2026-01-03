import { useMemo, useState, useCallback } from "react";
import { Task, Milestone } from "@/lib/types";

type SortKey =
  | "title"
  | "createdAt"
  | "planned"
  | "scheduled"
  | "type"
  | "milestone"
  | "archivedAt";

interface UseTaskTableSortProps {
  tasks: Task[];
  milestones: Milestone[];
  sortKey?: SortKey;
  sortAsc?: boolean;
  activeTaskIds?: string[];
}

export function useTaskTableSort({
  tasks,
  milestones,
  sortKey,
  sortAsc = true,
  activeTaskIds = [],
}: UseTaskTableSortProps) {
  // ドラッグ&ドロップで並び替えた場合のカスタム順序を保持
  const [customOrder, setCustomOrder] = useState<Task[] | null>(null);

  // ソート処理（useMemoで計算）
  const orderedTasks = useMemo(() => {
    // カスタム順序がある場合（ドラッグ&ドロップ後）はそれを使用
    if (customOrder && !sortKey) {
      return customOrder;
    }

    // sortKeyがない場合は、着手中タスクを優先しorder順にソート
    if (!sortKey) {
      return [...tasks].sort((a, b) => {
        const aIsActive = activeTaskIds.includes(a.id);
        const bIsActive = activeTaskIds.includes(b.id);
        if (aIsActive && !bIsActive) return -1;
        if (!aIsActive && bIsActive) return 1;
        return (a.order ?? 0) - (b.order ?? 0);
      });
    }

    // sortKeyがある場合はソート
    const list = tasks.slice();
    list.sort((a, b) => {
      const dir = sortAsc ? 1 : -1;

      switch (sortKey) {
        case "title":
          return dir * (a.title ?? "").localeCompare(b.title ?? "");

        case "createdAt":
          return dir * ((a.createdAt ?? 0) - (b.createdAt ?? 0));

        case "planned": {
          const pa =
            (a.plannedDates ?? []).slice().sort((x, y) => x - y)[0] ??
            Number.MAX_SAFE_INTEGER;
          const pb =
            (b.plannedDates ?? []).slice().sort((x, y) => x - y)[0] ??
            Number.MAX_SAFE_INTEGER;
          return dir * (pa - pb);
        }

        case "scheduled": {
          const da = (a.scheduled?.daysOfWeek ?? []).join(",");
          const db = (b.scheduled?.daysOfWeek ?? []).join(",");
          return dir * da.localeCompare(db);
        }

        case "type": {
          const order: Record<string, number> = {
            daily: 0,
            scheduled: 1,
            backlog: 2,
          };
          return dir * ((order[a.type] ?? 9) - (order[b.type] ?? 9));
        }

        case "milestone": {
          const ma =
            milestones.find((m) => m.id === (a.milestoneIds ?? [])[0])?.title ?? "";
          const mb =
            milestones.find((m) => m.id === (b.milestoneIds ?? [])[0])?.title ?? "";
          return dir * ma.localeCompare(mb);
        }

        case "archivedAt":
          return dir * ((a.archivedAt ?? 0) - (b.archivedAt ?? 0));

        default:
          return 0;
      }
    });

    return list;
  }, [tasks, sortKey, sortAsc, milestones, activeTaskIds, customOrder]);

  // ドラッグ&ドロップ時に呼ばれる関数
  const setOrderedTasks = useCallback((newOrder: Task[]) => {
    setCustomOrder(newOrder);
  }, []);

  return {
    orderedTasks,
    setOrderedTasks,
    sortedTasks: orderedTasks,
  };
}
