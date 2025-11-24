"use client";
import TaskList from "@/components/TaskList";
import { useAppStore } from "@/lib/store";
import WeekendPageSkeleton from "@/components/WeekendPageSkeleton";

export default function IncompleteTasksPage() {
  const tasks = useAppStore((s) => s.tasks);
  const hydrating = useAppStore((s) => s.hydrating);
  const incomplete = tasks.filter((t) => !t.completed);

  if (hydrating) {
    return <WeekendPageSkeleton />;
  }

  return (
    <div className="p-6 sm:p-10 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">未完了タスク</h1>
      <section className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm">
        <TaskList title="未完了" tasks={incomplete} tableMode showCreatedColumn={false} showPlannedColumn showTypeColumn />
      </section>
    </div>
  );
}
