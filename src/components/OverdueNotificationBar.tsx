"use client";
import React from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { isOverdue } from "@/lib/taskUtils";
import { AlertCircle, ArrowRight } from "lucide-react";

export default function OverdueNotificationBar() {
  const tasks = useAppStore((s) => s.tasks);
  const now = new Date();
  const todayLocalMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const overdue = tasks.filter((t) => isOverdue(t, todayLocalMidnight));
  if (overdue.length === 0) return null;
  return (
    <Link
      href={{ pathname: "/tasks/overdue" }}
      className="group flex items-center justify-between px-4 py-2 mx-4 mt-4 rounded-md bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 shadow-sm hover:shadow transition-all duration-200"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <AlertCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
        <span className="text-xs font-medium">
          期限切れのタスクが <span className="font-bold">{overdue.length}</span> 件あります
        </span>
      </div>
      <div className="flex items-center gap-1 text-[10px] font-medium opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
        一覧を見る
        <ArrowRight size={12} />
      </div>
    </Link>
  );
}


