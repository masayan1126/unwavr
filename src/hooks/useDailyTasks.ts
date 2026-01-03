"use client";
import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";

type SortKey = "title" | "createdAt" | "type" | "milestone";

export function useDailyTasks() {
    const tasks = useAppStore((s) => s.tasks);
    const hydrating = useAppStore((s) => s.hydrating);
    const milestones = useAppStore((s) => s.milestones);

    const daily = useMemo(() => tasks.filter((t) => t.type === "daily"), [tasks]);

    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [sortKey, setSortKey] = useState<SortKey>("createdAt");
    const [sortAsc, setSortAsc] = useState<boolean>(false);
    const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "incomplete">("all");

    const filteredDaily = useMemo(() => {
        let list = daily;
        if (filterStatus === "completed") {
            list = list.filter((t) => t.completed);
        } else if (filterStatus === "incomplete") {
            list = list.filter((t) => !t.completed);
        }
        return list;
    }, [daily, filterStatus]);

    const sortedDaily = useMemo(() => {
        const list = filteredDaily.slice();
        const dir = sortAsc ? 1 : -1;
        list.sort((a, b) => {
            if (sortKey === "title") {
                return dir * (a.title ?? "").localeCompare(b.title ?? "");
            }
            if (sortKey === "createdAt") {
                return dir * ((a.createdAt ?? 0) - (b.createdAt ?? 0));
            }
            if (sortKey === "type") {
                // All are daily, but for consistency if mixed in future
                return 0;
            }
            if (sortKey === "milestone") {
                const ma = milestones.find((m) => m.id === (a.milestoneIds ?? [])[0])?.title ?? "";
                const mb = milestones.find((m) => m.id === (b.milestoneIds ?? [])[0])?.title ?? "";
                return dir * ma.localeCompare(mb);
            }
            return 0;
        });
        return list;
    }, [filteredDaily, sortKey, sortAsc, milestones]);

    const total = sortedDaily.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const pageItems = useMemo(() => {
        const offset = (page - 1) * pageSize;
        return sortedDaily.slice(offset, offset + pageSize);
    }, [sortedDaily, page, pageSize]);

    return {
        hydrating,
        pageItems,
        total,
        page,
        setPage,
        pageSize,
        setPageSize,
        totalPages,
        sortKey,
        setSortKey,
        sortAsc,
        setSortAsc,
        filterStatus,
        setFilterStatus,
    };
}
