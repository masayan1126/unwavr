"use client";
import { Suspense } from "react";
import Link from "next/link";
import { Search, RefreshCw, Home } from "lucide-react";
import TaskList from "@/components/TaskList";
import TaskDialog from "@/components/TaskCreateDialog";
import AddTaskButton from "@/components/AddTaskButton";
import TaskForm from "@/components/TaskForm";
import TasksPageSkeleton from "@/components/TasksPageSkeleton";
import { useTasksPage } from "@/hooks/useTasksPage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { H1 } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { PageLayout, PageHeader } from "@/components/ui/PageLayout";
import { TaskType } from "@/lib/types";
import PullToRefresh from "@/components/PullToRefresh";

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
    <PullToRefresh>
      <PageLayout className="pb-24 sm:pb-10">
        <PageHeader
          title="すべてのタスク"
          actions={
            <>
              <IconButton
                icon={<RefreshCw size={14} />}
                onClick={() => window.location.reload()}
                label="再読み込み"
                variant="outline"
                className="rounded-full"
              />
              <AddTaskButton onClick={() => setOpenCreate(true)} />
              <Link className="flex items-center gap-1 text-sm opacity-80 hover:opacity-100" href="/" title="ホーム">
                <Home size={16} />
                <span className="hidden md:inline underline">ホーム</span>
              </Link>
            </>
          }
        />

        {/* フィルターと検索 */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 sm:mx-0 sm:px-0 scrollbar-hide w-full sm:w-auto">
            {(["all", "daily", "scheduled", "backlog"] as const).map(type => (
              <Button
                key={type}
                onClick={() => setSelectedType(type)}
                variant={selectedType === type ? "primary" : "outline"}
                size="sm"
                className={`whitespace-nowrap ${selectedType === type ? "" : "border-black/10 dark:border-white/10"}`}
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
          <Card padding="sm">
            <div className="text-sm opacity-60">総タスク数</div>
            <div className="text-lg font-semibold">{taskCounts.all}</div>
          </Card>
          <Card padding="sm">
            <div className="text-sm opacity-60">毎日タスク</div>
            <div className="text-lg font-semibold">{taskCounts.daily}</div>
          </Card>
          <Card padding="sm">
            <div className="text-sm opacity-60">特定日タスク</div>
            <div className="text-lg font-semibold">{taskCounts.scheduled}</div>
          </Card>
          <Card padding="sm">
            <div className="text-sm opacity-60">積み上げ候補</div>
            <div className="text-lg font-semibold">{taskCounts.backlog}</div>
          </Card>
        </div>

        {/* タスク一覧 */}
        <div className="space-y-6">
          {selectedType === "all" ? (
            <>
              <Card padding="md">
                <TaskList
                  title={`毎日タスク (${taskCounts.daily})`}
                  tasks={baseFiltered.filter(t => t.type === "daily")}
                  showPlannedColumn={false}
                  showTypeColumn
                  showMilestoneColumn={false}
                />
              </Card>
              <Card padding="md">
                <TaskList
                  title={`特定曜日 (${taskCounts.scheduled})`}
                  tasks={baseFiltered.filter(t => t.type === "scheduled")}
                  showScheduledColumn
                  showTypeColumn
                  showMilestoneColumn={false}
                />
              </Card>
              <Card padding="md">
                <TaskList
                  title={`積み上げ候補 (${taskCounts.backlog})`}
                  tasks={baseFiltered.filter(t => t.type === "backlog")}
                  showPlannedColumn
                  showTypeColumn
                  showMilestoneColumn={false}
                />
              </Card>
            </>
          ) : (
            <Card padding="md">
              <TaskList
                title={`${typeLabels[selectedType]} (${filteredTasks.length})`}
                tasks={filteredTasks}
                showPlannedColumn={selectedType === "backlog"}
                showScheduledColumn={selectedType === "scheduled"}
                showTypeColumn
                showMilestoneColumn={false}
              />
            </Card>
          )}
        </div>

        <TaskDialog open={openCreate} onClose={() => setOpenCreate(false)} title="新規タスク">
          <TaskForm onSubmitted={(mode) => { if (mode === 'close') setOpenCreate(false); }} />
        </TaskDialog>
      </PageLayout>
    </PullToRefresh>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksPageSkeleton />}>
      <TasksPageInner />
    </Suspense>
  );
}
