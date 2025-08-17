"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { X, AlertTriangle } from "lucide-react";

function getTodayUtc(): number {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function isOverdue(task: Task): boolean {
  const todayUtc = getTodayUtc();
  if (task.completed) return false;
  if (task.type === "daily") return false;
  if (task.type === "scheduled") {
    const ranges = task.scheduled?.dateRanges ?? [];
    if (ranges.length === 0) return false;
    // いずれかの期間が今日より前に終了
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

export default function OverdueNotificationBar() {
  const tasks = useAppStore((s) => s.tasks);
  const [isClient, setIsClient] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("overdue-notification-visible");
    if (saved === null) setIsVisible(true);
    else setIsVisible(saved !== "false");
  }, []);

  const overdue = useMemo(() => tasks.filter((t) => isOverdue(t)), [tasks]);
  const preview = overdue.slice(0, 3);

  if (!isClient || !isVisible || overdue.length === 0) return null;

  return (
    <div className="bg-amber-50/95 dark:bg-amber-900/20 backdrop-blur-sm border-b border-amber-200 dark:border-amber-700">
      <div className="px-6 sm:px-10 py-2 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <AlertTriangle size={14} className="flex-shrink-0" />
            <span className="text-xs font-medium">期限切れのタスク</span>
          </div>
          <div className="flex items-center gap-2 text-xs flex-1 overflow-x-auto scrollbar-hide">
            {preview.map((t) => (
              <span key={t.id} className="flex-shrink-0 bg-amber-100 dark:bg-amber-800/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700 rounded-md px-2 py-0.5 truncate max-w-40" title={t.title}>
                {t.title}
              </span>
            ))}
            {overdue.length > preview.length && (
              <span className="text-amber-800 dark:text-amber-200">+{overdue.length - preview.length}件</span>
            )}
            <Link href="/tasks/incomplete" className="underline text-amber-700 dark:text-amber-300 whitespace-nowrap">
              未完了一覧を見る
            </Link>
          </div>
          <button
            onClick={() => { setIsVisible(false); localStorage.setItem("overdue-notification-visible", "false"); }}
            className="flex-shrink-0 p-1 rounded-md hover:bg-amber-100 dark:hover:bg-amber-800/40 transition-colors text-amber-700 dark:text-amber-300"
            title="通知を閉じる"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <style jsx>{`
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}


