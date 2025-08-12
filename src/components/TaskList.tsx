"use client";
import { useAppStore } from "@/lib/store";
import { Task } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

function TaskRow({ task }: { task: Task }) {
  const toggle = useAppStore((s) => s.toggleTask);
  const setActive = useAppStore((s) => s.setActiveTask);
  const activeId = useAppStore((s) => s.pomodoro.activeTaskId);
  const milestones = useAppStore((s) => s.milestones);
  const milestone = task.milestoneId ? milestones.find((m) => m.id === task.milestoneId) : undefined;
  return (
    <div className="flex items-center gap-2 py-1">
      <input type="checkbox" checked={task.completed} onChange={() => toggle(task.id)} />
      <button
        className={`text-left flex-1 ${task.completed ? "line-through opacity-60" : ""}`}
        onClick={() => setActive(task.id === activeId ? undefined : task.id)}
      >
        <div className="text-sm font-medium">{task.title}</div>
        {task.description && <div className="text-xs opacity-70">{task.description}</div>}
      </button>
      <div className="flex items-center gap-2">
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

export default function TaskList({ title, tasks }: { title: string; tasks: Task[] }) {
  const updateTask = useAppStore((s) => s.updateTask);
  const removeTask = useAppStore((s) => s.removeTask);
  const milestones = useAppStore((s) => s.milestones);
  const milestoneOptions = useMemo(() => milestones.map((m) => ({ id: m.id, title: m.title })), [milestones]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const editingTask = useMemo(() => tasks.find((t) => t.id === editingId), [editingId, tasks]);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formEst, setFormEst] = useState<number>(0);
  const [formMilestoneId, setFormMilestoneId] = useState<string>("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<null | (SpeechRecognition & { start: () => void; stop: () => void })>(null);

  useEffect(() => {
    if (!editingTask) return;
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec: SpeechRecognition = new SR();
    rec.lang = "ja-JP";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const txt = e.results?.[0]?.[0]?.transcript ?? "";
      if (txt) setFormTitle((prev) => (prev ? prev + " " + txt : txt));
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec as any;
    return () => {
      try { recognitionRef.current?.stop(); } catch {}
      recognitionRef.current = null;
      setListening(false);
    };
  }, [editingTask]);

  function openEdit(t: Task) {
    setEditingId(t.id);
    setFormTitle(t.title);
    setFormDescription(t.description ?? "");
    setFormEst(t.estimatedPomodoros ?? 0);
    setFormMilestoneId(t.milestoneId ?? "");
  }

  function closeEdit() {
    setEditingId(null);
  }

  function saveEdit() {
    if (!editingId) return;
    updateTask(editingId, {
      title: formTitle.trim() || "(無題)",
      description: formDescription.trim() || undefined,
      estimatedPomodoros: Number.isFinite(formEst) ? formEst : 0,
      milestoneId: formMilestoneId || undefined,
    });
    closeEdit();
  }

  return (
    <div className="border border-black/10 dark:border-white/10 rounded-md p-3">
      <div className="text-xs uppercase tracking-wide opacity-70 mb-2">{title}</div>
      <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
        {tasks.length === 0 ? (
          <div className="text-sm opacity-60 py-2">タスクなし</div>
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2 py-1">
              <TaskRow task={t} />
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
                  onClick={() => {
                    if (!recognitionRef.current) return;
                    if (listening) {
                      recognitionRef.current.stop();
                      setListening(false);
                    } else {
                      try {
                        setListening(true);
                        recognitionRef.current.start();
                      } catch {
                        setListening(false);
                      }
                    }
                  }}
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


