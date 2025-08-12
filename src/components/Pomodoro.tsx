"use client";
import { usePomodoro } from "@/hooks/usePomodoro";

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
  const { s, start, stop, reset, setSettings } = usePomodoro();
  const activeTaskId = s.activeTaskId;

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
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <label className="flex items-center justify-between gap-2 border rounded px-2 py-1">
          <span>作業(分)</span>
          <input
            type="number"
            min={1}
            max={120}
            value={Math.round(s.workDurationSec / 60)}
            onChange={(e) => setSettings({ workDurationSec: Math.max(1, Number(e.target.value)) * 60 })}
            className="w-16 bg-transparent text-right outline-none"
          />
        </label>
        <label className="flex items-center justify-between gap-2 border rounded px-2 py-1">
          <span>休憩(分)</span>
          <input
            type="number"
            min={1}
            max={60}
            value={Math.round(s.shortBreakSec / 60)}
            onChange={(e) => setSettings({ shortBreakSec: Math.max(1, Number(e.target.value)) * 60 })}
            className="w-16 bg-transparent text-right outline-none"
          />
        </label>
        <label className="flex items-center justify-between gap-2 border rounded px-2 py-1">
          <span>ロング(分)</span>
          <input
            type="number"
            min={1}
            max={120}
            value={Math.round(s.longBreakSec / 60)}
            onChange={(e) => setSettings({ longBreakSec: Math.max(1, Number(e.target.value)) * 60 })}
            className="w-16 bg-transparent text-right outline-none"
          />
        </label>
        <label className="flex items-center justify-between gap-2 border rounded px-2 py-1">
          <span>ロング間隔</span>
          <input
            type="number"
            min={1}
            max={10}
            value={s.cyclesUntilLongBreak}
            onChange={(e) => setSettings({ cyclesUntilLongBreak: Math.max(1, Number(e.target.value)) })}
            className="w-16 bg-transparent text-right outline-none"
          />
        </label>
      </div>
    </div>
  );
}


