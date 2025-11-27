"use client";
import { Suspense } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import TaskList from "@/components/TaskList";
import TaskDialog from "@/components/TaskCreateDialog";
import AddTaskButton from "@/components/AddTaskButton";
import TaskForm from "@/components/TaskForm";
import TasksPageSkeleton from "@/components/TasksPageSkeleton";
import { useTasksPage } from "@/hooks/useTasksPage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { H1 } from "@/components/ui/Typography";
import { TaskType } from "@/lib/types";

function TasksPageInner() {
  const {
    hydrating,
    selectedType,
    setSelectedType,
    searchQuery,
    setSearchQuery,
    openCreate,
    setOpenCreate,
    filteredTasks,
    taskCounts,
    baseFiltered,
  } = useTasksPage();

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
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <H1>今日のタスク</H1>
          <div className="flex items-center gap-4">
            <AddTaskButton
              onClick={() => setOpenCreate(true)}
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
            <Button
              key={type}
              onClick={() => setSelectedType(type)}
              variant={selectedType === type ? "primary" : "outline"}
              size="sm"
              className={selectedType === type ? "" : "border-black/10 dark:border-white/10"}
            >
              {typeLabels[type]} ({taskCounts[type]})
            </Button>
          ))}
        </div>

        <div className="flex-1 sm:max-w-md">
          <Input
            type="text"
            placeholder="タスクを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            iconLeft={<Search size={14} />}
          />
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[var(--sidebar)] rounded-xl p-4 shadow-sm">
          <div className="text-sm opacity-60">総タスク数</div>
          <div className="text-lg font-semibold">{taskCounts.all}</div>
        </div>
        <div className="bg-[var(--sidebar)] rounded-xl p-4 shadow-sm">
          <div className="text-sm opacity-60">毎日タスク</div>
          <div className="text-lg font-semibold">{taskCounts.daily}</div>
        </div>
        <div className="bg-[var(--sidebar)] rounded-xl p-4 shadow-sm">
          <div className="text-sm opacity-60">積み上げ候補</div>
          <div className="text-lg font-semibold">{taskCounts.backlog}</div>
        </div>
        <div className="bg-[var(--sidebar)] rounded-xl p-4 shadow-sm">
          <div className="text-sm opacity-60">特定日タスク</div>
          <div className="text-lg font-semibold">{taskCounts.scheduled}</div>
        </div>
      </div>

      {/* タスク一覧 */}
      <div className="space-y-6">
        {selectedType === "all" ? (
          <>
            <section className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm">
              <TaskList
                title={`毎日タスク (${taskCounts.daily})`}
                tasks={baseFiltered.filter(t => t.type === "daily")}
                showType
                tableMode
                showPlannedColumn={false}
                showTypeColumn
                showMilestoneColumn={false}
              />
            </section>
            <section className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm">
              <TaskList
                title={`積み上げ候補 (${taskCounts.backlog})`}
                tasks={baseFiltered.filter(t => t.type === "backlog")}
                showType
                tableMode
                showPlannedColumn
                showTypeColumn
                showMilestoneColumn={false}
              />
            </section>
            <section className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm">
              <TaskList
                title={`特定曜日 (${taskCounts.scheduled})`}
                tasks={baseFiltered.filter(t => t.type === "scheduled")}
                showType
                tableMode
                showScheduledColumn
                showTypeColumn
                showMilestoneColumn={false}
              />
            </section>
          </>
        ) : (
          <section className="bg-[var(--sidebar)] rounded-xl p-5 shadow-sm">
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
          </section>
        )}
      </div>

      <TaskDialog open={openCreate} onClose={() => setOpenCreate(false)} title="新規タスク">
        <TaskForm onSubmitted={(mode) => { if (mode === 'close') setOpenCreate(false); }} />
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
