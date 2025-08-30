"use client";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Play, Coffee, Pause } from "lucide-react";

function format(sec: number): string {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function PomodoroTopBar() {
  const p = useAppStore((s) => s.pomodoro);
  const start = useAppStore((s) => s.startPomodoro);
  const stop = useAppStore((s) => s.stopPomodoro);
  const reset = useAppStore((s) => s.resetPomodoro);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(p.isRunning);
  }, [p.isRunning]);

  const label = useMemo(() => (p.isBreak ? "休憩" : "作業"), [p.isBreak]);

  if (!visible) return null;

  return (
    <div className="sticky top-0 z-[60] w-full bg-amber-50/95 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 backdrop-blur supports-[backdrop-filter]:bg-amber-50/70 dark:supports-[backdrop-filter]:bg-amber-900/10">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-2 flex items-center gap-3">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          {p.isBreak ? <Coffee size={14} /> : <Play size={14} />}
          <span className="text-xs font-semibold">ポモドーロ中</span>
        </div>
        <div className="text-xs tabular-nums">
          <span className="px-1 py-0.5 rounded border border-amber-300/70 dark:border-amber-700/70 mr-2">{label}</span>
          <span className="font-mono">{format(p.secondsLeft)}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {p.isRunning ? (
            <button className="px-2 py-1 rounded border text-xs" onClick={() => stop()} title="一時停止">
              <Pause size={12} />
            </button>
          ) : (
            <button className="px-2 py-1 rounded border text-xs" onClick={() => start(p.isBreak)} title="再開">
              <Play size={12} />
            </button>
          )}
          <button className="px-2 py-1 rounded border text-xs" onClick={() => reset()} title="リセット">リセット</button>
        </div>
      </div>
    </div>
  );
}


