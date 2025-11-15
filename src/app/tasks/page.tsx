"use client";
import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import TaskList from "@/components/TaskList";
import TaskDialog from "@/components/TaskCreateDialog";
import PrimaryButton from "@/components/PrimaryButton";
import TaskForm from "@/components/TaskForm";
import { useAppStore } from "@/lib/store";
import { TaskType } from "@/lib/types";
import TasksPageSkeleton from "@/components/TasksPageSkeleton";
import TaskCreateDialog from "@/components/TaskCreateDialog";
import { isOverdue } from "@/lib/taskUtils";

function TasksPageInner() {
  const tasks = useAppStore((s) => s.tasks);
  const hydrating = useAppStore((s) => s.hydrating);
  const [selectedType, setSelectedType] = useState<TaskType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();
  const [openCreate, setOpenCreate] = useState(false);

  useEffect(() => {
    if (searchParams.get("new") === "1") setOpenCreate(true);
  }, [searchParams]);

  function isDailyDoneToday(dailyDoneDates?: number[]): boolean {
    const now = new Date();
    const local = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const utc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return Boolean(dailyDoneDates && (dailyDoneDates.includes(local) || dailyDoneDates.includes(utc)));
  }

  function isBacklogPlannedToday(plannedDates?: number[]): boolean {
    if (!plannedDates || plannedDates.length === 0) return false;
    const now = new Date();
    const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    if (plannedDates.includes(localMidnight) || plannedDates.includes(utcMidnight)) return true;
    return plannedDates.some((rawTs) => {
      const tsMs = rawTs < 1e12 ? rawTs * 1000 : rawTs;
      const dt = new Date(tsMs);
      return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth() && dt.getDate() === now.getDate();
    });
  }

  function isScheduledForToday(days?: number[], ranges?: { start: number; end: number }[]): boolean {
    const now = new Date();
    const dow = now.getDay();
    const inDays = Boolean(days && days.includes(dow));
    const t = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const inRanges = Boolean(ranges && ranges.some((r) => t >= r.start && t <= r.end));
    return inDays || inRanges;
  }

  // 現在の検索/クエリパラメータに基づく共通フィルタ（タイプは絞り込まない）
  const baseFiltered = useMemo(() => {
    const dailyFlag = searchParams.get("daily") === "1";
    const backlogTodayFlag = searchParams.get("backlogToday") === "1";
    const scheduledTodayFlag = searchParams.get("scheduledToday") === "1";
    const overdueFlag = searchParams.get("overdue") === "1";
    const onlyIncomplete = searchParams.get("onlyIncomplete") === "1";

    let filtered = tasks.filter((task) => {
      if (dailyFlag || backlogTodayFlag || scheduledTodayFlag || overdueFlag) {
        if (onlyIncomplete) {
          if (task.type === "daily") {
            if (isDailyDoneToday(task.dailyDoneDates)) return false;
          } else {
            if (task.completed) return false;
          }
        }
        const now = new Date();
        const todayLocalMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        if (overdueFlag && isOverdue(task, todayLocalMidnight)) return true;
        if (dailyFlag && task.type === "daily") return true;
        if (backlogTodayFlag && task.type === "backlog" && isBacklogPlannedToday(task.plannedDates)) return true;
        if (scheduledTodayFlag && task.type === "scheduled" && isScheduledForToday(task.scheduled?.daysOfWeek, task.scheduled?.dateRanges)) return true;
        return false;
      }
      // パラメータ指定が無ければ全件（タイプ未絞り込み）
      return true;
    });

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((task) =>
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }
    return filtered;
  }, [tasks, searchQuery, searchParams]);

  // 表示中のタスクリスト（選択タイプを反映）
  const filteredTasks = useMemo(() => {
    if (selectedType === "all") return baseFiltered;
    return baseFiltered.filter((t) => t.type === selectedType);
  }, [baseFiltered, selectedType]);

  // 画面上の件数（現在の検索/条件に合わせた件数）
  const taskCounts = useMemo(() => {
    return {
      all: baseFiltered.length,
      daily: baseFiltered.filter(t => t.type === "daily").length,
      backlog: baseFiltered.filter(t => t.type === "backlog").length,
      scheduled: baseFiltered.filter(t => t.type === "scheduled").length,
    };
  }, [baseFiltered]);

  const typeLabels: Record<TaskType | "all", string> = {
    all: "すべて",
    daily: "毎日",
    backlog: "積み上げ候補",
    scheduled: "特定曜日"
  };

  if (hydrating) {
    return <TasksPageSkeleton />;
  }

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto flex flex-col gap-6">
      <header className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">今日のタスク</h1>
          <div className="flex items-center gap-4">
            <PrimaryButton
              onClick={() => setOpenCreate(true)}
              label="タスク追加"
              iconLeft={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>}
            />
            <Link className="text-sm underline opacity-80" href="/">
              ホーム
            </Link>
          </div>
        </div>
      </header>

      {/* フィルターと検索 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex gap-2">
          {(["all", "daily", "backlog", "scheduled"] as const).map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded border text-sm ${
                selectedType === type
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
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
          <div className="text-sm opacity-60">積み上げ候補</div>
          <div className="text-lg font-semibold">{taskCounts.backlog}</div>
        </div>
        <div className="border rounded p-3 border-black/10 dark:border-white/10">
          <div className="text-sm opacity-60">特定日タスク</div>
          <div className="text-lg font-semibold">{taskCounts.scheduled}</div>
        </div>
      </div>

      {/* タスク一覧 */}
      <div className="space-y-6">
        {selectedType === "all" ? (
          <>
            <TaskList 
              title={`毎日タスク (${taskCounts.daily})`} 
              tasks={baseFiltered.filter(t => t.type === "daily")} 
              showType 
              tableMode 
              showPlannedColumn={false}
              showTypeColumn
              showMilestoneColumn={false}
            />
            <TaskList 
              title={`積み上げ候補 (${taskCounts.backlog})`} 
              tasks={baseFiltered.filter(t => t.type === "backlog")} 
              showType 
              tableMode 
              showPlannedColumn
              showTypeColumn
              showMilestoneColumn={false}
            />
            <TaskList 
              title={`特定曜日 (${taskCounts.scheduled})`} 
              tasks={baseFiltered.filter(t => t.type === "scheduled")} 
              showType 
              tableMode 
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
            showPlannedColumn={selectedType === "backlog"}
            showScheduledColumn={selectedType === "scheduled"}
            showTypeColumn
            showMilestoneColumn={false}
          />
        )}
      </div>

      <TaskDialog open={openCreate} onClose={()=>setOpenCreate(false)} title="新規タスク">
        <TaskForm onSubmitted={(mode)=>{ if (mode==='close') setOpenCreate(false); }} />
      </TaskDialog>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksPageSkeleton />}>
      <TasksPageInner />
    </Suspense>
  );
}
