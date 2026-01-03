import { Reorder, useDragControls, useMotionValue, useTransform, motion } from "framer-motion";
import { GripVertical, CheckCircle2, Trash2, Check, ChevronRight, ChevronDown } from "lucide-react";
import { Task } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { useToast } from "@/components/Providers";
import { TypeBadge } from "./TypeBadge";

// 文字列を20字で省略するユーティリティ関数
function truncateText(text: string | null | undefined, maxLength: number = 20): string {
    if (!text) return "";
    // Strip HTML tags
    const stripped = text.replace(/<[^>]*>?/gm, '');
    if (stripped.length <= maxLength) return stripped;
    return stripped.slice(0, maxLength) + "...";
}

interface TaskRowProps {
    task: Task;
    onEdit: (task: Task) => void;
    onContext: (e: React.MouseEvent, task: Task) => void;
    onDelete: (task: Task) => void;
    enableSelection?: boolean;
    selectionModeActive?: boolean;
    selected?: boolean;
    onSelectOne: (id: string, checked: boolean) => void;
    showCreatedColumn?: boolean;
    showPlannedColumn?: boolean;
    showScheduledColumn?: boolean;
    showTypeColumn?: boolean;
    showMilestoneColumn?: boolean;
    showArchivedAtColumn?: boolean;
    editingPlannedTaskId: string | null;
    tempPlannedDate: string;
    setTempPlannedDate: (date: string) => void;
    savePlannedDate: (taskId: string) => void;
    cancelEditPlannedDate: () => void;
    startEditPlannedDate: (task: Task) => void;
    // サブタスク対応
    hasSubtasks?: boolean;
    subtaskCount?: number;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
    isSubtask?: boolean;
}

