import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { TaskType } from "@/lib/types";
import { isOverdue, isDailyDoneToday, isBacklogPlannedToday, isScheduledForToday } from "@/lib/taskUtils";

export const useTasksPage = () => {
    const tasks = useAppStore((s) => s.tasks);
    const hydrating = useAppStore((s) => s.hydrating);
    const [selectedType, setSelectedType] = useState<TaskType | "all">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const searchParams = useSearchParams();
    const [openCreate, setOpenCreate] = useState(false);

    useEffect(() => {
        if (searchParams.get("new") === "1") setOpenCreate(true);
        const searchParam = searchParams.get("search");
        const taskIdParam = searchParams.get("taskId");
        if (taskIdParam) setSearchQuery(taskIdParam);
        else if (searchParam) setSearchQuery(searchParam);
    }, [searchParams]);

    const baseFiltered = useMemo(() => {
        const dailyFlag = searchParams.get("daily") === "1";
        const backlogTodayFlag = searchParams.get("backlogToday") === "1";
        const scheduledTodayFlag = searchParams.get("scheduledToday") === "1";
        const overdueFlag = searchParams.get("overdue") === "1";
        const onlyIncomplete = searchParams.get("onlyIncomplete") === "1";

        // Filter out archived tasks first
        const activeTasks = tasks.filter((task) => task.archived !== true);

        let filtered = activeTasks.filter((task) => {
            if (dailyFlag || backlogTodayFlag || scheduledTodayFlag || overdueFlag) {
                if (onlyIncomplete) {
                    if (task.type === "daily") {
                        if (isDailyDoneToday(task.dailyDoneDates)) return false;
                    } else {
                        if (task.completed) return false;
                    }
                }
                const now = new Date();
                const todayLocalMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                if (overdueFlag && isOverdue(task, todayLocalMidnight)) return true;
                if (dailyFlag && task.type === "daily") return true;
                if (backlogTodayFlag && task.type === "backlog" && isBacklogPlannedToday(task.plannedDates)) return true;
                if (scheduledTodayFlag && task.type === "scheduled" && isScheduledForToday(task.scheduled?.daysOfWeek, task.scheduled?.dateRanges)) return true;
                return false;
            }
            return true;
        });

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((task) =>
                task.title.toLowerCase().includes(query) ||
                (task.description && task.description.toLowerCase().includes(query)) ||
                task.id.toLowerCase().includes(query)
            );
        }
        return filtered;
    }, [tasks, searchQuery, searchParams]);

    const filteredTasks = useMemo(() => {
        if (selectedType === "all") return baseFiltered;
        let filtered = baseFiltered.filter((t) => t.type === selectedType);
        // 積み上げ候補フィルター時は完了済みを除外（アーカイブで表示）
        if (selectedType === "backlog") {
            filtered = filtered.filter((t) => !t.completed);
        }
        return filtered;
    }, [baseFiltered, selectedType]);

    const taskCounts = useMemo(() => {
        return {
            all: baseFiltered.length,
            daily: baseFiltered.filter(t => t.type === "daily").length,
            backlog: baseFiltered.filter(t => t.type === "backlog" && !t.completed).length,
            scheduled: baseFiltered.filter(t => t.type === "scheduled").length,
        };
    }, [baseFiltered]);

    return {
        hydrating,
        selectedType,
        setSelectedType,
        searchQuery,
        setSearchQuery,
        openCreate,
        setOpenCreate,
        filteredTasks,
        taskCounts,
        baseFiltered, // Exposed for "all" view where we render sections manually
    };
};
