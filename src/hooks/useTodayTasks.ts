"use client";
import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { isTaskForToday, Task } from "@/lib/types";

function isDailyDoneToday(dailyDoneDates?: number[]) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  const today = d.getTime();
  return Boolean(dailyDoneDates && dailyDoneDates.includes(today));
}

function isBacklogPlannedForToday(task: Task) {
  const d = new Date();
  const todayUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return (task.plannedDates ?? []).includes(todayUtc);
}

export function useTodayTasks() {
  const tasks = useAppStore((s) => s.tasks);

  const [showIncomplete, setShowIncomplete] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [filterDaily, setFilterDaily] = useState(true);
  const [filterScheduled, setFilterScheduled] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const tasksForToday = useMemo(
    () =>
      tasks.filter((t) => {
        if (t.type === "backlog") return isBacklogPlannedForToday(t);
        return isTaskForToday(t);
      }),
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

  const incompleteToday = useMemo(
    () => [...(filterDaily ? dailyPending : []), ...(filterScheduled ? scheduledPending : []), ...backlogPending],
    [dailyPending, scheduledPending, backlogPending, filterDaily, filterScheduled]
  );
  const dailyDoneFiltered = useMemo(() => (filterDaily ? dailyDone : []), [dailyDone, filterDaily]);
  const scheduledDoneFiltered = useMemo(() => (filterScheduled ? scheduledDone : []), [scheduledDone, filterScheduled]);

  const resetFilters = () => {
    setShowIncomplete(true);
    setShowCompleted(true);
    setFilterDaily(true);
    setFilterScheduled(true);
  };

  return {
    // lists
    incompleteToday,
    dailyDoneFiltered,
    scheduledDoneFiltered,
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
    resetFilters,
  };
}


