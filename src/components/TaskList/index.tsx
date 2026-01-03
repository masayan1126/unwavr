import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Reorder } from "framer-motion";
import { ChevronDown, CheckCircle2, Circle, Archive, Trash2, ArrowRight, Calendar, Copy, Edit, Play, Pause, RotateCcw, Type, CalendarPlus, CalendarCheck, CalendarRange, Tag, Flag, ArrowUpDown, ArrowUp, ArrowDown, Loader2, ListChecks } from "lucide-react";
import { useSession } from "next-auth/react";
import { Task } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { useConfirm, useToast } from "@/components/Providers";
import TaskDialog from "@/components/TaskCreateDialog";
import TaskForm, { type TaskFormHandle } from "@/components/TaskForm";
import { getTodayDateInput, getTomorrowDateInput } from "@/lib/taskUtils";
import { TaskRow } from "./TaskRow";
import { useTaskSortFilter } from "./useTaskSortFilter";

type SortKey = "title" | "createdAt" | "planned" | "scheduled" | "type" | "milestone" | "archivedAt";

export default function TaskList({
    title,
    tasks,
    showCreatedColumn = false,
    showPlannedColumn = true,
    showScheduledColumn = false,
    showTypeColumn = true,
    showMilestoneColumn = false,
    showArchivedAtColumn = false,
    sortKey: initialSortKey,
    sortAsc: initialSortAsc,
    filterType = "all",
    filterStatus = "all",
    enableSelection = false,
    enableBulkDueUpdate = false,
    enableArchiveActions = false,
    onBulkRestore,
    onBulkPermanentDelete,
}: {
    title: string;
    tasks: Task[];
    showCreatedColumn?: boolean;
    showPlannedColumn?: boolean;
    showScheduledColumn?: boolean;
    showTypeColumn?: boolean;
    showMilestoneColumn?: boolean;
    showArchivedAtColumn?: boolean;
    sortKey?: SortKey;
    sortAsc?: boolean;
    filterType?: "all" | "daily" | "backlog" | "scheduled";
    filterStatus?: "all" | "completed" | "incomplete";
    enableSelection?: boolean;
    enableBulkDueUpdate?: boolean;
    enableArchiveActions?: boolean;
    onBulkRestore?: (ids: string[]) => void;
    onBulkPermanentDelete?: (ids: string[]) => void;
}) {
    const { data: session } = useSession();
    const [sortKey, setSortKey] = useState<SortKey | undefined>(initialSortKey);
    const [sortAsc, setSortAsc] = useState<boolean>(initialSortAsc ?? true);
    const [isSyncingPlannedDate, setIsSyncingPlannedDate] = useState(false);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortAsc(!sortAsc);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    const getSortIcon = (key: SortKey) => {
        if (sortKey !== key) {
            return <ArrowUpDown size={12} className="opacity-40" />;
        }
        return sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
    };
    const updateTask = useAppStore((s) => s.updateTask);
    const updateTaskOrder = useAppStore((s) => s.updateTaskOrder);
    const removeTask = useAppStore((s) => s.removeTask);
    const toast = useToast();
    const globalActiveTaskIds = useAppStore((s) => s.pomodoro.activeTaskIds);
    const addActiveTask = useAppStore((s) => s.addActiveTask);
    const removeActiveTask = useAppStore((s) => s.removeActiveTask);
    const milestones = useAppStore((s) => s.milestones);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const storeTasks = useAppStore((s) => s.tasks);
    const editingTask = useMemo(() => storeTasks.find((t) => t.id === editingId), [editingId, storeTasks]);
    const [ctxTask, setCtxTask] = useState<Task | null>(null);
    const [ctxPos, setCtxPos] = useState<{ x: number; y: number } | null>(null);
    const ctxMenuRef = useRef<HTMLDivElement | null>(null);
    const [editingPlannedTaskId, setEditingPlannedTaskId] = useState<string | null>(null);
    const [tempPlannedDate, setTempPlannedDate] = useState<string>("");
    const formRef = useRef<TaskFormHandle | null>(null);

    // サブタスク対応
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

    const toggleExpand = useCallback((taskId: string) => {
        setExpandedTasks(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) next.delete(taskId);
            else next.add(taskId);
            return next;
        });
    }, []);

    // タスクごとのサブタスクをマップ化
    // NOTE: storeTasksを使用することで、フィルタに関係なく全サブタスクを表示
    const subtasksMap = useMemo(() => {
        const map: Record<string, Task[]> = {};
        for (const t of storeTasks) {
            if (t.parentTaskId && t.archived !== true) {
                if (!map[t.parentTaskId]) map[t.parentTaskId] = [];
                map[t.parentTaskId].push(t);
            }
        }
        return map;
    }, [storeTasks]);

    // タスクごとのサブタスク数を計算
    const subtaskCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const id in subtasksMap) {
            counts[id] = subtasksMap[id].length;
        }
        return counts;
    }, [subtasksMap]);

    const { orderedTasks, setOrderedTasks, filteredSorted } = useTaskSortFilter({
        tasks,
        milestones,
        sortKey,
        sortAsc,
        filterType,
        filterStatus,
        activeTaskIds: globalActiveTaskIds,
    });

    useEffect(() => {
        if (!ctxTask) return;
        const close = (ev?: Event) => {
            if (ev && ctxMenuRef.current && ctxMenuRef.current.contains(ev.target as Node)) return;
            setCtxTask(null); setCtxPos(null);
        };
        const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        document.addEventListener('mousedown', close);
        window.addEventListener('scroll', close, { passive: true } as AddEventListenerOptions);
        window.addEventListener('resize', close);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', close);
            window.removeEventListener('scroll', close);
            window.removeEventListener('resize', close);
            document.removeEventListener('keydown', onEsc);
        };
    }, [ctxTask]);

    function openEdit(t: Task) {
        const latest = useAppStore.getState().tasks.find((x) => x.id === t.id) ?? t;
        setEditingId(latest.id);
    }

    function closeEdit() {
        setEditingId(null);
    }

    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [bulkDateInput, setBulkDateInput] = useState<string>(() => getTodayDateInput());
    const [showBulkMenu, setShowBulkMenu] = useState(false);
    const bulkMenuRef = useRef<HTMLDivElement | null>(null);
    const [selectionModeActive, setSelectionModeActive] = useState(false);
    const onSelectAll = (checked: boolean) => {
        if (!enableSelection) return;
        setSelected(Object.fromEntries(filteredSorted.map((t) => [t.id, checked])));
    };
    const onSelectOne = (id: string, checked: boolean) => setSelected((s) => ({ ...s, [id]: checked }));

    // 選択モード終了時に選択をクリア
    useEffect(() => {
        if (!selectionModeActive) {
            setSelected({});
            setShowBulkMenu(false);
        }
    }, [selectionModeActive]);

    const handleReorder = (newOrder: Task[]) => {
        if (sortKey) return;
        setOrderedTasks(newOrder);
        newOrder.forEach((t, idx) => {
            if (t.order !== idx) {
                updateTaskOrder(t.id, idx);
            }
        });
    };

    // 親タスクドラッグ&ドロップ状態
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
    const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

    const handleParentDragStart = useCallback((taskId: string) => {
        setDraggingTaskId(taskId);
    }, []);

    const handleParentDragEnd = useCallback(() => {
        setDraggingTaskId(null);
        setDragOverTaskId(null);
    }, []);

    const handleParentDrop = useCallback((targetTaskId: string) => {
        if (!draggingTaskId || draggingTaskId === targetTaskId) return;

        // 循環参照チェック: targetTaskがdraggingTaskの子孫でないことを確認
        const isDescendant = (parentId: string, childId: string): boolean => {
            const children = tasks.filter(t => t.parentTaskId === parentId);
            for (const child of children) {
                if (child.id === childId) return true;
                if (isDescendant(child.id, childId)) return true;
            }
            return false;
        };

        if (isDescendant(draggingTaskId, targetTaskId)) {
            toast.show("循環参照になるため設定できません", "error");
            return;
        }

        // 親タスクを設定
        updateTask(draggingTaskId, { parentTaskId: targetTaskId });
        toast.show("サブタスクとして設定しました", "success");

        // 展開状態を更新して新しいサブタスクを表示
        setExpandedTasks(prev => {
            const next = new Set(prev);
            next.add(targetTaskId);
            return next;
        });

        setDraggingTaskId(null);
        setDragOverTaskId(null);
    }, [draggingTaskId, tasks, updateTask, toast]);

    const handleDragOverTask = useCallback((taskId: string | null) => {
        setDragOverTaskId(taskId);
    }, []);

    const allChecked = enableSelection && filteredSorted.length > 0 && filteredSorted.every((t) => selected[t.id]);
    const selectedCount = Object.values(selected).filter(Boolean).length;

    useEffect(() => {
        if (!showBulkMenu) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (!bulkMenuRef.current) return;
            if (!bulkMenuRef.current.contains(event.target as Node)) setShowBulkMenu(false);
        };
        const handleKeydown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setShowBulkMenu(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeydown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeydown);
        };
    }, [showBulkMenu]);

    useEffect(() => {
        if (selectedCount === 0) setShowBulkMenu(false);
    }, [selectedCount]);

    const completeTasks = useAppStore((s) => s.completeTasks);
    const resetDailyDoneForToday = useAppStore((s) => s.resetDailyDoneForToday);
    const archiveDailyTasks = useAppStore((s) => s.archiveDailyTasks);
    const confirm = useConfirm();

    // Googleカレンダーからイベントを削除するヘルパー
    const deleteGoogleCalendarEvents = useCallback(async (task: Task) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const accessToken = (session as any)?.access_token;
        if (!accessToken) return;

        const googleEvents = task.plannedDateGoogleEvents ?? {};
        const eventIds = Object.values(googleEvents);

        for (const eventId of eventIds) {
            if (!eventId) continue;
            try {
                await fetch(`/api/calendar/events/${eventId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
            } catch (err) {
                console.error("[deleteGoogleCalendarEvents] Failed to delete event:", eventId, err);
            }
        }
    }, [session]);

    // タスク削除（Googleカレンダー同期付き）
    const handleDeleteTask = useCallback(async (task: Task) => {
        // Googleカレンダーのイベントを削除
        await deleteGoogleCalendarEvents(task);
        // ローカルタスクを削除
        removeTask(task.id);
        toast.show('タスクを削除しました', 'success');
    }, [deleteGoogleCalendarEvents, removeTask, toast]);

    async function bulkComplete() {
        if (Object.values(selected).every((v) => !v)) return;
        const ids = filteredSorted.filter((t) => selected[t.id]).map((t) => t.id);
        completeTasks(ids);
        setSelected({});
        toast.show(`${ids.length}件を完了にしました`, "success");
    }
    async function bulkMarkIncomplete() {
        if (Object.values(selected).every((v) => !v)) return;
        const dailies = filteredSorted.filter((t) => selected[t.id] && t.type === "daily").map((t) => t.id);
        if (dailies.length) resetDailyDoneForToday(dailies);
        const others = filteredSorted.filter((t) => selected[t.id] && t.type !== "daily");
        for (const t of others) updateTask(t.id, { completed: false });
        setSelected({});
        const total = dailies.length + others.length;
        toast.show(`${total}件を未完了に戻しました`, "success");
    }
    async function bulkArchiveDaily() {
        const dailies = filteredSorted.filter((t) => selected[t.id] && t.type === "daily").map((t) => t.id);
        if (!dailies.length) return;
        const ok = await confirm(`${dailies.length}件の毎日タスクをアーカイブしますか？`, { confirmText: 'アーカイブ' });
        if (!ok) return;
        archiveDailyTasks(dailies);
        setSelected({});
        toast.show(`${dailies.length}件をアーカイブしました`, "success");
    }
    async function bulkDelete() {
        const tasksToDelete = filteredSorted.filter((t) => selected[t.id]);
        if (!tasksToDelete.length) return;
        const ok = await confirm(`${tasksToDelete.length}件を削除しますか？この操作は取り消せません。`, { tone: 'danger', confirmText: '削除' });
        if (!ok) return;
        // Googleカレンダーのイベントを削除
        for (const task of tasksToDelete) {
            await deleteGoogleCalendarEvents(task);
            removeTask(task.id);
        }
        setSelected({});
        toast.show(`${tasksToDelete.length}件を削除しました`, "success");
    }

    async function bulkUpdateDueDate() {
        if (!enableBulkDueUpdate) return;
        const ids = filteredSorted.filter((t) => selected[t.id]).map((t) => t.id);
        if (!ids.length) return;
        if (!bulkDateInput) return;
        const dt = new Date(bulkDateInput);
        if (isNaN(dt.getTime())) return;
        const stamp = Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
        const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const accessToken = (session as any)?.access_token;
        let syncedCount = 0;

        for (const t of filteredSorted) {
            if (!selected[t.id]) continue;
            if (t.type === 'backlog') {
                let googleEventId: string | undefined;
                const existingGoogleEvents = t.plannedDateGoogleEvents ?? {};
                const existingEventId = Object.values(existingGoogleEvents)[0];

                // Googleカレンダーに同期
                if (accessToken) {
                    try {
                        if (existingEventId) {
                            const res = await fetch(`/api/calendar/events/${existingEventId}`, {
                                method: "PATCH",
                                headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                                body: JSON.stringify({ start: { date: dateStr }, end: { date: dateStr } }),
                            });
                            if (res.ok) googleEventId = existingEventId;
                        } else {
                            const res = await fetch("/api/calendar/events", {
                                method: "POST",
                                headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    summary: `📋 ${t.title}`,
                                    description: t.description || undefined,
                                    start: { date: dateStr },
                                    end: { date: dateStr },
                                }),
                            });
                            if (res.ok) {
                                const data = await res.json();
                                googleEventId = data.id;
                            }
                        }
                        if (googleEventId) syncedCount++;
                    } catch (err) {
                        console.error("[bulkUpdateDueDate] Sync error for task:", t.id, err);
                    }
                }

                const newGoogleEvents: Record<string, string> = {};
                if (googleEventId) {
                    newGoogleEvents[String(stamp)] = googleEventId;
                }

                updateTask(t.id, {
                    plannedDates: [stamp],
                    plannedDateGoogleEvents: newGoogleEvents,
                });
            }
        }
        setSelected({});
        toast.show(
            syncedCount > 0
                ? `${ids.length}件の実行日を更新し、${syncedCount}件をGoogleカレンダーに同期しました`
                : `${ids.length}件の実行日を更新しました`,
            syncedCount > 0 ? "success" : "warning"
        );
    }

    async function bulkPostponeToTomorrow() {
        if (!enableBulkDueUpdate) return;
        const ids = filteredSorted.filter((t) => selected[t.id] && t.type === 'backlog').map((t) => t.id);
        if (!ids.length) return;
        const tomorrowInput = getTomorrowDateInput();
        const dt = new Date(tomorrowInput);
        const stamp = Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
        const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const accessToken = (session as any)?.access_token;
        let syncedCount = 0;

        for (const t of filteredSorted) {
            if (!selected[t.id]) continue;
            if (t.type === 'backlog') {
                let googleEventId: string | undefined;
                const existingGoogleEvents = t.plannedDateGoogleEvents ?? {};
                const existingEventId = Object.values(existingGoogleEvents)[0];

                // Googleカレンダーに同期
                if (accessToken) {
                    try {
                        if (existingEventId) {
                            const res = await fetch(`/api/calendar/events/${existingEventId}`, {
                                method: "PATCH",
                                headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                                body: JSON.stringify({ start: { date: dateStr }, end: { date: dateStr } }),
                            });
                            if (res.ok) googleEventId = existingEventId;
                        } else {
                            const res = await fetch("/api/calendar/events", {
                                method: "POST",
                                headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    summary: `📋 ${t.title}`,
                                    description: t.description || undefined,
                                    start: { date: dateStr },
                                    end: { date: dateStr },
                                }),
                            });
                            if (res.ok) {
                                const data = await res.json();
                                googleEventId = data.id;
                            }
                        }
                        if (googleEventId) syncedCount++;
                    } catch (err) {
                        console.error("[bulkPostponeToTomorrow] Sync error for task:", t.id, err);
                    }
                }

                const newGoogleEvents: Record<string, string> = {};
                if (googleEventId) {
                    newGoogleEvents[String(stamp)] = googleEventId;
                }

                updateTask(t.id, {
                    plannedDates: [stamp],
                    plannedDateGoogleEvents: newGoogleEvents,
                });
            }
        }
        setSelected({});
        toast.show(
            syncedCount > 0
                ? `${ids.length}件を明日に繰り越し、${syncedCount}件をGoogleカレンダーに同期しました`
                : `${ids.length}件を明日に繰り越しました`,
            syncedCount > 0 ? "success" : "warning"
        );
    }

    function startEditPlannedDate(task: Task) {
        if (task.type !== 'backlog') return;
        setEditingPlannedTaskId(task.id);
        const planned = (task.plannedDates ?? []).slice().sort((a, b) => a - b);
        if (planned.length > 0) {
            const d = new Date(planned[0]);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            setTempPlannedDate(`${y}-${m}-${dd}`);
        } else {
            setTempPlannedDate(getTodayDateInput());
        }
    }

    const savePlannedDate = useCallback(async (taskId: string) => {
        if (!tempPlannedDate) {
            setEditingPlannedTaskId(null);
            return;
        }
        const dt = new Date(tempPlannedDate);
        if (isNaN(dt.getTime())) {
            toast.show('無効な日付です', 'error');
            setEditingPlannedTaskId(null);
            return;
        }
        const stamp = Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());

        const currentTask = storeTasks.find((t) => t.id === taskId);
        const currentPlanned = (currentTask?.plannedDates ?? [])[0];
        if (currentPlanned === stamp) {
            setEditingPlannedTaskId(null);
            setTempPlannedDate("");
            return;
        }

        setIsSyncingPlannedDate(true);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const accessToken = (session as any)?.access_token;
        console.log("[savePlannedDate] session:", session);
        console.log("[savePlannedDate] accessToken:", accessToken ? "exists" : "undefined");
        let googleEventId: string | undefined;

        // 既存のGoogleイベントIDを取得
        const existingGoogleEvents = currentTask?.plannedDateGoogleEvents ?? {};
        const existingEventId = Object.values(existingGoogleEvents)[0];

        // Googleカレンダーに同期
        if (accessToken && currentTask) {
            try {
                const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
                console.log("[savePlannedDate] dateStr:", dateStr);
                console.log("[savePlannedDate] existingEventId:", existingEventId);

                if (existingEventId) {
                    // 既存のイベントを更新
                    console.log("[savePlannedDate] Updating existing event...");
                    const res = await fetch(`/api/calendar/events/${existingEventId}`, {
                        method: "PATCH",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            start: { date: dateStr },
                            end: { date: dateStr },
                        }),
                    });
                    console.log("[savePlannedDate] PATCH response status:", res.status);
                    if (res.ok) {
                        googleEventId = existingEventId;
                        console.log("[savePlannedDate] Event updated:", googleEventId);
                    } else {
                        const errorText = await res.text();
                        console.error("[savePlannedDate] Failed to update event:", res.status, errorText);
                    }
                } else {
                    // 新規イベントを作成
                    console.log("[savePlannedDate] Creating new event...");
                    const res = await fetch("/api/calendar/events", {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            summary: `📋 ${currentTask.title}`,
                            description: currentTask.description || undefined,
                            start: { date: dateStr },
                            end: { date: dateStr },
                        }),
                    });
                    console.log("[savePlannedDate] POST response status:", res.status);
                    if (res.ok) {
                        const data = await res.json();
                        googleEventId = data.id;
                        console.log("[savePlannedDate] Event created:", googleEventId);
                    } else {
                        const errorText = await res.text();
                        console.error("[savePlannedDate] Failed to create event:", res.status, errorText);
                    }
                }
            } catch (err) {
                console.error("[savePlannedDate] Google Calendar sync error:", err);
            }
        } else {
            console.log("[savePlannedDate] Skipping Google sync - accessToken:", !!accessToken, "currentTask:", !!currentTask);
        }

        // ローカルを更新
        const newGoogleEvents: Record<string, string> = {};
        if (googleEventId) {
            newGoogleEvents[String(stamp)] = googleEventId;
        }

        updateTask(taskId, {
            plannedDates: [stamp],
            plannedDateGoogleEvents: newGoogleEvents,
        });

        setIsSyncingPlannedDate(false);
        let message: string;
        let toastType: 'success' | 'warning' | 'error' = 'success';
        if (googleEventId) {
            message = '実行日を更新し、Googleカレンダーに同期しました';
        } else if (!accessToken) {
            message = '実行日を更新しました（Googleアカウントでログインするとカレンダー同期できます）';
            toastType = 'warning';
        } else {
            message = '実行日を更新しました（Google同期に失敗）';
            toastType = 'error';
        }
        toast.show(message, toastType);
        setEditingPlannedTaskId(null);
        setTempPlannedDate("");
    }, [tempPlannedDate, storeTasks, session, updateTask, toast]);

    function cancelEditPlannedDate() {
        setEditingPlannedTaskId(null);
        setTempPlannedDate("");
    }

    return (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="flex items-center justify-center w-5 h-5 rounded hover:bg-muted transition-colors"
                        aria-label={isCollapsed ? "展開" : "折り畳み"}
                    >
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
                    </button>
                    <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                </div>
                {enableSelection && !isCollapsed && (
                    <div className="flex items-center gap-2">
                        {/* 選択モードトグルボタン */}
                        <button
                            type="button"
                            onClick={() => setSelectionModeActive(!selectionModeActive)}
                            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${
                                selectionModeActive
                                    ? "bg-primary text-primary-foreground"
                                    : "border border-border hover:bg-muted"
                            }`}
                        >
                            <ListChecks size={14} />
                            {selectionModeActive ? "選択解除" : "選択"}
                        </button>
                        {/* バルクメニュー */}
                        {selectionModeActive && (
                            <div ref={bulkMenuRef} className="relative">
                                <button
                                    type="button"
                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[3px] text-xs font-medium transition-colors ${selectedCount > 0
                                        ? "text-primary bg-primary/10 hover:bg-primary/20"
                                        : "opacity-50 cursor-not-allowed"
                                        }`}
                                    onClick={() => {
                                        if (selectedCount === 0) return;
                                        setShowBulkMenu((prev) => !prev);
                                    }}
                                    aria-haspopup="true"
                                    aria-expanded={showBulkMenu}
                                >
                                    <span>{selectedCount} 選択</span>
                                    <ChevronDown size={12} className={`transition-transform ${showBulkMenu ? "rotate-180" : ""}`} />
                                </button>
                        {showBulkMenu && (
                            <div className="absolute right-0 mt-1 w-48 bg-popover text-popover-foreground border border-border rounded-md shadow-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                <div className="flex flex-col gap-0.5">
                                    <button className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-sm text-xs hover:bg-accent hover:text-accent-foreground transition-colors" onClick={bulkComplete}>
                                        <CheckCircle2 size={14} className="opacity-70" />
                                        <span>完了にする</span>
                                    </button>
                                    <button className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-sm text-xs hover:bg-accent hover:text-accent-foreground transition-colors" onClick={bulkMarkIncomplete}>
                                        <Circle size={14} className="opacity-70" />
                                        <span>未完了に戻す</span>
                                    </button>
                                    <button className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-sm text-xs hover:bg-accent hover:text-accent-foreground transition-colors" onClick={bulkArchiveDaily}>
                                        <Archive size={14} className="opacity-70" />
                                        <span>アーカイブ (毎日)</span>
                                    </button>
                                    {!enableArchiveActions && (
                                        <>
                                            <div className="h-px bg-border/50 my-1" />
                                            <button className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-sm text-xs text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={bulkDelete}>
                                                <Trash2 size={14} className="opacity-70" />
                                                <span>削除</span>
                                            </button>
                                        </>
                                    )}
                                    {enableArchiveActions && (
                                        <>
                                            <div className="h-px bg-border/50 my-1" />
                                            <button className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-sm text-xs hover:bg-accent hover:text-accent-foreground transition-colors" onClick={() => {
                                                const ids = filteredSorted.filter((t) => selected[t.id]).map((t) => t.id);
                                                if (ids.length > 0 && onBulkRestore) {
                                                    onBulkRestore(ids);
                                                    setSelected({});
                                                }
                                            }}>
                                                <RotateCcw size={14} className="opacity-70" />
                                                <span>復元</span>
                                            </button>
                                            <button className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-sm text-xs text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => {
                                                const ids = filteredSorted.filter((t) => selected[t.id]).map((t) => t.id);
                                                if (ids.length > 0 && onBulkPermanentDelete) {
                                                    onBulkPermanentDelete(ids);
                                                    setSelected({});
                                                }
                                            }}>
                                                <Trash2 size={14} className="opacity-70" />
                                                <span>完全削除</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                                {enableBulkDueUpdate && (
                                    <>
                                        <div className="h-px bg-border/50 my-1" />
                                        <div className="px-2 py-1">
                                            <div className="text-xxs font-medium mb-1.5">日付変更</div>
                                            <button className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-sm text-xs hover:bg-accent hover:text-accent-foreground transition-colors mb-1" onClick={bulkPostponeToTomorrow}>
                                                <ArrowRight size={14} className="opacity-70" />
                                                <span>明日に繰り越し</span>
                                            </button>
                                            <div className="flex items-center gap-1 mt-1">
                                                <div className="relative flex-1">
                                                    <Calendar size={12} className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50" />
                                                    <input
                                                        type="date"
                                                        className="w-full border-none bg-accent/50 rounded px-2 pl-6 py-1 text-xxs focus:ring-1 focus:ring-primary"
                                                        value={bulkDateInput}
                                                        onChange={(e) => setBulkDateInput(e.target.value)}
                                                    />
                                                </div>
                                                <button className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 transition-colors" onClick={bulkUpdateDueDate}>
                                                    適用
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {!isCollapsed && (
                <div className="overflow-x-auto pb-2">
                    <div className="min-w-[600px]">
                        {/* Header */}
                        <div className="flex items-center text-xs font-medium border-b border-border/60 py-2 px-2 text-foreground/60">
                            <div className="w-[24px] flex-shrink-0"></div> {/* Grip placeholder */}
                            {enableSelection && selectionModeActive && (
                                <div className="w-[24px] flex-shrink-0 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => onSelectAll(!allChecked)}
                                        className={`w-4 h-4 rounded-[4px] border transition-all flex items-center justify-center ${allChecked
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "border-muted-foreground/30 hover:border-primary/60 bg-transparent"
                                            }`}
                                    >
                                        {allChecked && <CheckCircle2 size={10} strokeWidth={3} />}
                                    </button>
                                </div>
                            )}
                            <button type="button" onClick={() => handleSort("title")} className="flex-1 px-2 flex items-center gap-1.5 hover:text-foreground cursor-pointer"><Type size={12} className="opacity-60" />タイトル {getSortIcon("title")}</button>
                            {showCreatedColumn && <button type="button" onClick={() => handleSort("createdAt")} className="hidden sm:flex w-[120px] px-2 items-center gap-1.5 hover:text-foreground cursor-pointer"><CalendarPlus size={12} className="opacity-60" />作成日 {getSortIcon("createdAt")}</button>}
                            {showPlannedColumn && <button type="button" onClick={() => handleSort("planned")} className="hidden sm:flex w-[120px] px-2 items-center gap-1.5 hover:text-foreground cursor-pointer"><CalendarCheck size={12} className="opacity-60" />実行日 {getSortIcon("planned")}</button>}
                            {showScheduledColumn && <button type="button" onClick={() => handleSort("scheduled")} className="hidden sm:flex w-[160px] px-2 items-center gap-1.5 hover:text-foreground cursor-pointer"><CalendarRange size={12} className="opacity-60" />設定 {getSortIcon("scheduled")}</button>}
                            {showTypeColumn && <button type="button" onClick={() => handleSort("type")} className="hidden sm:flex w-[128px] px-2 items-center gap-1.5 hover:text-foreground cursor-pointer"><Tag size={12} className="opacity-60" />種別 {getSortIcon("type")}</button>}
                            {showMilestoneColumn && <button type="button" onClick={() => handleSort("milestone")} className="hidden sm:flex w-[160px] px-2 items-center gap-1.5 hover:text-foreground cursor-pointer"><Flag size={12} className="opacity-60" />マイルストーン {getSortIcon("milestone")}</button>}
                            {showArchivedAtColumn && <button type="button" onClick={() => handleSort("archivedAt")} className="hidden sm:flex w-[120px] px-2 items-center gap-1.5 hover:text-foreground cursor-pointer"><Archive size={12} className="opacity-60" />アーカイブ日 {getSortIcon("archivedAt")}</button>}
                        </div>

                        {/* Body */}
                        <div className="relative">
                            {(orderedTasks.length === 0) ? (
                                <div className="py-8 text-center text-sm text-foreground/50">タスクがありません</div>
                            ) : (
                                <Reorder.Group axis="y" values={orderedTasks} onReorder={handleReorder} className="flex flex-col">
                                    {orderedTasks
                                        .filter(t => !t.parentTaskId) // ルートタスクのみ表示
                                        .map((t) => {
                                            const hasSubtasks = (subtaskCounts[t.id] ?? 0) > 0;
                                            const subtasks = hasSubtasks && expandedTasks.has(t.id) ? (subtasksMap[t.id] ?? []) : [];
                                            return (
                                                <div key={t.id}>
                                                    <TaskRow
                                                        task={t}
                                                        onEdit={(task: Task) => openEdit(task)}
                                                        onContext={(e: React.MouseEvent, task: Task) => { e.preventDefault(); e.stopPropagation(); setCtxTask(task); setCtxPos({ x: e.clientX, y: e.clientY }); }}
                                                        onDelete={handleDeleteTask}
                                                        enableSelection={enableSelection}
                                                        selectionModeActive={selectionModeActive}
                                                        selected={selected[t.id]}
                                                        onSelectOne={(id: string, checked: boolean) => onSelectOne(id, checked)}
                                                        showCreatedColumn={showCreatedColumn}
                                                        showPlannedColumn={showPlannedColumn}
                                                        showScheduledColumn={showScheduledColumn}
                                                        showTypeColumn={showTypeColumn}
                                                        showMilestoneColumn={showMilestoneColumn}
                                                        showArchivedAtColumn={showArchivedAtColumn}
                                                        editingPlannedTaskId={editingPlannedTaskId}
                                                        tempPlannedDate={tempPlannedDate}
                                                        setTempPlannedDate={setTempPlannedDate}
                                                        savePlannedDate={savePlannedDate}
                                                        cancelEditPlannedDate={cancelEditPlannedDate}
                                                        startEditPlannedDate={startEditPlannedDate}
                                                        hasSubtasks={hasSubtasks}
                                                        subtaskCount={subtaskCounts[t.id]}
                                                        isExpanded={expandedTasks.has(t.id)}
                                                        onToggleExpand={() => toggleExpand(t.id)}
                                                        onParentDragStart={handleParentDragStart}
                                                        onParentDragEnd={handleParentDragEnd}
                                                        onParentDrop={handleParentDrop}
                                                        draggingTaskId={draggingTaskId}
                                                        dragOverTaskId={dragOverTaskId}
                                                        onDragOverTask={handleDragOverTask}
                                                    />
                                                    {/* サブタスク表示 */}
                                                    {subtasks.map((st) => (
                                                        <TaskRow
                                                            key={st.id}
                                                            task={st}
                                                            onEdit={(task: Task) => openEdit(task)}
                                                            onContext={(e: React.MouseEvent, task: Task) => { e.preventDefault(); e.stopPropagation(); setCtxTask(task); setCtxPos({ x: e.clientX, y: e.clientY }); }}
                                                            onDelete={handleDeleteTask}
                                                            enableSelection={enableSelection}
                                                            selectionModeActive={selectionModeActive}
                                                            selected={selected[st.id]}
                                                            onSelectOne={(id: string, checked: boolean) => onSelectOne(id, checked)}
                                                            showCreatedColumn={showCreatedColumn}
                                                            showPlannedColumn={showPlannedColumn}
                                                            showScheduledColumn={showScheduledColumn}
                                                            showTypeColumn={showTypeColumn}
                                                            showMilestoneColumn={showMilestoneColumn}
                                                            showArchivedAtColumn={showArchivedAtColumn}
                                                            editingPlannedTaskId={editingPlannedTaskId}
                                                            tempPlannedDate={tempPlannedDate}
                                                            setTempPlannedDate={setTempPlannedDate}
                                                            savePlannedDate={savePlannedDate}
                                                            cancelEditPlannedDate={cancelEditPlannedDate}
                                                            startEditPlannedDate={startEditPlannedDate}
                                                            isSubtask={true}
                                                            draggingTaskId={draggingTaskId}
                                                            dragOverTaskId={dragOverTaskId}
                                                        />
                                                    ))}
                                                </div>
                                            );
                                        })}
                                </Reorder.Group>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {editingTask && (
                <TaskDialog open title="タスク詳細" onBeforeClose={() => { formRef.current?.save(); }} onClose={() => { closeEdit(); }}>
                    <TaskForm
                        ref={formRef}
                        task={editingTask}
                        onCancel={() => { formRef.current?.save(); closeEdit(); }}
                        onSubmitted={() => { closeEdit(); }}
                    />
                </TaskDialog>
            )}

            {/* Context Menu */}
            {ctxTask && ctxPos && (
                <div
                    ref={ctxMenuRef}
                    className="fixed z-50 bg-popover text-popover-foreground border border-border rounded-md shadow-lg p-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: ctxPos.y, left: ctxPos.x }}
                >
                    <div className="flex flex-col gap-0.5">
                        {globalActiveTaskIds.includes(ctxTask.id) ? (
                            <button
                                className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-sm text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                                onClick={() => { removeActiveTask(ctxTask.id); setCtxTask(null); }}
                            >
                                <Pause size={14} className="opacity-70" />
                                <span>着手中から外す</span>
                            </button>
                        ) : (
                            <button
                                className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-sm text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                                onClick={() => { addActiveTask(ctxTask.id); setCtxTask(null); }}
                            >
                                <Play size={14} className="opacity-70" />
                                <span>着手中に追加</span>
                            </button>
                        )}
                        <div className="h-px bg-border/50 my-1" />
                        <button
                            className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-sm text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => {
                                useAppStore.getState().duplicateTask(ctxTask.id);
                                toast.show('タスクを複製しました', 'success');
                                setCtxTask(null);
                            }}
                        >
                            <Copy size={14} className="opacity-70" />
                            <span>複製</span>
                        </button>
                        <button
                            className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-sm text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => { openEdit(ctxTask); setCtxTask(null); }}
                        >
                            <Edit size={14} className="opacity-70" />
                            <span>編集</span>
                        </button>
                        <div className="h-px bg-border/50 my-1" />
                        <button
                            className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-sm text-xs text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={async () => {
                                const ok = await confirm(`「${ctxTask.title}」を削除しますか？`, { tone: 'danger', confirmText: '削除' });
                                if (ok) {
                                    await handleDeleteTask(ctxTask);
                                }
                                setCtxTask(null);
                            }}
                        >
                            <Trash2 size={14} className="opacity-70" />
                            <span>削除</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
