"use client";
import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { isTaskForToday } from "@/lib/types";

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

  const [showIncomplete, setShowIncomplete] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [filterDaily, setFilterDaily] = useState(true);
  const [filterScheduled, setFilterScheduled] = useState(true);
  const [filterBacklog, setFilterBacklog] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const tasksForToday = useMemo(
    () => tasks.filter((t) => isTaskForToday(t)),
    [tasks]
  );

  const dailyForToday = useMemo(() => tasksForToday.filter((t) => t.type === "daily"), [tasksForToday]);
  const scheduledForToday = useMemo(() => tasksForToday.filter((t) => t.type === "scheduled"), [tasksForToday]);
  const backlogForToday = useMemo(() => tasksForToday.filter((t) => t.type === "backlog"), [tasksForToday]);

  const dailyPending = useMemo(() => dailyForToday.filter((t) => !isDailyDoneToday(t.dailyDoneDates)), [dailyForToday]);
  const dailyDone = useMemo(() => dailyForToday.filter((t) => isDailyDoneToday(t.dailyDoneDates)), [dailyForToday]);
  const scheduledPending = useMemo(() => scheduledForToday.filter((t) => !t.completed), [scheduledForToday]);
  const scheduledDone = useMemo(() => scheduledForToday.filter((t) => t.completed), [scheduledForToday]);
  const backlogPending = useMemo(() => backlogForToday.filter((t) => !t.completed), [backlogForToday]);
  const backlogDone = useMemo(() => backlogForToday.filter((t) => t.completed), [backlogForToday]);

  const incompleteToday = useMemo(
    () => [...(filterDaily ? dailyPending : []), ...(filterScheduled ? scheduledPending : []), ...(filterBacklog ? backlogPending : [])],
    [dailyPending, scheduledPending, backlogPending, filterDaily, filterScheduled, filterBacklog]
  );
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


