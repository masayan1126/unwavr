"use client";
import React from "react";
import { useAppStore } from "@/lib/store";

export default function OverdueNotificationBar() {
  const tasks = useAppStore((s) => s.tasks);
  const overdue = tasks.filter((t) => t.plannedDates && t.plannedDates.some((d) => d < Date.now()) && !t.completed);
  if (overdue.length === 0) return null;
  return (
    <div
      className="px-4 py-2 text-sm border rounded-md 
                 bg-amber-50 text-amber-900 border-amber-200
                 dark:bg-amber-900/20 dark:text-amber-100 dark:border-amber-700"
      role="status"
      aria-live="polite"
    >
      期限切れのタスクが {overdue.length} 件あります。
    </div>
  );
}


