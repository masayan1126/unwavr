"use client";
import TaskList from "@/components/TaskList";
import { useAppStore } from "@/lib/store";
import { isOverdue } from "@/lib/taskUtils";
import Link from "next/link";

export default function OverdueTasksPage() {
  const tasks = useAppStore((s) => s.tasks);
  const hydrating = useAppStore((s) => s.hydrating);
  const now = new Date();
  const todayLocalMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const overdue = tasks.filter((t) => isOverdue(t, todayLocalMidnight));

  return (
    <div className="p-6 sm:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">期限切れタスク</h1>
        <Link className="text-sm underline opacity-80" href="/">ホーム</Link>
      </div>
      {hydrating ? (
        <div>読み込み中...</div>
      ) : (
        <TaskList title="期限切れ" tasks={overdue} tableMode showCreatedColumn showPlannedColumn showTypeColumn />
      )}
    </div>
  );
}


