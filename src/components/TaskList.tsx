"use client";
import { useAppStore } from "@/lib/store";
import { Task } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { useConfirm } from "@/components/Providers";
import { CalendarDays, ListTodo, Archive, Loader2, X, Mic } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import WysiwygEditor from "@/components/WysiwygEditor";
import TaskDialog from "@/components/TaskCreateDialog";
import { useToast } from "@/components/Providers";
import TaskForm, { type TaskFormHandle } from "@/components/TaskForm";

// 文字列を20字で省略するユーティリティ関数
function truncateText(text: string, maxLength: number = 20): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

function TypeBadge({ type, label }: { type: "daily" | "scheduled" | "backlog"; label?: string }) {
  const map = {
    // サイドバーと同一のアイコンに統一
    daily: { label: "毎日", classes: "bg-[var(--tag-daily)]/10 text-[var(--tag-daily)] border-[var(--tag-daily)]/30", Icon: ListTodo },
    scheduled: { label: "特定曜日", classes: "bg-[var(--tag-scheduled)]/10 text-[var(--tag-scheduled)] border-[var(--tag-scheduled)]/30", Icon: CalendarDays },
    // 視認性向上＆重複回避のため積み上げ候補はArchiveアイコン
    backlog: { label: "積み上げ候補", classes: "bg-[var(--tag-backlog)]/10 text-[var(--tag-backlog)] border-[var(--tag-backlog)]/30", Icon: Archive },
  } as const;
  const info = map[type];
  const Icon = info.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium border rounded-full px-2 py-0.5 whitespace-nowrap ${info.classes}`}>
      <Icon size={12} className="shrink-0" />
      {label ?? info.label}
    </span>
  );
}

function TaskRow({ task, onEdit, onContext }: { task: Task; onEdit: (task: Task) => void; onContext: (e: React.MouseEvent, task: Task) => void }) {
  const toggle = useAppStore((s) => s.toggleTask);
  const toggleDailyToday = useAppStore((s) => s.toggleDailyDoneForToday);
  const toast = useToast();
  
  const milestones = useAppStore((s) => s.milestones);
  const milestone = task.milestoneId ? milestones.find((m) => m.id === task.milestoneId) : undefined;
  const dowShort = ["日","月","火","水","木","金","土"] as const;
  const scheduledDaysLabel = task.type === "scheduled" && (task.scheduled?.daysOfWeek?.length ?? 0) > 0
    ? task.scheduled!.daysOfWeek.map((d) => dowShort[d]).join("・")
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

  return (
    <div
      className={`flex items-center gap-2 py-1 min-w-0 ${
      task.completed ? "bg-[var(--success)]/10 dark:bg-[var(--success)]/20 rounded" : ""
    }`}
      onContextMenu={(e) => { e.preventDefault(); onContext(e, task); }}
    >
      {task.type === "daily" ? (
        <button
          type="button"
          onClick={() => { toggleDailyToday(task.id); toast.show(`「${task.title}」を${isDailyDoneToday ? '未完了' : '完了'}にしました`, 'success'); }}
          title="今日実行済みにする"
          className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center hover:scale-110 ${
            isDailyDoneToday
              ? "bg-[var(--primary)] border-[var(--primary)] text-white"
              : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-blue-50 dark:hover:border-[var(--primary)] dark:hover:bg-blue-900/20"
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
          className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center hover:scale-110 ${
            task.completed
              ? "bg-[var(--success)] border-[var(--success)] text-white"
              : "border-[var(--border)] hover:border-[var(--success)] hover:bg-[var(--success)]/10 dark:hover:border-[var(--success)] dark:hover:bg-[var(--success)]/20"
          }`}
        >
          {task.completed && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      )}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          className={`text-left flex-1 min-w-0 ${task.completed ? "line-through opacity-60" : ""}`}
          onClick={() => onEdit(task)}
          title={task.title}
        >
          <div className="text-sm font-medium truncate">{truncateText(task.title, 20)}</div>
          {task.description && <div className="text-xs opacity-70 truncate">{truncateText(task.description, 20)}</div>}
        </button>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* 種別バッジ */}
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
        {task.estimatedPomodoros != null && (
          <div className="text-xs opacity-70">
            {task.completedPomodoros ?? 0}/{task.estimatedPomodoros}
          </div>
        )}
        {milestone && (
          <div className="text-[10px] opacity-70 border rounded px-1 py-0.5" title={milestone.title}>
            {truncateText(milestone.title, 20)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TaskList({
  title,
  tasks,
  showType = false,
  showPlannedDates = false,
  tableMode = false,
  showCreatedColumn = true,
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
  tableMode?: boolean;
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
  const removeTask = useAppStore((s) => s.removeTask);
  const toast = useToast();
  const milestones = useAppStore((s) => s.milestones);
  const toggleCompleted = useAppStore((s) => s.toggleTask);
  const toggleDailyToday = useAppStore((s) => s.toggleDailyDoneForToday);
  const milestoneOptions = useMemo(() => milestones.map((m) => ({ id: m.id, title: m.title })), [milestones]);

  const [editingId, setEditingId] = useState<string | null>(null);
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
  const [formScheduledRanges, setFormScheduledRanges] = useState<{start: number, end: number}[]>([]);
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
  const [bulkDateInput, setBulkDateInput] = useState<string>("");
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
        if (sortKey === "createdAt") {
          return dir * ((a.createdAt ?? 0) - (b.createdAt ?? 0));
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

  // selection state derived helpers
  const allChecked = enableSelection && filteredSorted.length > 0 && filteredSorted.every((t) => selected[t.id]);

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

  const tableView = (
    <div className="overflow-x-auto">
      <table className="table-fixed w-full border-separate border-spacing-0">
        <thead>
          <tr className="text-[12px] font-medium opacity-70">
            {enableSelection && (
              <th className="w-[36px] text-left px-2 py-1">
                <input type="checkbox" checked={allChecked} onChange={(e)=>onSelectAll(e.target.checked)} />
              </th>
            )}
            <th className="text-left px-2 py-1">タイトル</th>
            {showCreatedColumn && <th className="text-left px-2 py-1 w-[100px]">日付</th>}
            {showPlannedColumn && <th className="text-left px-2 py-1 w-[120px]">実行日</th>}
            {showScheduledColumn && <th className="text-left px-2 py-1 w-[160px]">設定（曜日/期間）</th>}
            {showTypeColumn && <th className="text-left px-2 py-1 w-[128px]">種別</th>}
            {showMilestoneColumn && <th className="text-left px-2 py-1 w-[160px]">マイルストーン</th>}
          </tr>
        </thead>
        <tbody className="align-top">
          {(filteredSorted.length === 0) ? (
            <tr>
              <td className="px-2 py-2 text-sm opacity-60" colSpan={(enableSelection?1:0) + 1 + Number(showCreatedColumn) + Number(showPlannedColumn) + Number(showScheduledColumn) + Number(showTypeColumn) + Number(showMilestoneColumn)}>タスクなし</td>
            </tr>
          ) : (
            filteredSorted.map((t) => {
              const created = new Date(t.createdAt);
              const planned = t.type === "backlog" ? (t.plannedDates ?? []).slice().sort((a,b)=>a-b) : [];
              const milestone = milestones.find((m) => m.id === t.milestoneId);
              const isDaily = t.type === "daily";
              const isDailyDoneToday = (() => {
                if (!isDaily) return false;
                const d = new Date();
                d.setUTCHours(0,0,0,0);
                const today = d.getTime();
                return (t.dailyDoneDates ?? []).includes(today);
              })();
              const scheduledDays = t.type === "scheduled" ? (t.scheduled?.daysOfWeek ?? []) : [];
              const scheduledRanges = t.type === "scheduled" ? (t.scheduled?.dateRanges ?? []) : [];
              const dow = ["日","月","火","水","木","金","土"];
              return (
                <tr
                  key={t.id}
                  className={`border-t border-black/5 dark:border-white/5 transition-colors ${
                    t.completed ? "bg-[var(--success)]/10 dark:bg-[var(--success)]/20" : ""
                  } hover:bg-black/5 dark:hover:bg-white/5`}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setCtxTask(t); setCtxPos({ x: e.clientX, y: e.clientY }); }}
                >
                  {enableSelection && (
                    <td className="px-2 py-1">
                      <input type="checkbox" checked={!!selected[t.id]} onChange={(e)=>onSelectOne(t.id, e.target.checked)} />
                    </td>
                  )}
                  <td className="px-2 py-1 overflow-hidden">
                    <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                      {isDaily ? (
                        <button
                          type="button"
                          onClick={() => { toggleDailyToday(t.id); toast.show(`「${t.title}」を${isDailyDoneToday ? '未完了' : '完了'}にしました`, 'success'); }}
                          title="今日実行済みにする"
                          className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center hover:scale-110 ${
                            isDailyDoneToday
                              ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                              : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-blue-50 dark:hover:border-[var(--primary)] dark:hover:bg-blue-900/20"
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
                          onClick={() => { toggleCompleted(t.id); toast.show(`「${t.title}」を${t.completed ? '未完了' : '完了'}にしました`, 'success'); }}
                          title={t.completed ? "完了を解除" : "完了にする"}
                          className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center hover:scale-110 ${
                            t.completed
                              ? "bg-[var(--success)] border-[var(--success)] text-white"
                              : "border-[var(--border)] hover:border-[var(--success)] hover:bg-[var(--success)]/10 dark:hover:border-[var(--success)] dark:hover:bg-[var(--success)]/20"
                          }`}
                        >
                          {t.completed && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      )}
                      <button 
                        className={`text-left truncate flex-1 max-w-full ${t.completed ? "line-through opacity-60" : ""}`} 
                        onClick={() => openEdit(t)}
                        title={t.title}
                      >
                        <span className="text-sm font-medium">{truncateText(t.title, 20)}</span>
                      </button>
                    </div>
                  </td>
                  {showCreatedColumn && (
                    <td className="px-2 py-1 w-[100px] text-xs opacity-80 whitespace-nowrap overflow-hidden">{created.toLocaleDateString()}</td>
                  )}
                  {showPlannedColumn && (
                    <td className="px-2 py-1 w-[120px] overflow-hidden">
                      <div className="flex items-center gap-1 flex-wrap text-[10px] opacity-80">
                        {planned.length > 0 ? (
                          <span className="border rounded px-1 py-0.5">{new Date(planned[0]).toLocaleDateString()}</span>
                        ) : (
                          <span className="opacity-40">-</span>
                        )}
                      </div>
                    </td>
                  )}
                  {showScheduledColumn && (
                    <td className="px-2 py-1 w-[160px] overflow-hidden">
                      <div className="flex items-center gap-1 flex-wrap text-[10px] opacity-80">
                        {scheduledDays.length > 0 && (
                          <span className="border rounded px-1 py-0.5">{scheduledDays.map((d) => dow[d]).join("・")}</span>
                        )}
                        {scheduledRanges.length > 0 ? (
                          scheduledRanges.map((r, idx) => (
                            <span key={`${r.start}-${r.end}-${idx}`} className="border rounded px-1 py-0.5">
                              {new Date(r.start).toLocaleDateString()}〜{new Date(r.end).toLocaleDateString()}
                            </span>
                          ))
                        ) : scheduledDays.length === 0 ? (
                          <span className="opacity-40">-</span>
                        ) : null}
                      </div>
                    </td>
                  )}
                  {showTypeColumn && (
                    <td className="px-2 py-1 w-[128px] whitespace-nowrap">
                      <TypeBadge
                        type={t.type}
                        label={
                          t.type === "daily"
                            ? "毎日"
                            : t.type === "scheduled"
                            ? "特定曜日"
                            : "積み上げ候補"
                        }
                      />
                    </td>
                  )}
                  {showMilestoneColumn && (
                    <td className="px-2 py-1 w-[160px] text-xs opacity-80 truncate" title={milestone?.title}>
                      {milestone ? truncateText(milestone.title, 20) : <span className="opacity-40">-</span>}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="border border-[var(--border)] rounded-md p-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-wide opacity-70">{title}</div>
        {enableSelection && (
          <div className="flex items-center gap-2 text-xs">
            <span className="opacity-70">{Object.values(selected).filter(Boolean).length} 件選択中</span>
            <button className="btn" onClick={bulkComplete} disabled={Object.values(selected).every((v)=>!v)}>完了</button>
            <button className="btn" onClick={bulkMarkIncomplete} disabled={Object.values(selected).every((v)=>!v)}>未完了に戻す</button>
            <button className="btn" onClick={bulkArchiveDaily} disabled={Object.values(selected).every((v)=>!v)}>アーカイブ（毎日）</button>
            <button className="btn btn-danger" onClick={bulkDelete} disabled={Object.values(selected).every((v)=>!v)}>削除</button>
            {enableBulkDueUpdate && (
              <div className="flex items-center gap-1">
                <input type="date" className="border rounded px-2 py-1 bg-transparent" value={bulkDateInput} onChange={(e)=>setBulkDateInput(e.target.value)} />
                <button className="btn" onClick={bulkUpdateDueDate} disabled={Object.values(selected).every((v)=>!v) || !bulkDateInput}>実行日に設定</button>
              </div>
            )}
          </div>
        )}
      </div>
      {tableMode ? (
        tableView
      ) : (
        <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
          {tasks.length === 0 ? (
            <div className="text-sm opacity-60 py-2">タスクなし</div>
          ) : (
            tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2 py-1" onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setCtxTask(t); setCtxPos({ x: e.clientX, y: e.clientY }); }}>
                <TaskRow task={t} onEdit={openEdit} onContext={(e)=>{ e.preventDefault(); e.stopPropagation(); setCtxTask(t); setCtxPos({ x: e.clientX, y: e.clientY }); }} />
                {showType && (t.type === "daily" || t.type === "scheduled") && (
                  <span className="text-[10px] opacity-70 border rounded px-1 py-0.5 whitespace-nowrap">
                    {t.type === "daily" ? "毎日" : "特定曜日"}
                  </span>
                )}
                {showPlannedDates && t.type === "backlog" && (t.plannedDates?.length ?? 0) > 0 && (
                  <div className="flex items-center gap-1 flex-wrap text-[10px] opacity-70">
                    {t.plannedDates!.slice().sort((a,b)=>a-b).map((d) => (
                      <span key={d} className="border rounded px-1 py-0.5">{new Date(d).toLocaleDateString()}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
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

      {ctxTask && ctxPos && (
        <div className="fixed z-[1000]" style={{ top: ctxPos.y, left: ctxPos.x }}>
          <div
            ref={ctxMenuRef}
            className="min-w-40 bg-background text-foreground border border-black/10 dark:border-white/10 rounded shadow-lg p-1"
            onMouseDown={(e) => { e.stopPropagation(); }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <button
              type="button"
              className="w-full text-left px-3 py-2 rounded hover:bg-black/5 dark:hover:bg-white/10 text-sm"
              onClick={() => {
                useAppStore.getState().duplicateTask(ctxTask.id);
                toast.show(`「${ctxTask.title}」を複製しました`, 'success');
                setCtxTask(null); setCtxPos(null);
              }}
            >複製</button>
            <button
              type="button"
              className="w-full text-left px-3 py-2 rounded hover:bg-black/5 dark:hover:bg-white/10 text-sm"
              onClick={() => {
                openEdit(ctxTask);
                setCtxTask(null); setCtxPos(null);
              }}
            >編集</button>
            <button
              type="button"
              className="w-full text-left px-3 py-2 rounded hover:bg-black/5 dark:hover:bg-white/10 text-sm text-[var(--danger)]"
              onClick={async () => {
                const ok = await confirm('このタスクを削除しますか？', { tone: 'danger', confirmText: '削除' });
                if (ok) removeTask(ctxTask.id);
                if (ok) toast.show(`「${ctxTask.title}」を削除しました`, 'success');
                setCtxTask(null); setCtxPos(null);
              }}
            >削除</button>
          </div>
        </div>
      )}
      
    </div>
  );
}