export function TaskRow({ task, onEdit, onContext, onDelete, enableSelection, selectionModeActive, selected, onSelectOne, showCreatedColumn, showPlannedColumn, showScheduledColumn, showTypeColumn, showMilestoneColumn, showArchivedAtColumn, editingPlannedTaskId, tempPlannedDate, setTempPlannedDate, savePlannedDate, cancelEditPlannedDate, startEditPlannedDate, hasSubtasks, subtaskCount, isExpanded, onToggleExpand, isSubtask }: TaskRowProps) {
    const toggle = useAppStore((s) => s.toggleTask);
    const toggleDailyToday = useAppStore((s) => s.toggleDailyDoneForToday);
    const activeTaskIds = useAppStore((s) => s.pomodoro.activeTaskIds);
    const toast = useToast();

    const milestones = useAppStore((s) => s.milestones);
    const taskMilestones = (task.milestoneIds ?? [])
        .map(id => milestones.find(m => m.id === id))
        .filter((m): m is typeof milestones[number] => m !== undefined);
    const dowShort = ["日", "月", "火", "水", "木", "金", "土"] as const;
    const scheduledDaysLabel = task.type === "scheduled" && (task.scheduled?.daysOfWeek?.length ?? 0) > 0
        ? task.scheduled!.daysOfWeek.map((d: number) => dowShort[d]).join("・")
        : undefined;
    const isDailyDoneToday = (() => {
        if (task.type !== "daily") return false;
        const d = new Date();
        d.setUTCHours(0, 0, 0, 0);
        const today = d.getTime();
        return (task.dailyDoneDates ?? []).includes(today);
    })();
    const isPlannedToday = (() => {
        if (task.type !== "backlog") return false;
        const d = new Date();
        const todayUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
        return (task.plannedDates ?? []).includes(todayUtc);
    })();

    const planned = task.type === "backlog" ? (task.plannedDates ?? []).slice().sort((a: number, b: number) => a - b) : [];
    const scheduledDays = task.type === "scheduled" ? (task.scheduled?.daysOfWeek ?? []) : [];
    const scheduledRanges = task.type === "scheduled" ? (task.scheduled?.dateRanges ?? []) : [];
    const dow = ["日", "月", "火", "水", "木", "金", "土"];
    const isActive = activeTaskIds.includes(task.id);
    const activeIndex = activeTaskIds.indexOf(task.id);

    const controls = useDragControls();
    const x = useMotionValue(0);
    const opacityRight = useTransform(x, [0, 50], [0, 1]);
    const opacityLeft = useTransform(x, [-50, 0], [1, 0]);

    return (
        <Reorder.Item
            value={task}
            id={task.id}
            className="relative overflow-hidden"
            dragListener={false}
            dragControls={controls}
            initial={false}
            transition={{ duration: 0 }}
        >
            {/* Swipe Background Layer */}
            <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none z-0">
                <motion.div style={{ opacity: opacityRight }} className="flex items-center justify-start w-full h-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Check size={24} className="ml-4" />
                </motion.div>
                <motion.div style={{ opacity: opacityLeft }} className="absolute inset-0 flex items-center justify-end w-full h-full bg-red-500/20 text-red-600 dark:text-red-400">
                    <Trash2 size={24} className="mr-4" />
                </motion.div>
            </div>

            {/* Swipeable Content */}
            <motion.div
                className="relative z-10 bg-background"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                style={{ x }}
                onDragEnd={(_, info) => {
                    const offset = info.offset.x;
                    const threshold = 100;
                    if (offset > threshold) {
                        // Right swipe: Complete/Incomplete
                        if (task.type === "daily") {
                            toggleDailyToday(task.id);
                            toast.show(`「${task.title}」を${isDailyDoneToday ? '未完了' : '完了'}にしました`, 'success');
                        } else {
                            toggle(task.id);
                            toast.show(`「${task.title}」を${task.completed ? '未完了' : '完了'}にしました`, 'success');
                        }
                    } else if (offset < -threshold) {
                        // Left swipe: Delete with Google Calendar sync
                        onDelete(task);
                    }
                }}
            >
                <div
                    className={`flex items-center gap-2 py-2 px-2 min-w-0 transition-colors border-b border-border/40 hover:bg-black/5 dark:hover:bg-white/5 group ${isActive ? "bg-[var(--primary)]/10 dark:bg-[var(--primary)]/20" : ""} ${isSubtask ? "pl-8" : ""}`}
                    onContextMenu={(e) => { e.preventDefault(); onContext(e, task); }}
                >
                    {/* サブタスク展開/折りたたみボタン */}
                    {hasSubtasks ? (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
                            className="flex-shrink-0 w-[24px] flex justify-center items-center text-foreground/50 hover:text-foreground transition-colors"
                        >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                    ) : (
                        <div
                            className="flex-shrink-0 w-[24px] flex justify-center items-center cursor-grab active:cursor-grabbing text-foreground/50 hover:text-foreground transition-colors touch-none select-none"
                            onPointerDown={(e) => controls.start(e)}
                        >
                            <GripVertical size={16} />
                        </div>
                    )}

                    {enableSelection && selectionModeActive && (
                        <div className="flex-shrink-0 w-[24px] flex justify-center">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onSelectOne(task.id, !selected); }}
                                className={`w-4 h-4 rounded-[4px] border transition-all flex items-center justify-center ${selected
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "border-muted-foreground/30 hover:border-primary/60 bg-transparent"
                                    }`}
                            >
                                {selected && <CheckCircle2 size={10} strokeWidth={3} />}
                            </button>
                        </div>
                    )}

                    <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                        <div className="flex-shrink-0">
                            {task.type === "daily" ? (
                                <button
                                    type="button"
                                    onClick={() => { toggleDailyToday(task.id); toast.show(`「${task.title}」を${isDailyDoneToday ? '未完了' : '完了'}にしました`, 'success'); }}
                                    title="今日実行済みにする"
                                    className={`w-5 h-5 rounded-full border transition-all duration-200 flex items-center justify-center hover:scale-105 ${isDailyDoneToday
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-muted-foreground/40 hover:border-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                                        }`}
                                >
                                    {isDailyDoneToday && (
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => { toggle(task.id); toast.show(`「${task.title}」を${task.completed ? '未完了' : '完了'}にしました`, 'success'); }}
                                    title={task.completed ? "完了を解除" : "完了にする"}
                                    className={`w-5 h-5 rounded-full border transition-all duration-200 flex items-center justify-center hover:scale-105 ${task.completed
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-muted-foreground/40 hover:border-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                                        }`}
                                >
                                    {task.completed && (
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            )}
                        </div>

                        <button
                            className={`text-left flex-1 min-w-0 ${task.completed ? "line-through opacity-60" : ""}`}
                            onClick={() => onEdit(task)}
                            title={task.title}
                        >
                            <div className="text-sm font-medium truncate flex items-center gap-2">
                                <span className="sm:hidden">{truncateText(task.title, 20)}</span>
                                <span className="hidden sm:inline">{task.title}</span>
                                {isActive && (
                                    <span className="inline-flex items-center gap-1.5 text-xxs font-medium border rounded-full px-2 py-0.5 whitespace-nowrap bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30">
                                        着手中 #{activeIndex + 1}
                                    </span>
                                )}
                                {hasSubtasks && subtaskCount !== undefined && subtaskCount > 0 && (
                                    <span className="inline-flex items-center text-xxs font-medium border rounded-full px-2 py-0.5 whitespace-nowrap bg-muted text-muted-foreground border-border">
                                        {subtaskCount}件
                                    </span>
                                )}
                            </div>
                            {task.description && <div className="text-xs opacity-70 truncate"><span className="sm:hidden">{truncateText(task.description, 20)}</span><span className="hidden sm:inline">{truncateText(task.description, 60)}</span></div>}
                        </button>
                    </div>

                    {/* Columns */}
                    {showCreatedColumn && (
                        <div className="hidden sm:block w-[120px] text-xs opacity-80 whitespace-nowrap flex-shrink-0 px-2">
                            {new Date(task.createdAt).toLocaleDateString()}
                        </div>
                    )}
                    {showPlannedColumn && (
                        <div className="hidden sm:block w-[120px] overflow-hidden flex-shrink-0 px-2">
                            {task.type === 'backlog' ? (
                                editingPlannedTaskId === task.id ? (
                                    <input
                                        type="date"
                                        className="w-full border rounded px-1 py-0.5 text-xxs bg-transparent"
                                        value={tempPlannedDate}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempPlannedDate(e.target.value)}
                                        onBlur={() => savePlannedDate(task.id)}
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                            if (e.key === 'Enter') {
                                                savePlannedDate(task.id);
                                            } else if (e.key === 'Escape') {
                                                cancelEditPlannedDate();
                                            }
                                        }}
                                        autoFocus
                                    />
                                ) : (
                                    <div className="flex items-center gap-1 flex-wrap text-xxs opacity-80">
                                        <button
                                            type="button"
                                            className="border rounded px-1 py-0.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                            onClick={() => startEditPlannedDate(task)}
                                        >
                                            {planned.length > 0 ? new Date(planned[0]).toLocaleDateString() : '日付を設定'}
                                        </button>
                                    </div>
                                )
                            ) : (
                                <div className="flex items-center gap-1 flex-wrap text-[10px] opacity-80">
                                    <span className="opacity-40">-</span>
                                </div>
                            )}
                        </div>
                    )}
                    {showScheduledColumn && (
                        <div className="hidden sm:block w-[160px] overflow-hidden flex-shrink-0 px-2">
                            <div className="flex items-center gap-1 flex-wrap text-[10px] opacity-80">
                                {scheduledDays.length > 0 && (
                                    <span className="border rounded px-1 py-0.5">{scheduledDays.map((d: number) => dow[d]).join("・")}</span>
                                )}
                                {scheduledRanges.length > 0 ? (
                                    scheduledRanges.map((r: { start: number, end: number }, idx: number) => (
                                        <span key={`${r.start}-${r.end}-${idx}`} className="border rounded px-1 py-0.5">
                                            {new Date(r.start).toLocaleDateString()}〜{new Date(r.end).toLocaleDateString()}
                                        </span>
                                    ))
                                ) : scheduledDays.length === 0 ? (
                                    <span className="text-amber-600 dark:text-amber-400 font-medium">曜日未指定</span>
                                ) : null}
                            </div>
                        </div>
                    )}
                    {showTypeColumn && (
                        <div className="hidden sm:block w-[128px] whitespace-nowrap flex-shrink-0 px-2">
                            <TypeBadge
                                type={task.type}
                                label={
                                    task.type === "daily"
                                        ? "毎日"
                                        : task.type === "scheduled"
                                            ? (scheduledDaysLabel ? `特定曜日（${scheduledDaysLabel}）` : "特定曜日")
                                            : "積み上げ候補"
                                }
                            />
                        </div>
                    )}
                    {showMilestoneColumn && (
                        <div className="hidden sm:block w-[160px] text-xs opacity-80 truncate flex-shrink-0 px-2" title={taskMilestones.map(m => m.title).join(", ")}>
                            {taskMilestones.length > 0
                                ? (taskMilestones.length === 1 ? truncateText(taskMilestones[0].title, 20) : `${taskMilestones.length}件`)
                                : <span className="opacity-40">-</span>}
                        </div>
                    )}
                    {showArchivedAtColumn && (
                        <div className="hidden sm:block w-[120px] text-xs opacity-80 whitespace-nowrap flex-shrink-0 px-2">
                            {task.archivedAt ? new Date(task.archivedAt).toLocaleDateString() : <span className="opacity-40">-</span>}
                        </div>
                    )}

                </div>
            </motion.div>
        </Reorder.Item>
    );
}
