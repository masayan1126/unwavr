"use client";
import { useEffect, useRef, useState } from "react";
import { usePomodoro } from "@/hooks/usePomodoro";
import { NoticeToast } from "@/components/Toast";

// デフォルト値（SSR用）
const DEFAULT_SECONDS = 25 * 60;
const DEFAULT_WORK_DURATION = 25 * 60;
const DEFAULT_SHORT_BREAK = 5 * 60;
const DEFAULT_LONG_BREAK = 15 * 60;
const DEFAULT_CYCLES = 4;

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
  const [toastQueue, setToastQueue] = useState<string[]>([]);
  const prevCompletedRef = useRef<number>(s.completedWorkSessions);
  const audioRef = useRef<AudioContext | null>(null);
  const prevIsBreakForSoundRef = useRef<boolean>(s.isBreak);

  // Hydration mismatch回避: マウント状態を追跡
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // SSR/初期表示用の値（マウント完了後は実際の値を使用）
  const displaySecondsLeft = isMounted ? s.secondsLeft : DEFAULT_SECONDS;
  const displayWorkDuration = isMounted ? s.workDurationSec : DEFAULT_WORK_DURATION;
  const displayShortBreak = isMounted ? s.shortBreakSec : DEFAULT_SHORT_BREAK;
  const displayLongBreak = isMounted ? s.longBreakSec : DEFAULT_LONG_BREAK;
  const displayCycles = isMounted ? s.cyclesUntilLongBreak : DEFAULT_CYCLES;
  const displayIsBreak = isMounted ? s.isBreak : false;
  const displayIsRunning = isMounted ? s.isRunning : false;
  const displayCompletedSessions = isMounted ? s.completedWorkSessions : 0;
  const displayActiveTaskId = isMounted ? activeTaskId : undefined;

  const ensureAudio = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      if (audioRef.current.state === 'suspended') {
        void audioRef.current.resume();
      }
    } catch { }
  };

  const playPattern = (freqs: number[]) => {
    const ctx = audioRef.current;
    if (!ctx || ctx.state !== 'running') return;
    let t = ctx.currentTime;
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.01);
      gain.gain.linearRampToValueAtTime(0.0, t + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
      t += 0.22;
    }
  };

  // 休憩終了（作業再開）を検知して別音を再生
  useEffect(() => {
    if (!s.isRunning) {
      prevIsBreakForSoundRef.current = s.isBreak;
      return;
    }
    const changed = prevIsBreakForSoundRef.current !== s.isBreak;
    if (changed) {
      try {
        ensureAudio();
        // break -> work に切り替わった時のみ鳴らす（作業再開サウンド）
        if (!s.isBreak) {
          // 明瞭な上昇3連（作業再開）
          playPattern([1200, 1400, 1600]);
        }
      } catch { }
      prevIsBreakForSoundRef.current = s.isBreak;
    }
  }, [s.isBreak, s.isRunning]);

  // 作業セッションの終了ごとにトースト（タブ不在で複数回進んだ場合にも対応）
  useEffect(() => {
    const prev = prevCompletedRef.current;
    const curr = s.completedWorkSessions;
    if (!s.isRunning || curr <= prev) {
      prevCompletedRef.current = curr;
      return;
    }
    const diff = curr - prev;
    const messages: string[] = [];
    for (let i = 1; i <= diff; i++) {
      const count = prev + i;
      const isLong = count % s.cyclesUntilLongBreak === 0;
      messages.push(`作業セッション終了（合計 ${count} 回）。${isLong ? "ロング休憩" : "休憩"}を始めましょう。`);
    }
    setToastQueue((q) => [...q, ...messages]);
    // 音を鳴らす（差分回数分）
    try {
      const isLong = curr % s.cyclesUntilLongBreak === 0;
      ensureAudio();
      // ロング休憩: 低め3連、通常: 高め3連
      const pattern = isLong ? [440, 392, 349] : [880, 988, 1047];
      // diffが複数でも聴覚的にわかるように繰り返し
      for (let i = 0; i < diff; i++) {
        playPattern(pattern);
      }
    } catch { }
    prevCompletedRef.current = curr;
  }, [s.completedWorkSessions, s.cyclesUntilLongBreak, s.isRunning]);

  return (
    <div className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm">
      {toastQueue.length > 0 && (
        <NoticeToast
          message={toastQueue[0]}
          onClose={() => setToastQueue((q) => q.slice(1))}
          durationMs={4000}
          position="top"
        />
      )}
      <div className="text-xs uppercase tracking-wide opacity-70 mb-2">ポモドーロ</div>
      <div className="text-4xl font-bold tabular-nums mb-2">{format(displaySecondsLeft)}</div>
      <div className="text-xs mb-3 opacity-70">
        モード: {displayIsBreak ? "休憩" : "作業"} / セッション: {displayCompletedSessions}
        {displayActiveTaskId && <span className="ml-2">(タスク選択中)</span>}
      </div>
      <div className="flex gap-2 items-center mb-3">
        {!displayIsRunning ? (
          <button className="px-3 py-1 rounded bg-foreground text-background text-sm" onClick={() => { ensureAudio(); start(); }}>
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
        <button className="px-3 py-1 rounded border text-sm" onClick={() => { ensureAudio(); start(false); }}>
          作業開始
        </button>
        <button className="px-3 py-1 rounded border text-sm" onClick={() => { ensureAudio(); start(true); }}>
          休憩開始
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          作業: {Math.round(displayWorkDuration / 60)}分 / 休憩: {Math.round(displayShortBreak / 60)}分
        </div>
        <div>ロング休憩: {Math.round(displayLongBreak / 60)}分 / 周期: {displayCycles}</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <label className="flex items-center justify-between gap-2 border rounded px-2 py-1">
          <span>作業(分)</span>
          <input
            type="number"
            min={1}
            max={120}
            value={Math.round(displayWorkDuration / 60)}
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
            value={Math.round(displayShortBreak / 60)}
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
            value={Math.round(displayLongBreak / 60)}
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
            value={displayCycles}
            onChange={(e) => setSettings({ cyclesUntilLongBreak: Math.max(1, Number(e.target.value)) })}
            className="w-16 bg-transparent text-right outline-none"
          />
        </label>
      </div>
    </div>
  );
}


