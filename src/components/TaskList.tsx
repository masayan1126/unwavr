"use client";
import { useAppStore } from "@/lib/store";
import { Task } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

function TaskRow({ task }: { task: Task }) {
  const toggle = useAppStore((s) => s.toggleTask);
  const toggleDailyToday = useAppStore((s) => s.toggleDailyDoneForToday);
  const setActive = useAppStore((s) => s.setActiveTask);
  const activeId = useAppStore((s) => s.pomodoro.activeTaskId);
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
    <div className="flex items-center gap-2 py-1">
      {task.type === "daily" ? (
        <input
          type="checkbox"
          checked={isDailyDoneToday}
          onChange={() => toggleDailyToday(task.id)}
          title="今日実行済みにする"
        />
      ) : (
        <input type="checkbox" checked={task.completed} onChange={() => toggle(task.id)} />
      )}
      <button
        className={`text-left flex-1 ${task.completed ? "line-through opacity-60" : ""}`}
        onClick={() => setActive(task.id === activeId ? undefined : task.id)}
      >
        <div className="text-sm font-medium">{task.title}</div>
        {task.description && <div className="text-xs opacity-70">{task.description}</div>}
      </button>
      <div className="flex items-center gap-2">
        {/* 種別バッジ */}
        <span className="text-[10px] opacity-70 border rounded px-1 py-0.5 whitespace-nowrap">
          {task.type === "daily"
            ? "毎日"
            : task.type === "scheduled"
            ? `特定日(${weekdayLabel})`
            : isPlannedToday
            ? "今日やる(バックログ)"
            : "バックログ"}
        </span>
        {task.estimatedPomodoros != null && (
          <div className="text-xs opacity-70">
            {task.completedPomodoros ?? 0}/{task.estimatedPomodoros}
          </div>
        )}
        {milestone && (
          <div className="text-[10px] opacity-70 border rounded px-1 py-0.5">
            {milestone.title}
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
}: {
  title: string;
  tasks: Task[];
  showType?: boolean;
  showPlannedDates?: boolean;
  tableMode?: boolean;
  showCreatedColumn?: boolean;
  showPlannedColumn?: boolean;
  showScheduledColumn?: boolean;
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
  const [formEst, setFormEst] = useState<number>(0);
  const [formMilestoneId, setFormMilestoneId] = useState<string>("");
  const [formPlannedDateInput, setFormPlannedDateInput] = useState<string>("");
  const [formPlannedDates, setFormPlannedDates] = useState<number[]>([]);
  const [listening, setListening] = useState(false);
  const { toggle: toggleSpeech } = useSpeechRecognition({
    onResult: (txt) => setFormTitle((prev) => (prev ? prev + " " + txt : txt)),
    lang: "ja-JP",
  });

  useEffect(() => {
    // 音声認識セットアップは hook に委譲
  }, [editingTask]);

  function openEdit(t: Task) {
    setEditingId(t.id);
    setFormTitle(t.title);
    setFormDescription(t.description ?? "");
    setFormEst(t.estimatedPomodoros ?? 0);
    setFormMilestoneId(t.milestoneId ?? "");
    setFormPlannedDates(t.plannedDates ?? []);
    setFormPlannedDateInput("");
  }

  function closeEdit() {
    setEditingId(null);
  }

  function saveEdit() {
    if (!editingId) return;
    // 入力中の日付がボタン未押下でも保存時に取り込む
    let nextPlannedDates = formPlannedDates;
    if (editingTask?.type === "backlog" && formPlannedDateInput) {
      const dt = new Date(formPlannedDateInput);
      if (!isNaN(dt.getTime())) {
        const stamp = Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
        if (!nextPlannedDates.includes(stamp)) {
          nextPlannedDates = [...nextPlannedDates, stamp].sort();
        }
      }
    }

    const baseUpdate: Partial<Task> = {
      title: formTitle.trim() || "(無題)",
      description: formDescription.trim() || undefined,
      estimatedPomodoros: Number.isFinite(formEst) ? formEst : 0,
      milestoneId: formMilestoneId || undefined,
    };
    if (editingTask?.type === "backlog") {
      baseUpdate.plannedDates = nextPlannedDates;
    }
    updateTask(editingId, baseUpdate);
    closeEdit();
  }

  const tableView = (
    <div className="overflow-x-auto">
      {(() => {
        const colCount =
          2 +
          (showCreatedColumn ? 1 : 0) +
          (showPlannedColumn ? 1 : 0) +
          (showScheduledColumn ? 1 : 0) +
          1;
        return (
          <div
            className="min-w-[720px] grid gap-x-2 text-[12px] font-medium opacity-70 px-2 py-1 text-left"
            style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
          >
            <div>タイトル</div>
            <div>説明</div>
            {showCreatedColumn && <div>日付</div>}
            {showPlannedColumn && <div>実行日</div>}
            {showScheduledColumn && <div>設定（曜日/期間）</div>}
            <div>マイルストーン</div>
          </div>
        );
      })()}
      <div className="divide-y divide-black/5 dark:divide-white/5">
        {tasks.length === 0 ? (
          <div className="px-2 py-2 text-sm opacity-60">タスクなし</div>
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
            const colCount = 2 + (showCreatedColumn ? 1 : 0) + (showPlannedColumn ? 1 : 0) + 1;
            return (
              <div
                key={t.id}
                className="grid gap-x-2 items-center px-2 py-2"
                style={{ gridTemplateColumns: `repeat(${colCount + (showScheduledColumn ? 1 : 0)}, minmax(0, 1fr))` }}
              >
                <div className="flex items-center gap-2 truncate">
                  {isDaily ? (
                    <input type="checkbox" checked={isDailyDoneToday} onChange={() => toggleDailyToday(t.id)} title="今日実行" />
                  ) : (
                    <input type="checkbox" checked={t.completed} onChange={() => toggleCompleted(t.id)} />
                  )}
                  <button className={`text-left truncate ${t.completed ? "line-through opacity-60" : ""}`} onClick={() => openEdit(t)}>
                    <span className="text-sm font-medium">{t.title}</span>
                  </button>
                </div>
                <div className="truncate">
                  {t.description ? <span className="text-xs opacity-80">{t.description}</span> : <span className="text-xs opacity-40">-</span>}
                </div>
                {showCreatedColumn && (
                  <div className="text-xs opacity-80 whitespace-nowrap">{created.toLocaleDateString()}</div>
                )}
                {showPlannedColumn && (
                  <div className="flex items-center gap-1 flex-wrap text-[10px] opacity-80">
                    {planned.length > 0 ? planned.map((pd) => (
                      <span key={pd} className="border rounded px-1 py-0.5">{new Date(pd).toLocaleDateString()}</span>
                    )) : <span className="opacity-40">-</span>}
                  </div>
                )}
                {showScheduledColumn && (
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
                )}
                <div className="text-xs opacity-80 truncate">{milestone ? milestone.title : <span className="opacity-40">-</span>}</div>
              </div>
            );
          })
        )}
      </div>
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
                <TaskRow task={t} />
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
                <button
                  className="text-xs underline opacity-80 ml-auto"
                  onClick={() => openEdit(t)}
                >
                  編集
                </button>
                <button
                  className="text-xs underline opacity-80"
                  onClick={() => removeTask(t.id)}
                >
                  削除
                </button>
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
          <div className="w-full max-w-md bg-background text-foreground rounded border border-black/10 dark:border-white/10 p-4 flex flex-col gap-3"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">タスクを編集</div>
              <button className="text-sm underline opacity-80" onClick={closeEdit}>閉じる</button>
            </div>
            <label className="text-xs flex flex-col gap-1">
              タイトル
              <div className="flex items-center gap-2">
                <input
                  className={`flex-1 border rounded px-2 py-1 bg-transparent border-black/10 dark:border-white/10 ${listening ? "ring-2 ring-red-500/60" : ""}`}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
                <button
                  type="button"
                  className={`px-2 py-1 rounded border text-xs ${listening ? "bg-red-600 text-white border-red-600" : ""}`}
                  onClick={() => { setListening((v)=>!v); toggleSpeech(); }}
                >
                  音声入力
                </button>
                {listening && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-red-600">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    音声入力中...
                  </span>
                )}
              </div>
            </label>
            <label className="text-xs flex flex-col gap-1">
              説明
              <textarea
                className="border rounded px-2 py-1 bg-transparent border-black/10 dark:border-white/10 min-h-[80px]"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </label>
            <div className="flex items-center gap-3">
              <label className="text-xs flex items-center gap-2">
                見積ポモ
                <input
                  type="number"
                  min={0}
                  className="w-20 border rounded px-2 py-1 bg-transparent border-black/10 dark:border-white/10"
                  value={Number.isFinite(formEst) ? formEst : 0}
                  onChange={(e) => setFormEst(Number(e.target.value))}
                />
              </label>
              <label className="text-xs flex items-center gap-2">
                マイルストーン
                <select
                  className="border rounded px-2 py-1 bg-transparent border-black/10 dark:border-white/10"
                  value={formMilestoneId}
                  onChange={(e) => setFormMilestoneId(e.target.value)}
                >
                  <option value="">未設定</option>
                  {milestoneOptions.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </label>
            </div>

            {editingTask?.type === "backlog" && (
              <div className="flex flex-col gap-2">
                <div className="text-xs opacity-70">実行日</div>
                <div className="flex gap-2 items-center flex-wrap">
                  <input
                    type="date"
                    className="border border-black/10 dark:border-white/10 rounded px-2 py-1 bg-transparent"
                    value={formPlannedDateInput}
                    onChange={(e) => setFormPlannedDateInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="px-2 py-1 rounded border text-xs"
                    onClick={() => {
                      if (!formPlannedDateInput) return;
                      const dt = new Date(formPlannedDateInput);
                      if (isNaN(dt.getTime())) return;
                      const stamp = Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
                      if (!formPlannedDates.includes(stamp)) setFormPlannedDates((arr) => [...arr, stamp].sort());
                      setFormPlannedDateInput("");
                    }}
                  >
                    追加
                  </button>
                </div>
                {formPlannedDates.length > 0 && (
                  <div className="flex flex-col gap-1 text-xs">
                    {formPlannedDates.map((d) => (
                      <div key={d} className="flex items-center gap-2">
                        <span>{new Date(d).toLocaleDateString()}</span>
                        <button
                          type="button"
                          className="underline opacity-70"
                          onClick={() => setFormPlannedDates((arr) => arr.filter((x) => x !== d))}
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 rounded border text-sm" onClick={closeEdit}>キャンセル</button>
              <button className="px-3 py-1 rounded bg-foreground text-background text-sm" onClick={saveEdit}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


