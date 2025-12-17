"use client";
import TaskList from "@/components/TaskList";
import { useAppStore } from "@/lib/store";

export default function IncompleteTasksPage() {
  const tasks = useAppStore((s) => s.tasks);
  const hydrating = useAppStore((s) => s.hydrating);
  const incomplete = tasks.filter((t) => !t.completed);

  return (
    <div className="p-6 sm:p-10 max-w-[1400px] mx-auto flex flex-col gap-4">
      <h1 className="text-xl font-semibold mb-4">未完了タスク</h1>
      <section className="bg-background rounded-xl p-5 shadow-sm">
        {hydrating ? (
          <div className="space-y-2">
            <div className="text-sm font-medium mb-4">未完了</div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <TaskList title="未完了" tasks={incomplete} showCreatedColumn={false} showPlannedColumn showTypeColumn />
        )}
      </section>
    </div>
  );
}
