"use client";
import React from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { isOverdue } from "@/lib/taskUtils";

export default function OverdueNotificationBar() {
  const tasks = useAppStore((s) => s.tasks);
  const now = new Date();
  const todayLocalMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const overdue = tasks.filter((t) => isOverdue(t, todayLocalMidnight));
  if (overdue.length === 0) return null;
  return (
    <Link
      href={{ pathname: "/tasks/overdue" }}
      className="block px-4 py-2 text-sm border rounded-md 
                 bg-amber-50 text-amber-900 border-amber-200
                 dark:bg-amber-900/20 dark:text-amber-100 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
      role="status"
      aria-live="polite"
    >
      期限切れのタスクが {overdue.length} 件あります。クリックして一覧を見る
    </Link>
  );
}


