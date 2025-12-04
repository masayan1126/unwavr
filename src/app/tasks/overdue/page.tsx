"use client";
import TaskList from "@/components/TaskList";
import { useAppStore } from "@/lib/store";
import { isOverdue } from "@/lib/taskUtils";
import Link from "next/link";
import WeekendPageSkeleton from "@/components/WeekendPageSkeleton";
import { useToast } from "@/components/Providers";
import { ArrowRight } from "lucide-react";

export default function OverdueTasksPage() {
  const tasks = useAppStore((s) => s.tasks);
  const moveTasksToToday = useAppStore((s) => s.moveTasksToToday);
  const hydrating = useAppStore((s) => s.hydrating);
  const toast = useToast();
  const now = new Date();
  const todayLocalMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const overdue = tasks.filter((t) => isOverdue(t, todayLocalMidnight));

  if (hydrating) {
    return <WeekendPageSkeleton />;
  }

  const handleMoveAll = () => {
    if (overdue.length === 0) return;
    const ids = overdue.map((t) => t.id);
    moveTasksToToday(ids);
    toast.show(`${ids.length}件のタスクを今日に移動しました`, 'success');
  };

  return (
    <div className="p-6 sm:p-10 max-w-[1400px] mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">期限切れタスク</h1>
        <div className="flex items-center gap-4">
          {overdue.length > 0 && (
            <button
              onClick={handleMoveAll}
              className="group relative inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md shadow-sm hover:bg-primary/90 hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <ArrowRight size={16} className="relative z-10 transition-transform group-hover:translate-x-0.5" />
              <span className="relative z-10">すべて今日やる</span>
            </button>
          )}
          <Link className="text-sm underline opacity-80" href="/">ホーム</Link>
        </div>
      </div>
      <TaskList title="期限切れ" tasks={overdue} showCreatedColumn showPlannedColumn showTypeColumn enableSelection enableBulkDueUpdate />
    </div>
  );
}


