"use client";
import Link from "next/link";
import TaskList from "@/components/TaskList";
import { useAppStore } from "@/lib/store";
import SectionLoader from "@/components/SectionLoader";

export default function ScheduledTasksPage() {
  const tasks = useAppStore((s) => s.tasks);
  const hydrating = useAppStore((s) => s.hydrating);
  const scheduled = tasks.filter((t) => t.type === "scheduled");
  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">特定の日・曜日だけ積み上げ</h1>
        <Link className="text-sm underline opacity-80" href="/tasks/new">タスク追加</Link>
      </div>
      {hydrating ? (
        <SectionLoader label="特定日タスクを読み込み中..." lines={5} />
      ) : (
        <TaskList title="特定の日/曜日" tasks={scheduled} tableMode showCreatedColumn={false} showPlannedColumn={false} showScheduledColumn showTypeColumn showMilestoneColumn={false} />
      )}
    </div>
  );
}


