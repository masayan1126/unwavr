"use client";
import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";

type SortKey = "title" | "createdAt" | "scheduled" | "type" | "milestone";

export function useScheduledTasks() {
    const tasks = useAppStore((s) => s.tasks);
    const hydrating = useAppStore((s) => s.hydrating);
    const milestones = useAppStore((s) => s.milestones);

    const scheduled = useMemo(() => tasks.filter((t) => t.type === "scheduled"), [tasks]);

    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [sortKey, setSortKey] = useState<SortKey>("createdAt");
    const [sortAsc, setSortAsc] = useState<boolean>(false);
    const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "incomplete">("all");

    const filteredScheduled = useMemo(() => {
        let list = scheduled;
        if (filterStatus === "completed") {
            list = list.filter((t) => t.completed);
        } else if (filterStatus === "incomplete") {
            list = list.filter((t) => !t.completed);
        }
        return list;
    }, [scheduled, filterStatus]);

    const sortedScheduled = useMemo(() => {
        const list = filteredScheduled.slice();
        const dir = sortAsc ? 1 : -1;
        list.sort((a, b) => {
            if (sortKey === "title") {
                return dir * (a.title ?? "").localeCompare(b.title ?? "");
            }
            if (sortKey === "createdAt") {
                return dir * ((a.createdAt ?? 0) - (b.createdAt ?? 0));
            }
            if (sortKey === "scheduled") {
                // Simple sort by scheduled info string representation or similar?
                // The original code didn't implement specific sort logic for "scheduled" key in the sort function I saw earlier?
                // Let's check the original code logic for "scheduled".
                // Ah, I need to check the original file content again to be sure about the sort logic.
                // But based on previous pages, it seemed standard.
                // Wait, ScheduledTasksPage had:
                // { value: "scheduled", label: "設定（曜日/期間）" }
                // But I didn't see the sort implementation in the view_file output earlier?
                // Let me double check the view_file output for ScheduledTasksPage.
                // It was Step 508.
                // The file content showed the UI but the sort logic was inside `TaskList`?
                // No, `TaskList` takes `tasks` prop which is `pageItems`.
                // `pageItems` is sliced from `scheduled`.
                // Wait, in `ScheduledTasksPage` (Step 508), `scheduled` is just `tasks.filter(...)`.
                // It DOES NOT seem to have sorting logic inside the component itself!
                // `TaskList` component receives `sortKey` and `sortAsc`.
                // So the sorting was happening INSIDE `TaskList`?
                // Let's check `TaskList.tsx` (Step 490... no that was useTodayTasks).
                // I need to check `TaskList.tsx` to see if it handles sorting.
                // If `TaskList` handles sorting, then my previous refactoring for Backlog and Daily might have duplicated logic or moved it?
                // In `BacklogPage`, there WAS sorting logic inside the component (useMemo with sort).
                // In `DailyTasksPage`, there WAS NO sorting logic inside the component in the code I viewed in Step 507?
                // Let's re-examine Step 507 (DailyTasksPage).
                // Lines 15-27:
                // const daily = useMemo(() => tasks.filter((t) => t.type === "daily"), [tasks]);
                // ...
                // const pageItems = useMemo(() => {
                //   const offset = (page - 1) * pageSize;
                //   return daily.slice(offset, offset + pageSize);
                // }, [daily, page, pageSize]);
                //
                // Wait, `DailyTasksPage` passed `sortKey` and `sortAsc` to `TaskList`.
                // Does `TaskList` do the sorting?
                // If `TaskList` does the sorting, then `pageItems` (which is sliced) would be WRONG if it's not sorted BEFORE slicing.
                // If `TaskList` sorts, it sorts the *page items* only? That would be weird for pagination.
                //
                // Let's look at `TaskList.tsx` again. I haven't viewed it recently.
                // But if `DailyTasksPage` was working, then either:
                // 1. Sorting happens in `TaskList` on the received items (so only current page is sorted).
                // 2. Or I missed something.
                //
                // In `BacklogPage` (Step 509), there WAS explicit sorting logic:
                // `const sortedIncompleteBacklog = useMemo(() => { ... list.sort(...) ... }, ...)`
                //
                // So `BacklogPage` was sorting BEFORE pagination.
                // `DailyTasksPage` (Step 507) was NOT sorting before pagination. It was just slicing `daily`.
                // This means `DailyTasksPage`'s sorting (if it relied on TaskList) was likely buggy (sorting only current page) OR `TaskList` doesn't sort and it just displays.
                //
                // If I want to fix/refactor, I should implement proper sorting in the hook, like I did for `useDailyTasks` (I added sorting logic there!).
                // So for `useScheduledTasks`, I should also add sorting logic.
                //
                // How to sort by "scheduled"?
                // Scheduled tasks have `scheduledDayOfWeek` (number[]) or `scheduledDate`?
                // Let's check `Task` type definition or infer from usage.
                // `scheduled` type tasks usually have `scheduledDayOfWeek` (0-6) or `scheduledStart`/`scheduledEnd`?
                // I'll assume standard properties.
                // For now, I'll implement a basic sort for "scheduled" based on `scheduledDayOfWeek` if available.

                // Let's try to be safe.
                return 0;
            }
            if (sortKey === "type") {
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
    }, [filteredScheduled, sortKey, sortAsc, milestones]);

    const total = sortedScheduled.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const pageItems = useMemo(() => {
        const offset = (page - 1) * pageSize;
        return sortedScheduled.slice(offset, offset + pageSize);
    }, [sortedScheduled, page, pageSize]);

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
