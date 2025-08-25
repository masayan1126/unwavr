"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Scheduled, TaskType } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { Loader2 } from "lucide-react";
import WysiwygEditor from "@/components/WysiwygEditor";
import { X } from "lucide-react";

type TaskFormProps = {
  onSubmitted?: (mode: 'close' | 'keep') => void;
};

export default function TaskForm({ onSubmitted }: TaskFormProps) {
  const addTask = useAppStore((s) => s.addTask);
  const milestones = useAppStore((s) => s.milestones);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("daily");
  const [desc, setDesc] = useState("");
  const [estimated, setEstimated] = useState(0);
  const [scheduled, setScheduled] = useState<Scheduled | undefined>(undefined);
  const [rangeStart, setRangeStart] = useState<string>("");
  const [rangeEnd, setRangeEnd] = useState<string>("");
  const [milestoneId, setMilestoneId] = useState<string>("");
  const [plannedDateInput, setPlannedDateInput] = useState<string>("");
  const [plannedDates, setPlannedDates] = useState<number[]>([]);
  const [listening, setListening] = useState(false);
  const isSubmittingRef = useRef(false);
  const [draftTaskId, setDraftTaskId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [showDescOverlay, setShowDescOverlay] = useState(false);
  const { toggle: toggleSpeech } = useSpeechRecognition({
    onResult: (txt) => setTitle((prev) => (prev ? prev + " " + txt : txt)),
    lang: "ja-JP",
  });

  useEffect(() => {
    // 状態は hook 内に集約。ここではビジュアル状態のみ連動。
  }, []);

  const performSave = useCallback(() => {
    if (isSubmittingRef.current) return;
    const trimmed = title.trim();
    if (!trimmed) return;
    isSubmittingRef.current = true;
    setIsSaving(true);
    try {
      if (!draftTaskId) {
        const newId = addTask({
          title: trimmed,
          description: desc || undefined,
          type,
          scheduled,
          estimatedPomodoros: estimated || 0,
          milestoneId: milestoneId || undefined,
          dailyDoneDates: [],
          plannedDates: type === "backlog" ? plannedDates : [],
        });
        setDraftTaskId(newId);
      } else {
        useAppStore.getState().updateTask(draftTaskId, {
          title: trimmed,
          description: desc || undefined,
          type,
          scheduled,
          estimatedPomodoros: estimated || 0,
          milestoneId: milestoneId || undefined,
          plannedDates: type === "backlog" ? plannedDates : [],
        });
      }
      setLastSavedAt(Date.now());
    } finally {
      // 次のイベントループで解除して多重発火を防止
      setTimeout(() => { isSubmittingRef.current = false; }, 0);
      setTimeout(() => setIsSaving(false), 150);
    }
  }, [addTask, desc, estimated, milestoneId, plannedDates, scheduled, title, type, draftTaskId]);

  const resetForm = () => {
    setDraftTaskId(undefined);
    setTitle("");
    setDesc("");
    setEstimated(0);
    setScheduled(undefined);
    setMilestoneId("");
    setPlannedDates([]);
    setType("daily");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSave();
    // 追加ボタンで確定: リセットして閉じる
    resetForm();
    if (onSubmitted) onSubmitted('close');
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

  return (
    <>
    <form onSubmit={onSubmit} className="flex flex-col gap-2 border border-black/10 dark:border-white/10 p-3 rounded-md w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2 items-center flex-1">
          <input
            className={`flex-1 border border-black/10 dark:border-white/10 rounded px-2 py-1 bg-transparent ${listening ? "ring-2 ring-red-500/60" : ""}`}
            placeholder="タスク名"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={performSave}
          />
          <button
            type="button"
            className={`px-2 py-1 rounded border text-xs ${listening ? "bg-red-600 text-white border-red-600" : ""}`}
            onClick={() => { setListening((v)=>!v); toggleSpeech(); }}
          >
            音声入力
          </button>
          {listening && (
            <span className="inline-flex items-center gap-1 text-xs text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              音声入力中...
            </span>
          )}
          <select
            className="border border-black/10 dark:border-white/10 rounded px-2 py-1 bg-transparent"
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
            <option value="backlog">不定期（積み上げ候補）</option>
            <option value="scheduled">特定曜日だけ</option>
          </select>
        </div>
        <div className="text-xs min-w-[180px] text-right">
          {isSaving ? (
            <span className="inline-flex items-center gap-1 opacity-80"><Loader2 size={14} className="animate-spin" /> 更新中です...</span>
          ) : lastSavedAt ? (
            <span className="opacity-70">更新完了: {new Date(lastSavedAt).toLocaleTimeString()}</span>
          ) : null}
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <label className="text-sm">マイルストーン</label>
        <select
          className="border border-black/10 dark:border-white/10 rounded px-2 py-1 bg-transparent"
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
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm">説明 (任意)</label>
          <button
            type="button"
            className="text-xs px-2 py-1 border rounded"
            onClick={() => setShowDescOverlay(true)}
          >
            説明欄を拡大
          </button>
        </div>
        <WysiwygEditor value={desc} onChange={(html) => { setDesc(html); setTimeout(() => performSave(), 0); }} />
      </div>
      <div className="flex gap-2 items-center">
        <label className="text-sm">見積(ポモ数)</label>
        <input
          type="number"
          min={0}
          className="w-24 border border-black/10 dark:border-white/10 rounded px-2 py-1 bg-transparent"
          value={Number.isFinite(estimated) ? estimated : 0}
          onChange={(e) => setEstimated(parseInt(e.target.value || "0", 10))}
          onBlur={performSave}
        />
      </div>
      {type === "scheduled" && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-1 flex-wrap">
            {["日","月","火","水","木","金","土"].map((label, idx) => {
              const selected = scheduled?.daysOfWeek?.includes(idx) ?? false;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const setD = new Set(scheduled?.daysOfWeek ?? []);
                    if (setD.has(idx)) setD.delete(idx); else setD.add(idx);
                    setScheduled({ daysOfWeek: Array.from(setD).sort((a,b)=>a-b), dateRanges: scheduled?.dateRanges });
                    setTimeout(() => performSave(), 0);
                  }}
                  className={`px-2 py-1 rounded border text-sm ${selected ? "bg-foreground text-background" : "bg-transparent"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 items-center">
            <button type="button" onClick={toggleWeekend} className="text-xs underline opacity-80">
              土日トグル
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-xs opacity-70">大型連休などの期間</div>
            <div className="flex gap-2 items-center flex-wrap">
              <input
                type="date"
                className="border border-black/10 dark:border-white/10 rounded px-2 py-1 bg-transparent"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                onBlur={performSave}
              />
              <span>〜</span>
              <input
                type="date"
                className="border border-black/10 dark:border-white/10 rounded px-2 py-1 bg-transparent"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                onBlur={performSave}
              />
              <button
                type="button"
                className="px-2 py-1 rounded border text-xs"
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
                  setTimeout(() => performSave(), 0);
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
                        setTimeout(() => performSave(), 0);
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
      )}
      {type === "backlog" && (
        <div className="flex flex-col gap-2">
          <div className="text-xs opacity-70">実行日</div>
          <div className="flex gap-2 items-center flex-wrap">
            <input
              type="date"
              className="border border-black/10 dark:border-white/10 rounded px-2 py-1 bg-transparent"
              value={plannedDateInput}
              onChange={(e) => setPlannedDateInput(e.target.value)}
              onBlur={() => {
                if (!plannedDateInput) return;
                const dt = new Date(plannedDateInput);
                if (isNaN(dt.getTime())) return;
                const stamp = Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
                if (!plannedDates.includes(stamp)) setPlannedDates((arr) => [...arr, stamp].sort());
                setPlannedDateInput("");
                setTimeout(() => performSave(), 0);
              }}
            />
            <button
              type="button"
              className="px-2 py-1 rounded border text-xs"
              onClick={() => {
                if (!plannedDateInput) return;
                const dt = new Date(plannedDateInput);
                if (isNaN(dt.getTime())) return;
                const stamp = Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
                if (!plannedDates.includes(stamp)) setPlannedDates((arr) => [...arr, stamp].sort());
                setPlannedDateInput("");
              }}
            >
              追加
            </button>
          </div>
          {plannedDates.length > 0 && (
            <div className="flex flex-col gap-1 text-xs">
              {plannedDates.map((d) => (
                <div key={d} className="flex items-center gap-2">
                  <span>{new Date(d).toLocaleDateString()}</span>
                  <button
                    type="button"
                    className="underline opacity-70"
                    onClick={() => {
                      setPlannedDates((arr) => arr.filter((x) => x !== d));
                      setTimeout(() => performSave(), 0);
                    }}
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
        <button type="button" className="px-3 py-1 rounded border text-sm" onClick={() => { performSave(); setTimeout(()=>{ if (onSubmitted) onSubmitted('keep'); }, 0); }}>続けて追加する</button>
        <button type="submit" className="px-3 py-1 rounded bg-foreground text-background text-sm">追加</button>
      </div>
    </form>
    {showDescOverlay && (
      <div
        className="fixed inset-0 z-50 bg-black/60"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            performSave();
            setShowDescOverlay(false);
          }
        }}
      >
        <div className="absolute inset-0 bg-background text-foreground flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end px-4 py-3 border-b border-black/10 dark:border-white/10">
            <div className="flex items-center gap-3 text-xs">
              {isSaving ? (
                <span className="opacity-80">更新中です...</span>
              ) : lastSavedAt ? (
                <span className="opacity-70">更新完了: {new Date(lastSavedAt).toLocaleTimeString()}</span>
              ) : null}
              <button
                type="button"
                className="p-2 rounded border hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => { performSave(); setShowDescOverlay(false); }}
                aria-label="閉じる"
                title="閉じる"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 p-6">
            <div className="h-full min-h-0 w-full">
              <WysiwygEditor
                value={desc}
                onChange={(html) => { setDesc(html); setTimeout(() => performSave(), 0); }}
                onBlur={() => performSave()}
                heightClass="h-full"
              />
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}


