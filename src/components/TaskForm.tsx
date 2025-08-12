"use client";
import { useEffect, useRef, useState } from "react";
import { Scheduled, TaskType } from "@/lib/types";
import { useAppStore } from "@/lib/store";

export default function TaskForm() {
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
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<null | (SpeechRecognition & { start: () => void; stop: () => void })>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec: SpeechRecognition = new SR();
    rec.lang = "ja-JP";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const txt = e.results?.[0]?.[0]?.transcript ?? "";
      if (txt) setTitle((prev) => (prev ? prev + " " + txt : txt));
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec as any;
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      description: desc || undefined,
      type,
      scheduled,
      estimatedPomodoros: estimated || 0,
      milestoneId: milestoneId || undefined,
    });
    setTitle("");
    setDesc("");
    setEstimated(0);
    setScheduled(undefined);
    setMilestoneId("");
    setType("daily");
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
    <form onSubmit={onSubmit} className="flex flex-col gap-2 border border-black/10 dark:border-white/10 p-3 rounded-md w-full">
      <div className="flex gap-2 items-center">
        <input
          className={`flex-1 border border-black/10 dark:border-white/10 rounded px-2 py-1 bg-transparent ${listening ? "ring-2 ring-red-500/60" : ""}`}
          placeholder="タスク名"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
          }}
        >
          <option value="daily">毎日</option>
          <option value="backlog">不定期（バックログ）</option>
          <option value="scheduled">曜日/連休</option>
        </select>
      </div>
      <div className="flex gap-2 items-center">
        <label className="text-sm">マイルストーン</label>
        <select
          className="border border-black/10 dark:border-white/10 rounded px-2 py-1 bg-transparent"
          value={milestoneId}
          onChange={(e) => setMilestoneId(e.target.value)}
        >
          <option value="">未選択</option>
          {milestones.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title} ({m.currentUnits}/{m.targetUnits})
            </option>
          ))}
        </select>
      </div>
      <input
        className="border border-black/10 dark:border-white/10 rounded px-2 py-1 bg-transparent"
        placeholder="説明 (任意)"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      <div className="flex gap-2 items-center">
        <label className="text-sm">見積(ポモ数)</label>
        <input
          type="number"
          min={0}
          className="w-24 border border-black/10 dark:border-white/10 rounded px-2 py-1 bg-transparent"
          value={Number.isFinite(estimated) ? estimated : 0}
          onChange={(e) => setEstimated(parseInt(e.target.value || "0", 10))}
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
              />
              <span>〜</span>
              <input
                type="date"
                className="border border-black/10 dark:border-white/10 rounded px-2 py-1 bg-transparent"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
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
      )}
      <div className="flex justify-end">
        <button type="submit" className="px-3 py-1 rounded bg-foreground text-background text-sm">追加</button>
      </div>
    </form>
  );
}


