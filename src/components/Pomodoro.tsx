"use client";
import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

function format(sec: number): string {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function Pomodoro() {
  const s = useAppStore((st) => st.pomodoro);
  const start = useAppStore((st) => st.startPomodoro);
  const stop = useAppStore((st) => st.stopPomodoro);
  const tick = useAppStore((st) => st.tickPomodoro);
  const reset = useAppStore((st) => st.resetPomodoro);
  const activeTaskId = useAppStore((st) => st.pomodoro.activeTaskId);

  useEffect(() => {
    if (!s.isRunning) return;
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [s.isRunning, tick]);

  return (
    <div className="border border-black/10 dark:border-white/10 rounded-md p-3">
      <div className="text-xs uppercase tracking-wide opacity-70 mb-2">ポモドーロ</div>
      <div className="text-4xl font-bold tabular-nums mb-2">{format(s.secondsLeft)}</div>
      <div className="text-xs mb-3 opacity-70">
        モード: {s.isBreak ? "休憩" : "作業"} / セッション: {s.completedWorkSessions}
        {activeTaskId && <span className="ml-2">(タスク選択中)</span>}
      </div>
      <div className="flex gap-2 items-center mb-3">
        {!s.isRunning ? (
          <button className="px-3 py-1 rounded bg-foreground text-background text-sm" onClick={() => start()}>
            スタート
          </button>
        ) : (
          <button className="px-3 py-1 rounded bg-foreground text-background text-sm" onClick={() => stop()}>
            ストップ
          </button>
        )}
        <button className="px-3 py-1 rounded border text-sm" onClick={() => reset()}>
          リセット
        </button>
        <button className="px-3 py-1 rounded border text-sm" onClick={() => start(false)}>
          作業開始
        </button>
        <button className="px-3 py-1 rounded border text-sm" onClick={() => start(true)}>
          休憩開始
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          作業: {Math.round(s.workDurationSec / 60)}分 / 休憩: {Math.round(s.shortBreakSec / 60)}分
        </div>
        <div>ロング休憩: {Math.round(s.longBreakSec / 60)}分 / 周期: {s.cyclesUntilLongBreak}</div>
      </div>
    </div>
  );
}


