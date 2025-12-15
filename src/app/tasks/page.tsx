"use client";
import { Suspense, useState } from "react";
import { Search, RefreshCw, SlidersHorizontal } from "lucide-react";
import TaskList from "@/components/TaskList";
import TaskDialog from "@/components/TaskCreateDialog";
import AddTaskButton from "@/components/AddTaskButton";
import TaskForm from "@/components/TaskForm";
import AdvancedSearchDialog from "@/components/AdvancedSearchDialog";
import { useTasksPage } from "@/hooks/useTasksPage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
    milestoneFilter,
    setMilestoneFilter,
    openCreate,
    setOpenCreate,
    filteredTasks,
    taskCounts,
    baseFiltered,
  } = useTasksPage();

  const [openAdvancedSearch, setOpenAdvancedSearch] = useState(false);

  // フィルターがアクティブかどうか
  const isFilterActive = milestoneFilter !== "all";

  const typeLabels: Record<TaskType | "all", string> = {
    all: "すべて",
    daily: "毎日",
    backlog: "積み上げ候補",
    scheduled: "特定曜日"
  };

  return (
    <PullToRefresh>
      <PageLayout className="pb-24 sm:pb-10">
        <PageHeader title="すべてのタスク" />

        {/* フィルター・検索・アクション */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {(["all", "daily", "scheduled", "backlog"] as const).map(type => (
              <Button
                key={type}
                onClick={() => setSelectedType(type)}
                variant={selectedType === type ? "primary" : "outline"}
                size="sm"
                className={`whitespace-nowrap ${selectedType === type ? "" : "border-black/10 dark:border-white/10"}`}
              >
                {hydrating ? typeLabels[type] : `${typeLabels[type]} (${taskCounts[type]})`}
              </Button>
            ))}
          </div>

          <div className="flex-1 min-w-[200px] max-w-md flex gap-2">
            <Input
              type="text"
              placeholder="タスクを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              iconLeft={<Search size={14} />}
            />
            <IconButton
              icon={<SlidersHorizontal size={14} />}
              onClick={() => setOpenAdvancedSearch(true)}
              label="詳細検索"
              variant={isFilterActive ? "solid" : "outline"}
              className={`rounded-full shrink-0 ${isFilterActive ? "bg-primary text-primary-foreground" : "border-black/10 dark:border-white/10"}`}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <IconButton
              icon={<RefreshCw size={14} />}
              onClick={() => window.location.reload()}
              label="再読み込み"
              variant="outline"
              className="rounded-full"
            />
            <AddTaskButton onClick={() => setOpenCreate(true)} />
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card padding="sm">
            <div className="text-sm opacity-60">総タスク数</div>
            <div className="text-lg font-semibold">{hydrating ? <span className="inline-block h-6 w-8 bg-muted animate-pulse rounded" /> : taskCounts.all}</div>
          </Card>
          <Card padding="sm">
            <div className="text-sm opacity-60">毎日タスク</div>
            <div className="text-lg font-semibold">{hydrating ? <span className="inline-block h-6 w-8 bg-muted animate-pulse rounded" /> : taskCounts.daily}</div>
          </Card>
          <Card padding="sm">
            <div className="text-sm opacity-60">特定日タスク</div>
            <div className="text-lg font-semibold">{hydrating ? <span className="inline-block h-6 w-8 bg-muted animate-pulse rounded" /> : taskCounts.scheduled}</div>
          </Card>
          <Card padding="sm">
            <div className="text-sm opacity-60">積み上げ候補</div>
            <div className="text-lg font-semibold">{hydrating ? <span className="inline-block h-6 w-8 bg-muted animate-pulse rounded" /> : taskCounts.backlog}</div>
          </Card>
        </div>

        {/* タスク一覧 */}
        <div className="space-y-6">
          {hydrating ? (
            <>
              <Card padding="md">
                <div className="text-sm font-medium mb-4">毎日タスク</div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              </Card>
              <Card padding="md">
                <div className="text-sm font-medium mb-4">特定曜日</div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              </Card>
              <Card padding="md">
                <div className="text-sm font-medium mb-4">積み上げ候補</div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              </Card>
            </>
          ) : selectedType === "all" ? (
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
                  tasks={baseFiltered.filter(t => t.type === "backlog" && !t.completed)}
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

        <AdvancedSearchDialog
          isOpen={openAdvancedSearch}
          onClose={() => setOpenAdvancedSearch(false)}
          milestoneFilter={milestoneFilter}
          onMilestoneFilterChange={setMilestoneFilter}
        />
      </PageLayout>
    </PullToRefresh>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksPageInner />
    </Suspense>
  );
}
