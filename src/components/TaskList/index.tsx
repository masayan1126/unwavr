import { useState, useEffect, useRef, useMemo } from "react";
import { Reorder } from "framer-motion";
import { ChevronDown, CheckCircle2, Circle, Archive, Trash2, ArrowRight, Calendar, Copy, Edit, Play, Pause } from "lucide-react";
import { Task } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { useConfirm, useToast } from "@/components/Providers";
import TaskDialog from "@/components/TaskCreateDialog";
import TaskForm, { type TaskFormHandle } from "@/components/TaskForm";
import { getTodayDateInput, getTomorrowDateInput } from "@/lib/taskUtils";
import { TaskRow } from "./TaskRow";
import { useTaskSortFilter } from "./useTaskSortFilter";

export default function TaskList({
    title,
    tasks,
    showCreatedColumn = false,
    showPlannedColumn = true,
    showScheduledColumn = false,
    showTypeColumn = true,
    showMilestoneColumn = false,
    sortKey,
    sortAsc,
    filterType = "all",
    filterStatus = "all",
    enableSelection = false,
    enableBulkDueUpdate = false,
}: {
    title: string;
    tasks: Task[];
    showCreatedColumn?: boolean;
    showPlannedColumn?: boolean;
    showScheduledColumn?: boolean;
    showTypeColumn?: boolean;
    showMilestoneColumn?: boolean;
    sortKey?: "title" | "createdAt" | "planned" | "scheduled" | "type" | "milestone";
    sortAsc?: boolean;
    filterType?: "all" | "daily" | "backlog" | "scheduled";
    filterStatus?: "all" | "completed" | "incomplete";
    enableSelection?: boolean;
    enableBulkDueUpdate?: boolean;
}) {
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

    const { orderedTasks, setOrderedTasks, filteredSorted } = useTaskSortFilter({
        tasks,
        milestones,
        sortKey,
        sortAsc,
        filterType,
        filterStatus,
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
    const onSelectAll = (checked: boolean) => {
        if (!enableSelection) return;
        setSelected(Object.fromEntries(filteredSorted.map((t) => [t.id, checked])));
    };
    const onSelectOne = (id: string, checked: boolean) => setSelected((s) => ({ ...s, [id]: checked }));

    const handleReorder = (newOrder: Task[]) => {
        if (sortKey) return;
        setOrderedTasks(newOrder);
        newOrder.forEach((t, idx) => {
            if (t.order !== idx) {
                updateTaskOrder(t.id, idx);
            }
        });
    };

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
        const ids = filteredSorted.filter((t) => selected[t.id]).map((t) => t.id);
        if (!ids.length) return;
        const ok = await confirm(`${ids.length}件を削除しますか？この操作は取り消せません。`, { tone: 'danger', confirmText: '削除' });
        if (!ok) return;
        for (const id of ids) removeTask(id);
        setSelected({});
        toast.show(`${ids.length}件を削除しました`, "success");
    }

    async function bulkUpdateDueDate() {
        if (!enableBulkDueUpdate) return;
        const ids = filteredSorted.filter((t) => selected[t.id]).map((t) => t.id);
        if (!ids.length) return;
        if (!bulkDateInput) return;
        const dt = new Date(bulkDateInput);
        if (isNaN(dt.getTime())) return;
        const stamp = Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
        for (const t of filteredSorted) {
            if (!selected[t.id]) continue;
            if (t.type === 'backlog') {
                updateTask(t.id, { plannedDates: [stamp] });
            }
        }
        setSelected({});
        toast.show(`${ids.length}件の実行日を更新しました`, "success");
    }

    async function bulkPostponeToTomorrow() {
        if (!enableBulkDueUpdate) return;
        const ids = filteredSorted.filter((t) => selected[t.id] && t.type === 'backlog').map((t) => t.id);
        if (!ids.length) return;
        const tomorrowInput = getTomorrowDateInput();
        const dt = new Date(tomorrowInput);
        const stamp = Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
        for (const t of filteredSorted) {
            if (!selected[t.id]) continue;
            if (t.type === 'backlog') {
                updateTask(t.id, { plannedDates: [stamp] });
            }
        }
        setSelected({});
        toast.show(`${ids.length}件を明日に繰り越しました`, "success");
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

    function savePlannedDate(taskId: string) {
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

        updateTask(taskId, { plannedDates: [stamp] });
        toast.show('実行日を更新しました', 'success');
        setEditingPlannedTaskId(null);
        setTempPlannedDate("");
    }

    function cancelEditPlannedDate() {
        setEditingPlannedTaskId(null);
        setTempPlannedDate("");
    }

    return (
        <div className="rounded-md">
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex items-center gap-2 text-xs uppercase tracking-wide opacity-70 hover:opacity-100 transition-opacity"
                >
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
                    {title}
                </button>
                {enableSelection && !isCollapsed && (
                    <div ref={bulkMenuRef} className="relative">
                        <button
                            type="button"
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[3px] text-xs font-medium transition-colors ${selectedCount > 0
                                ? "text-primary bg-primary/10 hover:bg-primary/20"
                                : "text-muted-foreground opacity-50 cursor-not-allowed"
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
                                    <div className="h-px bg-border/50 my-1" />
                                    <button className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-sm text-xs text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={bulkDelete}>
                                        <Trash2 size={14} className="opacity-70" />
                                        <span>削除</span>
                                    </button>
                                </div>
                                {enableBulkDueUpdate && (
                                    <>
                                        <div className="h-px bg-border/50 my-1" />
                                        <div className="px-2 py-1">
                                            <div className="text-xxs font-medium text-muted-foreground mb-1.5">日付変更</div>
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

            {!isCollapsed && (
                <div className="overflow-x-auto pb-2">
                    <div className="min-w-[600px]">
                        {/* Header */}
                        <div className="flex items-center text-xs font-medium text-muted-foreground border-b border-border/50 py-2 px-2">
                            <div className="w-[24px] flex-shrink-0"></div> {/* Grip placeholder */}
                            {enableSelection && (
                                <div className="w-[24px] flex-shrink-0 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => onSelectAll(!allChecked)}
                                        className={`w-4 h-4 rounded-[4px] border transition-all flex items-center justify-center ${allChecked
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "border-muted-foreground/40 hover:border-primary/60 bg-transparent"
                                            }`}
                                    >
                                        {allChecked && <CheckCircle2 size={10} strokeWidth={3} />}
                                    </button>
                                </div>
                            )}
                            <div className="flex-1 px-2">タイトル</div>
                            {showCreatedColumn && <div className="w-[120px] px-2">作成日</div>}
                            {showPlannedColumn && <div className="w-[120px] px-2">実行日</div>}
                            {showScheduledColumn && <div className="w-[160px] px-2">設定（曜日/期間）</div>}
                            {showTypeColumn && <div className="w-[128px] px-2">種別</div>}
                            {showMilestoneColumn && <div className="w-[160px] px-2">マイルストーン</div>}
                            <div className="w-[80px] px-2 text-right">Pomodoro</div>
                        </div>

                        {/* Body */}
                        <div className="relative">
                            {(orderedTasks.length === 0) ? (
                                <div className="px-2 py-4 text-sm opacity-60 text-center">タスクなし</div>
                            ) : (
                                <Reorder.Group axis="y" values={orderedTasks} onReorder={handleReorder} className="flex flex-col">
                                    {orderedTasks.map((t) => (
                                        <TaskRow
                                            key={t.id}
                                            task={t}
                                            onEdit={(task: Task) => openEdit(task)}
                                            onContext={(e: React.MouseEvent, task: Task) => { e.preventDefault(); e.stopPropagation(); setCtxTask(task); setCtxPos({ x: e.clientX, y: e.clientY }); }}
                                            enableSelection={enableSelection}
                                            selected={selected[t.id]}
                                            onSelectOne={(id: string, checked: boolean) => onSelectOne(id, checked)}
                                            showCreatedColumn={showCreatedColumn}
                                            showPlannedColumn={showPlannedColumn}
                                            showScheduledColumn={showScheduledColumn}
                                            showTypeColumn={showTypeColumn}
                                            showMilestoneColumn={showMilestoneColumn}
                                            editingPlannedTaskId={editingPlannedTaskId}
                                            tempPlannedDate={tempPlannedDate}
                                            setTempPlannedDate={setTempPlannedDate}
                                            savePlannedDate={savePlannedDate}
                                            cancelEditPlannedDate={cancelEditPlannedDate}
                                            startEditPlannedDate={startEditPlannedDate}
                                        />
                                    ))}
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
                                    removeTask(ctxTask.id);
                                    toast.show('タスクを削除しました', 'success');
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
