import { useMemo, useState, useEffect } from "react";
import { Task, Milestone } from "@/lib/types";


type SortKey = "title" | "createdAt" | "planned" | "scheduled" | "type" | "milestone" | "archivedAt";
type FilterType = "all" | "daily" | "backlog" | "scheduled";
type FilterStatus = "all" | "completed" | "incomplete";

interface UseTaskSortFilterProps {
    tasks: Task[];
    milestones: Milestone[];
    sortKey?: SortKey;
    sortAsc?: boolean;
    filterType?: FilterType;
    filterStatus?: FilterStatus;
    activeTaskIds?: string[];
}

export function useTaskSortFilter({
    tasks,
    milestones,
    sortKey,
    sortAsc,
    filterType = "all",
    filterStatus = "all",
    activeTaskIds = [],
}: UseTaskSortFilterProps) {
    const [orderedTasks, setOrderedTasks] = useState<Task[]>([]);

    function isDailyDoneToday(dates?: number[]): boolean {
        const d = new Date();
        d.setUTCHours(0, 0, 0, 0);
        const today = d.getTime();
        const utc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        return Boolean(dates && (dates.includes(today) || dates.includes(utc)));
    }

    const filteredSorted = useMemo(() => {
        let list = tasks.slice();
        if (filterType !== "all") list = list.filter((t) => t.type === filterType);
        if (filterStatus !== "all") {
            list = list.filter((t) => {
                if (t.type === "daily") {
                    const done = isDailyDoneToday(t.dailyDoneDates);
                    return filterStatus === "completed" ? done : !done;
                }
                return filterStatus === "completed" ? t.completed : !t.completed;
            });
        }
        if (sortKey) {
            list.sort((a, b) => {
                const dir = sortAsc ? 1 : -1;
                if (sortKey === "title") {
                    return dir * (a.title ?? "").localeCompare(b.title ?? "");
                }
                if (sortKey === "planned") {
                    const pa = (a.plannedDates ?? []).slice().sort((x, y) => x - y)[0] ?? Number.MAX_SAFE_INTEGER;
                    const pb = (b.plannedDates ?? []).slice().sort((x, y) => x - y)[0] ?? Number.MAX_SAFE_INTEGER;
                    return dir * (pa - pb);
                }
                if (sortKey === "scheduled") {
                    const da = (a.scheduled?.daysOfWeek ?? []).join(",");
                    const db = (b.scheduled?.daysOfWeek ?? []).join(",");
                    return dir * da.localeCompare(db);
                }
                if (sortKey === "type") {
                    const order: Record<string, number> = { daily: 0, scheduled: 1, backlog: 2 };
                    return dir * ((order[a.type] ?? 9) - (order[b.type] ?? 9));
                }
                if (sortKey === "milestone") {
                    const ma = milestones.find((m) => m.id === (a.milestoneIds ?? [])[0])?.title ?? "";
                    const mb = milestones.find((m) => m.id === (b.milestoneIds ?? [])[0])?.title ?? "";
                    return dir * ma.localeCompare(mb);
                }
                if (sortKey === "archivedAt") {
                    const aa = a.archivedAt ?? 0;
                    const ab = b.archivedAt ?? 0;
                    return dir * (aa - ab);
                }
                return 0;
            });
        }
        return list;
    }, [tasks, filterType, filterStatus, sortKey, sortAsc, milestones]);

    useEffect(() => {
        if (!sortKey) {
            const sorted = [...filteredSorted].sort((a, b) => {
                // 着手中のタスクを最優先
                const aIsActive = activeTaskIds.includes(a.id);
                const bIsActive = activeTaskIds.includes(b.id);
                if (aIsActive && !bIsActive) return -1;
                if (!aIsActive && bIsActive) return 1;

                // 次に種別順：毎日 > 特定曜日 > 積み上げ候補
                const typeOrder: Record<string, number> = { daily: 0, scheduled: 1, backlog: 2 };
                const aTypeOrder = typeOrder[a.type] ?? 9;
                const bTypeOrder = typeOrder[b.type] ?? 9;
                if (aTypeOrder !== bTypeOrder) return aTypeOrder - bTypeOrder;

                // 最後にオーダー順
                return (a.order ?? 0) - (b.order ?? 0);
            });
            setOrderedTasks(sorted);
        } else {
            setOrderedTasks(filteredSorted);
        }
    }, [filteredSorted, sortKey, activeTaskIds]);

    return { orderedTasks, setOrderedTasks, filteredSorted };
}
