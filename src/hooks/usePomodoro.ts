"use client";
import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export function usePomodoro() {
  const s = useAppStore((st) => st.pomodoro);
  const start = useAppStore((st) => st.startPomodoro);
  const stop = useAppStore((st) => st.stopPomodoro);
  const tick = useAppStore((st) => st.tickPomodoro);
  const reset = useAppStore((st) => st.resetPomodoro);
  const setSettings = useAppStore((st) => st.setPomodoroSettings);

  useEffect(() => {
    if (!s.isRunning) return;
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [s.isRunning, tick]);

  return { s, start, stop, tick, reset, setSettings };
}


