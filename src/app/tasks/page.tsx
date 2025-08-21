"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import TaskList from "@/components/TaskList";
import { useAppStore } from "@/lib/store";
import { TaskType } from "@/lib/types";
import SectionLoader from "@/components/SectionLoader";

export default function TasksPage() {
  const tasks = useAppStore((s) => s.tasks);
  const hydrating = useAppStore((s) => s.hydrating);
  const [selectedType, setSelectedType] = useState<TaskType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // タイプでフィルタリング
    if (selectedType !== "all") {
      filtered = filtered.filter(task => task.type === selectedType);
    }

    // 検索クエリでフィルタリング
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [tasks, selectedType, searchQuery]);

  const taskCounts = useMemo(() => {
    const counts = {
      all: tasks.length,
      daily: tasks.filter(t => t.type === "daily").length,
      backlog: tasks.filter(t => t.type === "backlog").length,
      scheduled: tasks.filter(t => t.type === "scheduled").length,
    };
    return counts;
  }, [tasks]);

  const typeLabels: Record<TaskType | "all", string> = {
    all: "すべて",
    daily: "毎日",
    backlog: "バックログ",
    scheduled: "特定の日・曜日"
  };

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">タスク管理</h1>
        <div className="flex items-center gap-4">
          <Link href="/tasks/new" className="px-3 py-1.5 rounded border text-sm flex items-center gap-2">
            <span>タスク追加</span>
          </Link>
          <Link className="text-sm underline opacity-80" href="/">
            ホーム
          </Link>
        </div>
      </div>

      {/* フィルターと検索 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex gap-2">
          {(["all", "daily", "backlog", "scheduled"] as const).map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded border text-sm ${
                selectedType === type
                  ? "bg-blue-500 text-white border-blue-500"
                  : "border-black/10 dark:border-white/10"
              }`}
            >
              {typeLabels[type]} ({taskCounts[type]})
            </button>
          ))}
        </div>
        
        <div className="flex-1 sm:max-w-md">
          <input
            type="text"
            placeholder="タスクを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-black/10 dark:border-white/10 rounded px-3 py-2 bg-transparent"
          />
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="border rounded p-3 border-black/10 dark:border-white/10">
          <div className="text-sm opacity-60">総タスク数</div>
          <div className="text-lg font-semibold">{taskCounts.all}</div>
        </div>
        <div className="border rounded p-3 border-black/10 dark:border-white/10">
          <div className="text-sm opacity-60">毎日タスク</div>
          <div className="text-lg font-semibold">{taskCounts.daily}</div>
        </div>
        <div className="border rounded p-3 border-black/10 dark:border-white/10">
          <div className="text-sm opacity-60">バックログ</div>
          <div className="text-lg font-semibold">{taskCounts.backlog}</div>
        </div>
        <div className="border rounded p-3 border-black/10 dark:border-white/10">
          <div className="text-sm opacity-60">特定日タスク</div>
          <div className="text-lg font-semibold">{taskCounts.scheduled}</div>
        </div>
      </div>

      {/* タスク一覧 */}
      <div className="space-y-6">
        {hydrating ? (
          <SectionLoader label="タスクを読み込み中..." lines={6} />
        ) : selectedType === "all" ? (
          <>
            <TaskList 
              title={`毎日タスク (${taskCounts.daily})`} 
              tasks={filteredTasks.filter(t => t.type === "daily")} 
              showType 
              tableMode 
              showCreatedColumn 
              showPlannedColumn={false}
              showTypeColumn
              showMilestoneColumn={false}
            />
            <TaskList 
              title={`バックログ (${taskCounts.backlog})`} 
              tasks={filteredTasks.filter(t => t.type === "backlog")} 
              showType 
              tableMode 
              showCreatedColumn 
              showPlannedColumn
              showTypeColumn
              showMilestoneColumn={false}
            />
            <TaskList 
              title={`特定の日・曜日 (${taskCounts.scheduled})`} 
              tasks={filteredTasks.filter(t => t.type === "scheduled")} 
              showType 
              tableMode 
              showCreatedColumn 
              showScheduledColumn
              showTypeColumn
              showMilestoneColumn={false}
            />
          </>
        ) : (
          <TaskList 
            title={`${typeLabels[selectedType]} (${filteredTasks.length})`} 
            tasks={filteredTasks} 
            showType 
            tableMode 
            showCreatedColumn 
            showPlannedColumn={selectedType === "backlog"}
            showScheduledColumn={selectedType === "scheduled"}
            showTypeColumn
            showMilestoneColumn={false}
          />
        )}
      </div>

      {/* 新規タスク作成へのリンク */}
      <div className="text-center">
        <Link 
          href="/tasks/new" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          新しいタスクを作成
        </Link>
      </div>
    </div>
  );
}
