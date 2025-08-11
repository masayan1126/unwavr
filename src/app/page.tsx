"use client";
import Link from "next/link";
import { useMemo } from "react";
import TaskList from "@/components/TaskList";
import { useAppStore } from "@/lib/store";
import { isTaskForToday } from "@/lib/types";
import WeatherWidget from "@/components/WeatherWidget";
import { Plus, Target, Timer, Rocket, Upload } from "lucide-react";

export default function Home() {
  const tasks = useAppStore((s) => s.tasks);
  const tasksForToday = useMemo(() => tasks.filter((t) => isTaskForToday(t)), [tasks]);
  const backlog = useMemo(() => tasks.filter((t) => t.type === "backlog"), [tasks]);
  const weekendTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.type === "scheduled" &&
          (t.scheduled?.daysOfWeek?.some((d) => d === 0 || d === 6) || (t.scheduled?.dateRanges?.length ?? 0) > 0)
      ),
    [tasks]
  );
  return (
    <div className="min-h-screen p-6 sm:p-10 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ダッシュボード</h1>
        <div className="flex items-center gap-4">
          <Link href="/unwavr" className="text-sm underline opacity-80">プロダクトサイト</Link>
          <span className="text-sm">{new Date().toLocaleDateString()}</span>
          <WeatherWidget variant="large" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded p-4 border-black/10 dark:border-white/10">
          <div className="text-sm font-medium mb-2">今日のタスク</div>
          <TaskList title="今日" tasks={tasksForToday.slice(0, 5)} />
          <div className="mt-2 text-right">
            <Link className="text-sm underline opacity-80" href="/today">すべて見る</Link>
          </div>
        </div>
        <div className="border rounded p-4 border-black/10 dark:border-white/10">
          <div className="text-sm font-medium mb-2">バックログ</div>
          <TaskList title="バックログ" tasks={backlog.slice(0, 5)} />
          <div className="mt-2 text-right">
            <Link className="text-sm underline opacity-80" href="/backlog">すべて見る</Link>
          </div>
        </div>
        <div className="border rounded p-4 border-black/10 dark:border-white/10">
          <div className="text-sm font-medium mb-2">週末・連休</div>
          <TaskList title="週末・連休" tasks={weekendTasks.slice(0, 5)} />
          <div className="mt-2 text-right">
            <Link className="text-sm underline opacity-80" href="/weekend">すべて見る</Link>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="border rounded p-4 border-black/10 dark:border-white/10 flex flex-col gap-2">
          <div className="text-sm font-medium">クイックアクション</div>
          <div className="flex gap-2 flex-wrap">
            <Link className="px-3 py-1 rounded border text-sm flex items-center gap-2" href="/tasks/new">
              <Plus size={16} />
              タスク追加
            </Link>
            <Link className="px-3 py-1 rounded border text-sm flex items-center gap-2" href="/milestones">
              <Target size={16} />
              マイルストーン
            </Link>
            <Link className="px-3 py-1 rounded border text-sm flex items-center gap-2" href="/pomodoro">
              <Timer size={16} />
              ポモドーロ
            </Link>
            <Link className="px-3 py-1 rounded border text-sm flex items-center gap-2" href="/launcher">
              <Rocket size={16} />
              ランチャー
            </Link>
            <Link className="px-3 py-1 rounded border text-sm flex items-center gap-2" href="/tasks/import-export">
              <Upload size={16} />
              インポート/エクスポート
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
