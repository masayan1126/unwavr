"use client";
import Link from "next/link";
import TaskList from "@/components/TaskList";
import { useAppStore } from "@/lib/store";

export default function ScheduledTasksPage() {
  const tasks = useAppStore((s) => s.tasks);
  const scheduled = tasks.filter((t) => t.type === "scheduled");
  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">特定の日・曜日だけ積み上げ</h1>
        <Link className="text-sm underline opacity-80" href="/tasks/new">タスク追加</Link>
      </div>
      <TaskList title="特定の日/曜日" tasks={scheduled} tableMode showCreatedColumn={false} showPlannedColumn={false} showScheduledColumn showTypeColumn showMilestoneColumn={false} />
    </div>
  );
}


