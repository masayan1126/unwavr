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
                 bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30
                 dark:bg-[var(--warning)]/20 dark:text-[var(--warning)] dark:border-[var(--warning)]/30 hover:bg-[var(--warning)]/15 dark:hover:bg-[var(--warning)]/25 transition-colors"
      role="status"
      aria-live="polite"
    >
      期限切れのタスクが {overdue.length} 件あります。クリックして一覧を見る
    </Link>
  );
}


