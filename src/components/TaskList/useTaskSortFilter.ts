import { useMemo, useState, useEffect } from "react";
import { Task, Milestone } from "@/lib/types";
import { useAppStore } from "@/lib/store";

type SortKey = "title" | "createdAt" | "planned" | "scheduled" | "type" | "milestone";
type FilterType = "all" | "daily" | "backlog" | "scheduled";
type FilterStatus = "all" | "completed" | "incomplete";

interface UseTaskSortFilterProps {
    tasks: Task[];
    milestones: Milestone[];
    sortKey?: SortKey;
    sortAsc?: boolean;
    filterType?: FilterType;
    filterStatus?: FilterStatus;
}

export function useTaskSortFilter({
    tasks,
    milestones,
    sortKey,
    sortAsc,
    filterType = "all",
    filterStatus = "all",
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
                    const ma = milestones.find((m) => m.id === a.milestoneId)?.title ?? "";
                    const mb = milestones.find((m) => m.id === b.milestoneId)?.title ?? "";
                    return dir * ma.localeCompare(mb);
                }
                return 0;
            });
        }
        return list;
    }, [tasks, filterType, filterStatus, sortKey, sortAsc, milestones]);

    useEffect(() => {
        if (!sortKey) {
            const sorted = [...filteredSorted].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            setOrderedTasks(sorted);
        } else {
            setOrderedTasks(filteredSorted);
        }
    }, [filteredSorted, sortKey]);

    return { orderedTasks, setOrderedTasks, filteredSorted };
}
