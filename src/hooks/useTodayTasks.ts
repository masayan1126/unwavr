"use client";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { isTaskForToday } from "@/lib/types";
import { isOverdue } from "@/lib/taskUtils";

function isDailyDoneToday(dailyDoneDates?: number[]) {
  const now = new Date();
  // ローカル日付の 00:00:00 を基準にする（ユーザー体験に合わせる）
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  // 互換性のため、過去のUTC基準データも許容
  const utc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Boolean(dailyDoneDates && (dailyDoneDates.includes(local) || dailyDoneDates.includes(utc)));
}

export function useTodayTasks() {
  const tasks = useAppStore((s) => s.tasks);
  // 日付が変わったら強制的に再評価するためのトリガ
  const [dateTick, setDateTick] = useState(0);
  // 次のローカル日付0時に再評価（以降も毎日）
  useEffect(() => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1, 0);
    const delay = Math.max(1000, next.getTime() - now.getTime());
    const timer = setTimeout(() => setDateTick((v) => v + 1), delay);
    return () => clearTimeout(timer);
  }, [dateTick]);

  const [showIncomplete, setShowIncomplete] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [filterDaily, setFilterDaily] = useState(true);
  const [filterScheduled, setFilterScheduled] = useState(true);
  const [filterBacklog, setFilterBacklog] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  function isBacklogPlannedToday(plannedDates?: number[]): boolean {
    if (!plannedDates || plannedDates.length === 0) return false;
    // ローカル日付ベースで「今日の範囲 [00:00, 24:00)」に入っていれば今日扱い
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const end = start + 24 * 60 * 60 * 1000; // 24:00 の瞬間は含めない
    return plannedDates.some((rawTs) => {
      const tsMs = rawTs < 1e12 ? rawTs * 1000 : rawTs;
      return tsMs >= start && tsMs < end;
    });
  }

  const tasksForToday = useMemo(() => {
    // dateTickを参照して0時で再評価
    void dateTick;
    return tasks.filter((t) => {
      if (t.archived === true) return false;
      if (t.type === "backlog") return isBacklogPlannedToday(t.plannedDates);
      return isTaskForToday(t);
    });
  }, [tasks, dateTick]);

  const dailyForToday = useMemo(() => { void dateTick; return tasksForToday.filter((t) => t.type === "daily"); }, [tasksForToday, dateTick]);
  const scheduledForToday = useMemo(() => { void dateTick; return tasksForToday.filter((t) => t.type === "scheduled"); }, [tasksForToday, dateTick]);
  const backlogForToday = useMemo(() => { void dateTick; return tasksForToday.filter((t) => t.type === "backlog"); }, [tasksForToday, dateTick]);

  const dailyPending = useMemo(() => { void dateTick; return dailyForToday.filter((t) => !isDailyDoneToday(t.dailyDoneDates)); }, [dailyForToday, dateTick]);
  const dailyDone = useMemo(() => { void dateTick; return dailyForToday.filter((t) => isDailyDoneToday(t.dailyDoneDates)); }, [dailyForToday, dateTick]);
  const scheduledPending = useMemo(() => { void dateTick; return scheduledForToday.filter((t) => !t.completed); }, [scheduledForToday, dateTick]);
  const scheduledDone = useMemo(() => { void dateTick; return scheduledForToday.filter((t) => t.completed); }, [scheduledForToday, dateTick]);
  const backlogPending = useMemo(() => { void dateTick; return backlogForToday.filter((t) => !t.completed); }, [backlogForToday, dateTick]);
  const backlogDone = useMemo(() => { void dateTick; return backlogForToday.filter((t) => t.completed); }, [backlogForToday, dateTick]);

  const incompleteToday = useMemo(() => {
    const now = new Date();
    const todayLocalMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const combined = [
      ...(filterDaily ? dailyPending : []),
      ...(filterScheduled ? scheduledPending : []),
      ...(filterBacklog ? backlogPending : []),
    ];
    // 期限切れはダッシュボード未完了一覧から除外
    return combined.filter((t) => !isOverdue(t, todayLocalMidnight));
  }, [dailyPending, scheduledPending, backlogPending, filterDaily, filterScheduled, filterBacklog]);
  const dailyDoneFiltered = useMemo(() => (filterDaily ? dailyDone : []), [dailyDone, filterDaily]);
  const scheduledDoneFiltered = useMemo(() => (filterScheduled ? scheduledDone : []), [scheduledDone, filterScheduled]);
  const backlogDoneFiltered = useMemo(() => (filterBacklog ? backlogDone : []), [backlogDone, filterBacklog]);

  const resetFilters = () => {
    setShowIncomplete(true);
    setShowCompleted(true);
    setFilterDaily(true);
    setFilterScheduled(true);
    setFilterBacklog(true);
  };

  return {
    // lists
    incompleteToday,
    dailyDoneFiltered,
    scheduledDoneFiltered,
    backlogDoneFiltered,
    // filter states
    filterOpen,
    setFilterOpen,
    showIncomplete,
    setShowIncomplete,
    showCompleted,
    setShowCompleted,
    filterDaily,
    setFilterDaily,
    filterScheduled,
    setFilterScheduled,
    filterBacklog,
    setFilterBacklog,
    resetFilters,
  };
}


