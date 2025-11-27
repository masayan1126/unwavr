"use client";
import { useAppStore } from "@/lib/store";
import { getTodayDateInput, getTomorrowDateInput } from "@/lib/taskUtils";
import { Task } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { useConfirm } from "@/components/Providers";
import { CalendarDays, ListTodo, Archive, Loader2, X, Mic, Circle, CircleDot, ChevronDown, CheckCircle2, Trash2, ArrowRight, Calendar, Copy, Edit, Play, Pause } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import WysiwygEditor from "@/components/WysiwygEditor";
import TaskDialog from "@/components/TaskCreateDialog";
import { useToast } from "@/components/Providers";
import TaskForm, { type TaskFormHandle } from "@/components/TaskForm";

// 文字列を20字で省略するユーティリティ関数
function truncateText(text: string, maxLength: number = 20): string {
  // Strip HTML tags
  const stripped = text.replace(/<[^>]*>?/gm, '');
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength) + "...";
}

function TypeBadge({ type, label }: { type: "daily" | "scheduled" | "backlog"; label?: string }) {
  const map = {
    daily: { label: "毎日", classes: "bg-[var(--tag-daily)] text-foreground", Icon: ListTodo },
    scheduled: { label: "特定曜日", classes: "bg-[var(--tag-scheduled)] text-foreground", Icon: CalendarDays },
    backlog: { label: "積み上げ候補", classes: "bg-[var(--tag-backlog)] text-foreground", Icon: Archive },
  } as const;
  const info = map[type];
  const Icon = info.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xxs font-medium rounded px-1.5 py-0.5 whitespace-nowrap ${info.classes}`}>
      <Icon size={12} className="shrink-0 opacity-70" />
      {label ?? info.label}
    </span>
  );
}

import { Reorder } from "framer-motion";
import { GripVertical } from "lucide-react";

function TaskRow({ task, onEdit, onContext, enableSelection, selected, onSelectOne, showCreatedColumn, showPlannedColumn, showScheduledColumn, showTypeColumn, showMilestoneColumn, editingPlannedTaskId, tempPlannedDate, setTempPlannedDate, savePlannedDate, cancelEditPlannedDate, startEditPlannedDate }: any) {
  const toggle = useAppStore((s) => s.toggleTask);
  const toggleDailyToday = useAppStore((s) => s.toggleDailyDoneForToday);
  const activeTaskIds = useAppStore((s) => s.pomodoro.activeTaskIds);
  const toast = useToast();

  const milestones = useAppStore((s) => s.milestones);
  const milestone = task.milestoneId ? milestones.find((m) => m.id === task.milestoneId) : undefined;
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

  return (
    <Reorder.Item value={task} id={task.id} className="relative">
      <div
        className={`flex items-center gap-2 py-2 px-2 min-w-0 transition-colors border-b border-border/40 hover:bg-black/5 dark:hover:bg-white/5 group ${isActive ? "bg-[var(--primary)]/10 dark:bg-[var(--primary)]/20" : ""
          }`}
        onContextMenu={(e) => { e.preventDefault(); onContext(e, task); }}
      >
        <div className="cursor-grab active:cursor-grabbing p-1 opacity-0 group-hover:opacity-30 hover:!opacity-100 transition-opacity absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full">
          <GripVertical size={14} />
        </div>

        {enableSelection && (
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
              {truncateText(task.title, 20)}
              {isActive && (
                <span className="inline-flex items-center gap-1.5 text-xxs font-medium border rounded-full px-2 py-0.5 whitespace-nowrap bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30">
                  着手中 #{activeIndex + 1}
                </span>
              )}
            </div>
            {task.description && <div className="text-xs opacity-70 truncate">{truncateText(task.description, 20)}</div>}
          </button>
        </div>

        {/* Columns */}
        {showCreatedColumn && (
          <div className="w-[120px] text-xs opacity-80 whitespace-nowrap flex-shrink-0 px-2">
            {new Date(task.createdAt).toLocaleDateString()}
          </div>
        )}
        {showPlannedColumn && (
          <div className="w-[120px] overflow-hidden flex-shrink-0 px-2">
            {task.type === 'backlog' ? (
              editingPlannedTaskId === task.id ? (
                <input
                  type="date"
                  className="w-full border rounded px-1 py-0.5 text-xxs bg-transparent"
                  value={tempPlannedDate}
                  onChange={(e: any) => setTempPlannedDate(e.target.value)}
                  onBlur={() => savePlannedDate(task.id)}
                  onKeyDown={(e: any) => {
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
          <div className="w-[160px] overflow-hidden flex-shrink-0 px-2">
            <div className="flex items-center gap-1 flex-wrap text-[10px] opacity-80">
              {scheduledDays.length > 0 && (
                <span className="border rounded px-1 py-0.5">{scheduledDays.map((d: number) => dow[d]).join("・")}</span>
              )}
              {scheduledRanges.length > 0 ? (
                scheduledRanges.map((r: any, idx: number) => (
                  <span key={`${r.start}-${r.end}-${idx}`} className="border rounded px-1 py-0.5">
                    {new Date(r.start).toLocaleDateString()}〜{new Date(r.end).toLocaleDateString()}
                  </span>
                ))
              ) : scheduledDays.length === 0 ? (
                <span className="opacity-40">-</span>
              ) : null}
            </div>
          </div>
        )}
        {showTypeColumn && (
          <div className="w-[128px] whitespace-nowrap flex-shrink-0 px-2">
            <TypeBadge
              type={task.type}
              label={
                task.type === "daily"
                  ? "毎日"
                  : task.type === "scheduled"
                    ? (scheduledDaysLabel ? `特定曜日（${scheduledDaysLabel}）` : "特定曜日")
                    : isPlannedToday
                      ? "今日やる"
                      : "積み上げ候補"
              }
            />
          </div>
        )}
        {showMilestoneColumn && (
          <div className="w-[160px] text-xs opacity-80 truncate flex-shrink-0 px-2" title={milestone?.title}>
            {milestone ? truncateText(milestone.title, 20) : <span className="opacity-40">-</span>}
          </div>
        )}

        <div className="flex items-center gap-2 flex-shrink-0 w-[80px] justify-end px-2">
          {task.estimatedPomodoros != null && (
            <div className="text-xs opacity-70">
              {task.completedPomodoros ?? 0}/{task.estimatedPomodoros}
            </div>
          )}
        </div>
      </div>
    </Reorder.Item>
  );
}

export default function TaskList({
  title,
  tasks,
  showType = false,
  showPlannedDates = false,
  showCreatedColumn = false,
  tableMode = false,
  showPlannedColumn = true,
  showScheduledColumn = false,
  showTypeColumn = true,
  showMilestoneColumn = false,
  // 拡張: 共通の列ソート/フィルター
  sortKey,
  sortAsc,
  filterType = "all",
  filterStatus = "all",
  enableSelection = false,
  enableBulkDueUpdate = false,
}: {
  title: string;
  tasks: Task[];
  showType?: boolean;
  showPlannedDates?: boolean;
  showCreatedColumn?: boolean;
  tableMode?: boolean;
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
  const globalActiveTaskId = useAppStore((s) => s.pomodoro.activeTaskId);
  const globalActiveTaskIds = useAppStore((s) => s.pomodoro.activeTaskIds);
  const addActiveTask = useAppStore((s) => s.addActiveTask);
  const removeActiveTask = useAppStore((s) => s.removeActiveTask);
  const milestones = useAppStore((s) => s.milestones);
  const toggleCompleted = useAppStore((s) => s.toggleTask);
  const toggleDailyToday = useAppStore((s) => s.toggleDailyDoneForToday);
  const milestoneOptions = useMemo(() => milestones.map((m) => ({ id: m.id, title: m.title })), [milestones]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const storeTasks = useAppStore((s) => s.tasks);
  const editingTask = useMemo(() => storeTasks.find((t) => t.id === editingId), [editingId, storeTasks]);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<"daily" | "scheduled" | "backlog">("backlog");
  const [formEst, setFormEst] = useState<number>(0);
  const [formMilestoneId, setFormMilestoneId] = useState<string>("");
  const [formPlannedDateInput, setFormPlannedDateInput] = useState<string>("");
  const [formPlannedDate, setFormPlannedDate] = useState<number | null>(null);
  const [formScheduledDays, setFormScheduledDays] = useState<number[]>([]);
  const [formScheduledRanges, setFormScheduledRanges] = useState<{ start: number, end: number }[]>([]);
  const [listening, setListening] = useState(false);
  const { toggle: toggleSpeech } = useSpeechRecognition({
    onResult: (txt) => setFormTitle((prev) => (prev ? prev + " " + txt : txt)),
    lang: "ja-JP",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const scheduleSave = (delay: number = 500) => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => saveEdit(true), delay);
  };
  const [showDescOverlay, setShowDescOverlay] = useState(false);
  const [ctxTask, setCtxTask] = useState<Task | null>(null);
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number } | null>(null);
  const ctxMenuRef = useRef<HTMLDivElement | null>(null);
  const [editingPlannedTaskId, setEditingPlannedTaskId] = useState<string | null>(null);
  const [tempPlannedDate, setTempPlannedDate] = useState<string>("");
  const formRef = useRef<TaskFormHandle | null>(null);
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

  useEffect(() => {
    // 音声認識セットアップは hook に委譲
  }, [editingTask]);

  // 表示カラムに合わせたグリッドはテーブルレイアウトを使用しているため未使用の計算を削除

  function openEdit(t: Task) {
    const latest = useAppStore.getState().tasks.find((x) => x.id === t.id) ?? t;
    setEditingId(latest.id);
    setFormTitle(latest.title);
    setFormDescription(latest.description ?? "");
    setFormType(latest.type);
    setFormEst(latest.estimatedPomodoros ?? 0);
    setFormMilestoneId(latest.milestoneId ?? "");
    const firstPlanned = (latest.plannedDates ?? [])[0];
    if (firstPlanned != null) {
      const d = new Date(firstPlanned);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setFormPlannedDateInput(`${y}-${m}-${dd}`);
      setFormPlannedDate(firstPlanned);
    } else {
      setFormPlannedDateInput("");
      setFormPlannedDate(null);
    }
    setFormScheduledDays(t.scheduled?.daysOfWeek ?? []);
    setFormScheduledRanges(t.scheduled?.dateRanges ?? []);
  }

  function closeEdit() {
    setEditingId(null);
  }

  function saveEdit(keepOpen?: boolean) {
    if (!editingId) return;
    setIsSaving(true);
    // 入力中の日付がボタン未押下でも保存時に取り込む
    // 単一の実行日として保存（上書き）
    let selectedPlanned: number | null = formPlannedDate;
    if (formType === "backlog" && formPlannedDateInput) {
      const dt = new Date(formPlannedDateInput);
      if (!isNaN(dt.getTime())) {
        selectedPlanned = Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
      }
    }

    const baseUpdate: Partial<Task> = {
      title: formTitle.trim() || "(無題)",
      description: formDescription.trim() || undefined,
      type: formType,
      estimatedPomodoros: Number.isFinite(formEst) ? formEst : 0,
      milestoneId: formMilestoneId || undefined,
    };

    // タスクタイプに応じてデータを設定
    if (formType === "backlog") {
      baseUpdate.plannedDates = selectedPlanned != null ? [selectedPlanned] : [];
      baseUpdate.scheduled = undefined;
    } else if (formType === "scheduled") {
      baseUpdate.scheduled = {
        daysOfWeek: formScheduledDays,
        dateRanges: formScheduledRanges
      };
      baseUpdate.plannedDates = undefined;
    } else {
      // daily
      baseUpdate.plannedDates = undefined;
      baseUpdate.scheduled = undefined;
    }

    updateTask(editingId, baseUpdate);
    setLastSavedAt(Date.now());
    setTimeout(() => setIsSaving(false), 150);
    if (!keepOpen) closeEdit();
  }

  function isDailyDoneToday(dates?: number[]): boolean {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    const today = d.getTime();
    const utc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return Boolean(dates && (dates.includes(today) || dates.includes(utc)));
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

  // Reorder state
  const [orderedTasks, setOrderedTasks] = useState<Task[]>([]);
  useEffect(() => {
    // Sort by order field if no explicit sort key
    if (!sortKey) {
      const sorted = [...filteredSorted].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setOrderedTasks(sorted);
    } else {
      setOrderedTasks(filteredSorted);
    }
  }, [filteredSorted, sortKey]);

  const handleReorder = (newOrder: Task[]) => {
    if (sortKey) return; // Disable reorder when sorting is active
    setOrderedTasks(newOrder);

    // Update order for all affected tasks
    // Simple approach: re-assign order based on index
    // Optimization: only update if changed?
    // For now, let's just update locally and trigger store updates for changed items
    // But store update is async.
    // Let's just update the order field for each item to match its index
    // To avoid too many writes, we can debounce or just update the moved item?
    // Reorder.Group gives us the new array. We should persist this order.

    newOrder.forEach((t, idx) => {
      if (t.order !== idx) {
        // We need a way to batch update or just update.
        // For now, let's update individually.
        // Note: This might be heavy if list is long.
        // Ideally we should have a bulk update API.
        // But for MVP, let's just update the dropped item? 
        // No, Framer Motion reorders the whole array.
        // Let's update all.
        if (t.order !== idx) {
          updateTaskOrder(t.id, idx);
        }
      }
    });
  };

  // selection state derived helpers
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

  // 一括操作
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

    // 変更がない場合は更新しない
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
        <div className="overflow-x-auto">
          <div className="min-w-full">
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
                const copyId = useAppStore.getState().duplicateTask(ctxTask.id);
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
