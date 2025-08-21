"use client";
import Link from "next/link";
import TaskList from "@/components/TaskList";
import { useAppStore } from "@/lib/store";
import SectionLoader from "@/components/SectionLoader";

export default function DailyTasksPage() {
  const tasks = useAppStore((s) => s.tasks);
  const hydrating = useAppStore((s) => s.hydrating);
  const daily = tasks.filter((t) => t.type === "daily");
  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">毎日積み上げ</h1>
        <Link className="text-sm underline opacity-80" href="/tasks/new">タスク追加</Link>
      </div>
      {hydrating ? (
        <SectionLoader label="毎日タスクを読み込み中..." lines={5} />
      ) : (
        <TaskList title="毎日積み上げ" tasks={daily} tableMode showCreatedColumn={false} showPlannedColumn={false} showTypeColumn showMilestoneColumn={false} />
      )}
    </div>
  );
}


