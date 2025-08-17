"use client";
import { useAppStore } from "@/lib/store";
import { Task } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ListTodo, Archive } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

// 文字列を20字で省略するユーティリティ関数
function truncateText(text: string, maxLength: number = 20): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

function TypeBadge({ type, label }: { type: "daily" | "scheduled" | "backlog"; label?: string }) {
  const map = {
    // サイドバーと同一のアイコンに統一
    daily: { label: "毎日", classes: "bg-blue-500/10 text-blue-600 border-blue-500/30", Icon: ListTodo },
    scheduled: { label: "特定日", classes: "bg-amber-500/10 text-amber-700 border-amber-500/30", Icon: CalendarDays },
    // 視認性向上＆重複回避のためバックログはArchiveアイコン
    backlog: { label: "バックログ", classes: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30", Icon: Archive },
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

function TaskRow({ task, onEdit }: { task: Task; onEdit: (task: Task) => void }) {
  const toggle = useAppStore((s) => s.toggleTask);
  const toggleDailyToday = useAppStore((s) => s.toggleDailyDoneForToday);
  
  const milestones = useAppStore((s) => s.milestones);
  const milestone = task.milestoneId ? milestones.find((m) => m.id === task.milestoneId) : undefined;
  const weekdayLabel = ["日","月","火","水","木","金","土"][new Date().getDay()];
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
    <div className={`flex items-center gap-2 py-1 min-w-0 ${
      task.completed ? "bg-emerald-50/60 dark:bg-emerald-900/20 rounded" : ""
    }`}>
      {task.type === "daily" ? (
        <button
          type="button"
          onClick={() => toggleDailyToday(task.id)}
          title="今日実行済みにする"
          className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center hover:scale-110 ${
            isDailyDoneToday
              ? "bg-blue-500 border-blue-500 text-white"
              : "border-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:hover:border-blue-400 dark:hover:bg-blue-900/20"
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
          onClick={() => toggle(task.id)}
          title={task.completed ? "完了を解除" : "完了にする"}
          className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center hover:scale-110 ${
            task.completed
              ? "bg-green-500 border-green-500 text-white"
              : "border-gray-300 hover:border-green-400 hover:bg-green-50 dark:border-gray-600 dark:hover:border-green-400 dark:hover:bg-green-900/20"
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
              ? "毎日積み上げ"
              : task.type === "scheduled"
              ? `特定日(${weekdayLabel})`
              : isPlannedToday
              ? "今日やる"
              : "バックログ"
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
}) {
  const updateTask = useAppStore((s) => s.updateTask);
  const removeTask = useAppStore((s) => s.removeTask);
  const milestones = useAppStore((s) => s.milestones);
  const toggleCompleted = useAppStore((s) => s.toggleTask);
  const toggleDailyToday = useAppStore((s) => s.toggleDailyDoneForToday);
  const milestoneOptions = useMemo(() => milestones.map((m) => ({ id: m.id, title: m.title })), [milestones]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const editingTask = useMemo(() => tasks.find((t) => t.id === editingId), [editingId, tasks]);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<"daily" | "scheduled" | "backlog">("daily");
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

  useEffect(() => {
    // 音声認識セットアップは hook に委譲
  }, [editingTask]);

  // 表示カラムに合わせたグリッドはテーブルレイアウトを使用しているため未使用の計算を削除

  function openEdit(t: Task) {
    setEditingId(t.id);
    setFormTitle(t.title);
    setFormDescription(t.description ?? "");
    setFormType(t.type);
    setFormEst(t.estimatedPomodoros ?? 0);
    setFormMilestoneId(t.milestoneId ?? "");
    const firstPlanned = (t.plannedDates ?? [])[0];
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

  function saveEdit() {
    if (!editingId) return;
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
    closeEdit();
  }

  const tableView = (
    <div className="overflow-x-auto">
      <table className="min-w-[720px] w-full border-separate border-spacing-0">
        <thead>
          <tr className="text-[12px] font-medium opacity-70">
            <th className="text-left px-2 py-1">タイトル</th>
            {showCreatedColumn && <th className="text-left px-2 py-1">日付</th>}
            {showPlannedColumn && <th className="text-left px-2 py-1">実行日</th>}
            {showScheduledColumn && <th className="text-left px-2 py-1">設定（曜日/期間）</th>}
            {showTypeColumn && <th className="text-left px-2 py-1">種別</th>}
            {showMilestoneColumn && <th className="text-left px-2 py-1">マイルストーン</th>}
          </tr>
        </thead>
        <tbody className="align-top">
          {tasks.length === 0 ? (
            <tr>
              <td className="px-2 py-2 text-sm opacity-60" colSpan={1 + Number(showCreatedColumn) + Number(showPlannedColumn) + Number(showScheduledColumn) + Number(showTypeColumn) + Number(showMilestoneColumn)}>タスクなし</td>
            </tr>
          ) : (
            tasks.map((t) => {
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
                  className={`border-t border-black/5 dark:border-white/5 ${
                    t.completed ? "bg-emerald-50 dark:bg-emerald-900/20" : ""
                  }`}
                >
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isDaily ? (
                        <button
                          type="button"
                          onClick={() => toggleDailyToday(t.id)}
                          title="今日実行済みにする"
                          className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center hover:scale-110 ${
                            isDailyDoneToday
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "border-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:hover:border-blue-400 dark:hover:bg-blue-900/20"
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
                          onClick={() => toggleCompleted(t.id)}
                          title={t.completed ? "完了を解除" : "完了にする"}
                          className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center hover:scale-110 ${
                            t.completed
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-gray-300 hover:border-green-400 hover:bg-green-50 dark:border-gray-600 dark:hover:border-green-400 dark:hover:bg-green-900/20"
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
                        className={`text-left truncate flex-1 ${t.completed ? "line-through opacity-60" : ""}`} 
                        onClick={() => openEdit(t)}
                        title={t.title}
                      >
                        <span className="text-sm font-medium">{truncateText(t.title, 20)}</span>
                      </button>
                    </div>
                  </td>
                  {showCreatedColumn && (
                    <td className="px-2 py-2 text-xs opacity-80 whitespace-nowrap">{created.toLocaleDateString()}</td>
                  )}
                  {showPlannedColumn && (
                    <td className="px-2 py-2">
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
                    <td className="px-2 py-2">
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
                    <td className="px-2 py-2">
                      <TypeBadge
                        type={t.type}
                        label={t.type === "daily" ? "毎日積み上げ" : t.type === "scheduled" ? "特定日" : "バックログ"}
                      />
                    </td>
                  )}
                  {showMilestoneColumn && (
                    <td className="px-2 py-2 text-xs opacity-80 truncate" title={milestone?.title}>
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
    <div className="border border-black/10 dark:border-white/10 rounded-md p-3">
      <div className="text-xs uppercase tracking-wide opacity-70 mb-2">{title}</div>
      {tableMode ? (
        tableView
      ) : (
        <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
          {tasks.length === 0 ? (
            <div className="text-sm opacity-60 py-2">タスクなし</div>
          ) : (
            tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2 py-1">
                <TaskRow task={t} onEdit={openEdit} />
                {showType && (t.type === "daily" || t.type === "scheduled") && (
                  <span className="text-[10px] opacity-70 border rounded px-1 py-0.5 whitespace-nowrap">
                    {t.type === "daily" ? "毎日" : "特定日"}
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
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEdit();
          }}
        >
          <div className="w-full max-w-4xl bg-background text-foreground rounded border border-black/10 dark:border-white/10 p-8 flex flex-col gap-6"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="text-xl font-semibold">タスク詳細</div>
              <button className="text-sm underline opacity-80" onClick={closeEdit}>閉じる</button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium block">タイトル</label>
                  <div className="flex items-center gap-3">
                    <input
                      className={`flex-1 border rounded-lg px-4 py-3 bg-transparent border-black/10 dark:border-white/10 ${listening ? "ring-2 ring-red-500/60" : ""}`}
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                    <button
                      type="button"
                      className={`px-4 py-3 rounded-lg border text-sm whitespace-nowrap ${listening ? "bg-red-600 text-white border-red-600" : ""}`}
                      onClick={() => { setListening((v)=>!v); toggleSpeech(); }}
                    >
                      音声入力
                    </button>
                  </div>
                  {listening && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-600">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                      音声入力中...
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium block">説明</label>
                  <textarea
                    className="border rounded-lg px-4 py-3 bg-transparent border-black/10 dark:border-white/10 min-h-[140px] w-full"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium block">タスクタイプ</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 bg-transparent border-black/10 dark:border-white/10"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as "daily" | "scheduled" | "backlog")}
                  >
                    <option value="daily">毎日積み上げ</option>
                    <option value="scheduled">特定の日・曜日</option>
                    <option value="backlog">バックログ</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium block">見積ポモ</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full border rounded-lg px-3 py-2 bg-transparent border-black/10 dark:border-white/10"
                      value={Number.isFinite(formEst) ? formEst : 0}
                      onChange={(e) => setFormEst(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium block">マイルストーン</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2 bg-transparent border-black/10 dark:border-white/10"
                      value={formMilestoneId}
                      onChange={(e) => setFormMilestoneId(e.target.value)}
                    >
                      <option value="">未設定</option>
                      {milestoneOptions.map((m) => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formType === "scheduled" && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium block">曜日設定</label>
                    <div className="flex flex-wrap gap-2">
                      {["日", "月", "火", "水", "木", "金", "土"].map((day, index) => (
                        <button
                          key={day}
                          type="button"
                          className={`px-3 py-2 rounded-lg border text-sm ${
                            formScheduledDays.includes(index)
                              ? "bg-foreground text-background"
                              : "bg-transparent"
                          }`}
                          onClick={() => {
                            setFormScheduledDays(prev =>
                              prev.includes(index)
                                ? prev.filter(d => d !== index)
                                : [...prev, index].sort()
                            );
                          }}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formType === "backlog" && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium block">実行日</label>
                    <div className="flex gap-3 items-center flex-wrap">
                      <input
                        type="date"
                        className="border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 bg-transparent"
                        value={formPlannedDateInput}
                        onChange={(e) => setFormPlannedDateInput(e.target.value)}
                        title="保存ボタンでこの日付が実行日に設定されます"
                      />
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg border text-sm whitespace-nowrap"
                        onClick={() => { setFormPlannedDateInput(""); setFormPlannedDate(null); }}
                      >
                        クリア
                      </button>
                    </div>
                    <div className="text-xs opacity-70">保存ボタンで実行日が更新されます（1つだけ保持）</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-black/10 dark:border-white/10">
              <button 
                className="px-6 py-3 rounded-lg border text-sm text-red-600 border-red-600 hover:bg-red-600 hover:text-white transition-colors"
                onClick={() => {
                  if (confirm('このタスクを削除しますか？')) {
                    removeTask(editingTask.id);
                    closeEdit();
                  }
                }}
              >
                削除
              </button>
              <div className="flex gap-3">
                <button className="px-6 py-3 rounded-lg border text-sm" onClick={closeEdit}>キャンセル</button>
                <button className="px-6 py-3 rounded-lg bg-foreground text-background text-sm" onClick={saveEdit}>保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


