"use client";
import { useMemo, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { Task } from "@/lib/types";

type SortKey = "title" | "createdAt" | "planned" | "type" | "milestone";

export function useBacklogTasks() {
    const tasks = useAppStore((s) => s.tasks);
    const hydrating = useAppStore((s) => s.hydrating);
    const milestones = useAppStore((s) => s.milestones);

    // Filter states
    const [showIncomplete, setShowIncomplete] = useState(true);
    const [showCompleted, setShowCompleted] = useState(true);
    const [filterOpen, setFilterOpen] = useState(false);

    // Pagination & Sort states for Incomplete
    const [pageInc, setPageInc] = useState(1);
    const [pageSizeInc, setPageSizeInc] = useState(10);
    const [sortKeyInc, setSortKeyInc] = useState<SortKey>("planned");
    const [sortAscInc, setSortAscInc] = useState(true);

    // Pagination & Sort states for Completed
    const [pageCom, setPageCom] = useState(1);
    const [pageSizeCom, setPageSizeCom] = useState(10);
    const [sortKeyCom, setSortKeyCom] = useState<SortKey>("planned");
    const [sortAscCom, setSortAscCom] = useState(true);

    const backlog = useMemo(() => tasks.filter((t) => t.type === "backlog"), [tasks]);
    const incompleteBacklog = useMemo(() => backlog.filter((t) => !t.completed), [backlog]);
    const completedBacklog = useMemo(() => backlog.filter((t) => t.completed), [backlog]);

    const totalInc = incompleteBacklog.length;
    const totalCom = completedBacklog.length;
    const totalPagesInc = Math.max(1, Math.ceil(totalInc / pageSizeInc));
    const totalPagesCom = Math.max(1, Math.ceil(totalCom / pageSizeCom));

    const sortTasks = useCallback((list: Task[], key: SortKey, asc: boolean) => {
        const sorted = list.slice();
        const dir = asc ? 1 : -1;
        sorted.sort((a, b) => {
            if (key === "title") {
                return dir * (a.title ?? "").localeCompare(b.title ?? "");
            }
            if (key === "createdAt") {
                return dir * ((a.createdAt ?? 0) - (b.createdAt ?? 0));
            }
            if (key === "planned") {
                const pa = (a.plannedDates ?? []).slice().sort((x, y) => x - y)[0] ?? Number.MAX_SAFE_INTEGER;
                const pb = (b.plannedDates ?? []).slice().sort((x, y) => x - y)[0] ?? Number.MAX_SAFE_INTEGER;
                return dir * (pa - pb);
            }
            if (key === "type") {
                const order: Record<string, number> = { daily: 0, scheduled: 1, backlog: 2 };
                return dir * ((order[a.type] ?? 9) - (order[b.type] ?? 9));
            }
            if (key === "milestone") {
                const ma = milestones.find((m) => m.id === a.milestoneId)?.title ?? "";
                const mb = milestones.find((m) => m.id === b.milestoneId)?.title ?? "";
                return dir * ma.localeCompare(mb);
            }
            return 0;
        });
        return sorted;
    }, [milestones]);

    const sortedIncompleteBacklog = useMemo(
        () => sortTasks(incompleteBacklog, sortKeyInc, sortAscInc),
        [incompleteBacklog, sortKeyInc, sortAscInc, sortTasks]
    );

    const sortedCompletedBacklog = useMemo(
        () => sortTasks(completedBacklog, sortKeyCom, sortAscCom),
        [completedBacklog, sortKeyCom, sortAscCom, sortTasks]
    );

    const incItems = useMemo(() => {
        const offset = (pageInc - 1) * pageSizeInc;
        return sortedIncompleteBacklog.slice(offset, offset + pageSizeInc);
    }, [sortedIncompleteBacklog, pageInc, pageSizeInc]);

    const comItems = useMemo(() => {
        const offset = (pageCom - 1) * pageSizeCom;
        return sortedCompletedBacklog.slice(offset, offset + pageSizeCom);
    }, [sortedCompletedBacklog, pageCom, pageSizeCom]);

    return {
        hydrating,
        // Filter
        showIncomplete,
        setShowIncomplete,
        showCompleted,
        setShowCompleted,
        filterOpen,
        setFilterOpen,
        // Incomplete List
        incItems,
        totalInc,
        pageInc,
        setPageInc,
        pageSizeInc,
        setPageSizeInc,
        totalPagesInc,
        sortKeyInc,
        setSortKeyInc,
        sortAscInc,
        setSortAscInc,
        // Completed List
        comItems,
        totalCom,
        pageCom,
        setPageCom,
        pageSizeCom,
        setPageSizeCom,
        totalPagesCom,
        sortKeyCom,
        setSortKeyCom,
        sortAscCom,
        setSortAscCom,
    };
}
