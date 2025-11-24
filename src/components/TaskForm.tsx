"use client";
import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Scheduled, TaskType, type Task } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { Loader2, Mic } from "lucide-react";
import WysiwygEditor from "@/components/WysiwygEditor";
import PrimaryButton from "@/components/PrimaryButton";
import { copyDescriptionToClipboard, copyDescriptionWithFormat, type CopyFormat } from "@/lib/taskUtils";
import { Copy, ChevronDown } from "lucide-react";
import { X } from "lucide-react";
import { useToast } from "@/components/Providers";

export type TaskFormProps = {
  onSubmitted?: (mode: 'close' | 'keep') => void;
  defaultType?: TaskType;
  task?: Task;
  onCancel?: () => void;
};
export type TaskFormHandle = { save: () => void };

function TaskFormInner({ onSubmitted, defaultType, task, onCancel }: TaskFormProps, ref: React.Ref<TaskFormHandle>) {
  const toast = useToast();
  const addTask = useAppStore((s) => s.addTask);
  const milestones = useAppStore((s) => s.milestones);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>(defaultType ?? "backlog");
  const [desc, setDesc] = useState("");
  const [scheduled, setScheduled] = useState<Scheduled | undefined>(undefined);
  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");
  const [milestoneId, setMilestoneId] = useState<string>("");
  const [est, setEst] = useState<number>(0);
  const [plannedDateInput, setPlannedDateInput] = useState<string>(() => {
    if ((defaultType ?? "backlog") !== "backlog") return "";
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  });
  const [plannedDates, setPlannedDates] = useState<number[]>([(() => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    const today = d.getTime();
    return (defaultType ?? "backlog") === "backlog" ? today : undefined as unknown as number;
  })()].filter((v) => typeof v === "number") as number[]);
  const [listening, setListening] = useState(false);
  const isSubmittingRef = useRef(false);
  const [draftTaskId, setDraftTaskId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const { toggle: toggleSpeech } = useSpeechRecognition({
    onResult: (txt) => setTitle((prev) => (prev ? prev + " " + txt : txt)),
    lang: "ja-JP",
  });

  useEffect(() => {
    // 状態は hook 内に集約。ここではビジュアル状態のみ連動。
  }, []);

  useEffect(() => {
    if (!task) return;
    // props.task が更新されたらローカルも最新に反映（編集再オープン時に古い表示を防ぐ）
    setDraftTaskId(task.id);
    setTitle(task.title ?? "");
    setDesc(task.description ?? "");
    setType(task.type);
    setScheduled(task.scheduled);
    setMilestoneId(task.milestoneId ?? "");
    if (task.type === "backlog") {
      const first = (task.plannedDates ?? [])[0];
      if (first != null) {
        const d = new Date(first);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        setPlannedDateInput(`${y}-${m}-${dd}`);
        setPlannedDates([first]);
      } else {
        setPlannedDateInput("");
        setPlannedDates([]);
      }
    } else {
      setPlannedDateInput("");
      setPlannedDates([]);
    }
  }, [task]);

  const performSave = useCallback(() => {
    if (isSubmittingRef.current) return;
    const trimmed = title.trim();
    isSubmittingRef.current = true;
    setIsSaving(true);
    try {
      if (!draftTaskId) {
        // 新規作成時: タイトル未入力なら保存しない
        if (!trimmed) return;
        const newId = addTask({
          title: trimmed,
          description: desc || undefined,
          type,
          scheduled,
          milestoneId: milestoneId || undefined,
          dailyDoneDates: [],
          plannedDates: type === "backlog" ? plannedDates : [],
          estimatedPomodoros: Number.isFinite(est) ? est : 0,
        });
        setDraftTaskId(newId);
      } else {
        const updatePayload: Partial<Task> = {
          description: desc || undefined,
          type,
          scheduled,
          milestoneId: milestoneId || undefined,
          plannedDates: type === "backlog" ? plannedDates : [],
          estimatedPomodoros: Number.isFinite(est) ? est : 0,
        };
        updatePayload.title = trimmed || undefined;
        useAppStore.getState().updateTask(draftTaskId, updatePayload);
      }
      setLastSavedAt(Date.now());
    } finally {
      setTimeout(() => { isSubmittingRef.current = false; }, 0);
      setTimeout(() => setIsSaving(false), 150);
    }
  }, [addTask, desc, milestoneId, plannedDates, scheduled, title, type, draftTaskId, est]);

  useImperativeHandle(ref, () => ({ save: performSave }), [performSave]);

  const resetForm = () => {
    setDraftTaskId(undefined);
    setTitle("");
    setDesc("");
    setScheduled(undefined);
    setMilestoneId("");
    setPlannedDates([(() => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d.getTime(); })()]);
    setType("backlog");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return; // タイトル未入力は保存しない
    performSave();
    if (!task) {
      // 追加ボタンで確定: リセットして閉じる
      resetForm();
    }
    if (onSubmitted) onSubmitted('close');
    toast.show(task ? 'タスクを保存しました' : 'タスクを追加しました', 'success');
  };

  const toggleWeekend = () => {
    if (type !== "scheduled") return;
    const dow = new Set(scheduled?.daysOfWeek ?? []);
    const weekend = [0, 6];
    for (const d of weekend) {
      if (dow.has(d)) {
        dow.delete(d);
      } else {
        dow.add(d);
      }
    }
    setScheduled({ daysOfWeek: Array.from(dow).sort((a, b) => a - b), dateRanges: scheduled?.dateRanges });
  };

  const formRef = useRef<HTMLFormElement | null>(null);
  const latestDescRef = useRef<string>("");
  useEffect(() => { latestDescRef.current = desc; }, [desc]);

  const handleFormBlur = (e: React.FocusEvent<HTMLFormElement>) => {
    const root = formRef.current;
    const next = e.relatedTarget as Node | null;
    if (root && next && root.contains(next)) return; // フォーム内のフォーカス移動は無視
    performSave();
  };

  function CopyMenu({ onCopy }: { onCopy: (format: CopyFormat) => void }) {
    const [open, setOpen] = useState(false);
    return (
      <div className="relative inline-block text-left z-[1000]">
        <button
          type="button"
          className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          title="説明をコピー"
        >
          <Copy size={14} />
          コピー
          <ChevronDown size={12} />
        </button>
        {open && (
          <div className="absolute right-0 mt-1 w-40 rounded border bg-background text-foreground shadow-lg z-[1001]">
            {(["markdown", "text", "html"] as CopyFormat[]).map((fmt) => (
              <button
                key={fmt}
                type="button"
                className="w-full text-left px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => { onCopy(fmt); setOpen(false); }}
              >
                {fmt === 'text' ? 'テキストでコピー' : fmt === 'markdown' ? 'Markdownでコピー' : 'HTMLでコピー'}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <form ref={formRef} onSubmit={onSubmit} onBlur={handleFormBlur} className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-2">
          <input
            className={`text-4xl font-bold bg-transparent border-none p-0 focus:ring-0 placeholder:text-muted-foreground/40 w-full ${listening ? "ring-2 ring-[var(--danger)]/60 rounded" : ""}`}
            placeholder="無題"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={performSave}
          />
          <div className="flex items-center gap-2">
            {listening && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--danger)]">
                <span className="w-2 h-2 rounded-full bg-[var(--danger)] animate-pulse" />
                音声入力中...
              </span>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
              {isSaving ? (
                <span className="inline-flex items-center gap-1"><Loader2 size={14} className="animate-spin" /> 保存中...</span>
              ) : lastSavedAt ? (
                <span>保存済み</span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1 text-sm">
          {/* Type Property */}
          <div className="flex items-center min-h-[32px]">
            <div className="w-[140px] text-muted-foreground flex items-center gap-2">タイプ</div>
            <div className="flex-1">
              <select
                className="bg-transparent border-none hover:bg-black/5 dark:hover:bg-white/10 rounded px-2 py-1 cursor-pointer w-full md:w-auto focus:ring-0"
                value={type}
                onChange={(e) => {
                  const v = e.target.value as TaskType;
                  setType(v);
                  if (v === "scheduled") setScheduled({ daysOfWeek: [] });
                  else setScheduled(undefined);
                  if (v !== "backlog") setPlannedDates([]);
                }}
                onBlur={performSave}
              >
                <option value="daily">毎日</option>
                <option value="backlog">積み上げ候補</option>
                <option value="scheduled">特定曜日</option>
              </select>
            </div>
          </div>

          {/* Estimate Property */}
          <div className="flex items-center min-h-[32px]">
            <div className="w-[140px] text-muted-foreground flex items-center gap-2">見積ポモドーロ</div>
            <div className="flex-1">
              <input
                type="number"
                min={0}
                className="bg-transparent border-none hover:bg-black/5 dark:hover:bg-white/10 rounded px-2 py-1 w-20 focus:ring-0"
                value={Number.isFinite(est) ? est : 0}
                onChange={(e) => setEst(Number(e.target.value))}
                onBlur={performSave}
              />
            </div>
          </div>

          {/* Milestone Property */}
          <div className="flex items-center min-h-[32px]">
            <div className="w-[140px] text-muted-foreground flex items-center gap-2">マイルストーン</div>
            <div className="flex-1">
              <select
                className="bg-transparent border-none hover:bg-black/5 dark:hover:bg-white/10 rounded px-2 py-1 cursor-pointer w-full md:w-auto focus:ring-0"
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                onBlur={performSave}
              >
                <option value="">未選択</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.currentUnits}/{m.targetUnits})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scheduled Specifics */}
          {type === "scheduled" && (
            <div className="flex items-start min-h-[32px] mt-1">
              <div className="w-[140px] text-muted-foreground flex items-center gap-2 pt-1">曜日・期間</div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex gap-1 flex-wrap">
                  {["日", "月", "火", "水", "木", "金", "土"].map((label, idx) => {
                    const selected = scheduled?.daysOfWeek?.includes(idx) ?? false;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const setD = new Set(scheduled?.daysOfWeek ?? []);
                          if (setD.has(idx)) setD.delete(idx); else setD.add(idx);
                          setScheduled({ daysOfWeek: Array.from(setD).sort((a, b) => a - b), dateRanges: scheduled?.dateRanges });
                        }}
                        className={`px-2 py-1 rounded text-xs border ${selected ? "bg-foreground text-background border-foreground" : "bg-transparent border-border"}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <button type="button" onClick={toggleWeekend} className="text-xs underline opacity-80 self-start">
                  土日トグル
                </button>
                {/* Date Ranges */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center flex-wrap">
                    <input
                      type="date"
                      className="border border-border rounded px-2 py-1 bg-transparent text-xs"
                      value={rangeStart}
                      onChange={(e) => setRangeStart(e.target.value)}
                      onBlur={performSave}
                    />
                    <span className="text-xs">〜</span>
                    <input
                      type="date"
                      className="border border-border rounded px-2 py-1 bg-transparent text-xs"
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(e.target.value)}
                      onBlur={performSave}
                    />
                    <button
                      type="button"
                      className="px-2 py-1 rounded border border-border text-xs hover:bg-black/5"
                      onClick={() => {
                        if (!rangeStart || !rangeEnd) return;
                        const startDate = new Date(rangeStart);
                        const endDate = new Date(rangeEnd);
                        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;
                        const sNum = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
                        const eNum = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
                        const currentRanges = scheduled?.dateRanges ? [...scheduled.dateRanges] : [];
                        const nextRanges = [
                          ...currentRanges,
                          { start: Math.min(sNum, eNum), end: Math.max(sNum, eNum) },
                        ];
                        setScheduled({ daysOfWeek: scheduled?.daysOfWeek ?? [], dateRanges: nextRanges });
                        setRangeStart("");
                        setRangeEnd("");
                      }}
                    >
                      期間追加
                    </button>
                  </div>
                  {(scheduled?.dateRanges?.length ?? 0) > 0 && (
                    <div className="flex flex-col gap-1 text-xs">
                      {(scheduled?.dateRanges ?? []).map((r, idx) => (
                        <div key={`${r.start}-${r.end}-${idx}`} className="flex items-center gap-2">
                          <span>
                            {new Date(r.start).toLocaleDateString()} 〜 {new Date(r.end).toLocaleDateString()}
                          </span>
                          <button
                            type="button"
                            className="underline opacity-70"
                            onClick={() => {
                              const ranges = (scheduled?.dateRanges ?? []).filter((_, i) => i !== idx);
                              setScheduled({ daysOfWeek: scheduled?.daysOfWeek ?? [], dateRanges: ranges });
                            }}
                          >
                            削除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Backlog Specifics */}
          {type === "backlog" && (
            <div className="flex items-center min-h-[32px]">
              <div className="w-[140px] text-muted-foreground flex items-center gap-2">実行日</div>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="date"
                  className="bg-transparent border-none hover:bg-black/5 dark:hover:bg-white/10 rounded px-2 py-1 text-sm focus:ring-0"
                  value={plannedDateInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPlannedDateInput(val);
                    if (!val) {
                      setPlannedDates([]);
                      return;
                    }
                    const dt = new Date(val);
                    if (isNaN(dt.getTime())) return;
                    const stamp = Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
                    setPlannedDates([stamp]);
                  }}
                  onBlur={() => {
                    if (!plannedDateInput) {
                      performSave();
                      return;
                    }
                    const dt = new Date(plannedDateInput);
                    if (isNaN(dt.getTime())) return;
                    const stamp = Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
                    setPlannedDates([stamp]);
                    setTimeout(() => performSave(), 0);
                  }}
                />
                {plannedDateInput && (
                  <button
                    type="button"
                    className="text-xs opacity-50 hover:opacity-100"
                    onClick={() => {
                      setPlannedDateInput("");
                      setPlannedDates([]);
                    }}
                  >
                    クリア
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <hr className="border-border opacity-50" />

        <div className="flex flex-col gap-2 min-h-[200px]">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">説明</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs opacity-70 hover:opacity-100 hover:bg-black/5 ${listening ? "text-[var(--danger)]" : ""}`}
                onClick={() => { setListening((v) => !v); toggleSpeech(); }}
              >
                <Mic size={14} className="mr-1" />
                音声入力
              </button>
              <CopyMenu
                onCopy={async (fmt) => {
                  if (!desc.trim()) { toast.show("説明がありません", "warning"); return; }
                  await copyDescriptionWithFormat(desc, fmt);
                  toast.show(`${fmt === 'markdown' ? 'Markdown' : fmt === 'html' ? 'HTML' : 'テキスト'}でコピーしました`, 'success');
                }}
              />
            </div>
          </div>
          <WysiwygEditor
            value={desc}
            onChange={(html) => { setDesc(html); }}
            onBlur={(latest) => { setDesc(latest); performSave(); }}
          />
        </div>
        {!task && (
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
            <button type="button" className="btn" onClick={() => { performSave(); toast.show('タスクを追加しました', 'success'); setTimeout(() => { if (onSubmitted) onSubmitted('keep'); }, 0); }}>続けて追加</button>
            <PrimaryButton label="追加" type="submit" />
          </div>
        )}
      </form>

    </>
  );
}

const TaskForm = forwardRef<TaskFormHandle, TaskFormProps>(TaskFormInner);
export default TaskForm;


