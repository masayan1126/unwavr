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
      className="group flex items-center justify-between px-4 py-3 mx-4 mt-4 rounded-lg bg-rose-500 text-white shadow-md hover:shadow-lg hover:bg-rose-600 transition-all duration-200"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <AlertCircle size={18} className="shrink-0 text-white" />
        <span className="text-sm font-medium">
          期限切れのタスクが <span className="font-bold text-white">{overdue.length}</span> 件あります
        </span>
      </div>
      <div className="flex items-center gap-1 text-xs font-medium text-white/90 group-hover:text-white group-hover:translate-x-1 transition-all">
        一覧を見る
        <ArrowRight size={14} />
      </div>
    </Link>
  );
}


