"use client";
import Link from "next/link";
import { useMemo } from "react";
import TaskList from "@/components/TaskList";
import { useAppStore } from "@/lib/store";
import { isTaskForToday } from "@/lib/types";

export default function TodayPage() {
  const tasks = useAppStore((s) => s.tasks);
  const today = useMemo(() => tasks.filter((t) => isTaskForToday(t)), [tasks]);
  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">今日のタスク</h1>
        <Link className="text-sm underline opacity-80" href="/">
          ホーム
        </Link>
      </div>
      <TaskList title="今日やる" tasks={today} />
    </div>
  );
}


