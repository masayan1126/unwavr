import type { Task } from "@/lib/types";

export function getTodayUtc(): number {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function isOverdue(task: Task, todayUtc: number = getTodayUtc()): boolean {
  if (task.completed) return false;
  if (task.type === "daily") return false;
  if (task.type === "scheduled") {
    const ranges = task.scheduled?.dateRanges ?? [];
    if (ranges.length === 0) return false;
    return ranges.some((r) => r.end < todayUtc);
  }
  if (task.type === "backlog") {
    const planned = task.plannedDates ?? [];
    if (planned.length === 0) return false;
    const latest = Math.max(...planned);
    return latest < todayUtc;
  }
  return false;
}

export function getEarliestExecutionDate(task: Task): number | null {
  if (task.type === "daily") return null;
  if (task.type === "scheduled") {
    const ranges = task.scheduled?.dateRanges ?? [];
    if (ranges.length === 0) return null;
    return Math.min(...ranges.map((r) => r.start));
  }
  if (task.type === "backlog") {
    const planned = task.plannedDates ?? [];
    if (planned.length === 0) return null;
    return Math.min(...planned);
  }
  return null;
}


