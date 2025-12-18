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
        <PageHeader
          title={
            <div className="flex items-baseline gap-2">
              <span>すべてのタスク</span>
              <span className="text-sm font-normal text-muted-foreground">
                (全{hydrating ? "-" : taskCounts.all}件)
              </span>
            </div>
          }
          // 更新ボタンはタイトル横に配置（データの鮮度を保つ操作として、タイトルに紐づくメタ操作の位置づけ）
          actions={
            <IconButton
              icon={<RefreshCw size={14} />}
              onClick={() => window.location.reload()}
              label="再読み込み"
              variant="ghost"
              className="rounded-full hover:bg-muted"
            />
          }
        />

        <div className="space-y-4">
          {/* 1. 検索 & アクションエリア */}
          {/* 最も頻度の高い「検索」と「新規作成」を最上部に配置 */}
          <div className="flex gap-2 items-center">
            <div className="flex-1 flex gap-2">
              <Input
                type="text"
                placeholder="タスクを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                iconLeft={<Search size={14} />}
                wrapperClassName="flex-1"
              />
              <IconButton
                icon={<SlidersHorizontal size={14} />}
                onClick={() => setOpenAdvancedSearch(true)}
                label="詳細検索"
                variant={isFilterActive ? "solid" : "outline"}
                className={`rounded-md shrink-0 ${isFilterActive ? "bg-primary text-primary-foreground" : "border-input"}`}
              />
            </div>
            
            {/* 新規追加ボタンを目立つ位置に */}
            <AddTaskButton 
              onClick={() => setOpenCreate(true)} 
              className="shrink-0"
            />
          </div>

          {/* 2. フィルターエリア */}
          {/* 表示内容の切り替えを行うタブ。検索の下に配置して階層構造を作る */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {(["all", "daily", "scheduled", "backlog"] as const).map(type => (
              <Button
                key={type}
                onClick={() => setSelectedType(type)}
                variant={selectedType === type ? "primary" : "outline"}
                size="sm"
                className={`whitespace-nowrap rounded-full px-4 ${selectedType === type ? "" : "border-black/10 dark:border-white/10 text-muted-foreground hover:text-foreground"}`}
              >
                {hydrating ? typeLabels[type] : `${typeLabels[type]} (${taskCounts[type]})`}
              </Button>
            ))}
          </div>

          {/* 4. タスク一覧 */}
          {/* 複数選択ボタンは TaskList コンポーネント内のヘッダー（テーブル直上）に配置される */}
          <div className="space-y-6">
            {hydrating ? (
              <>
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/60">
                    <div className="text-sm font-semibold">毎日タスク</div>
                  </div>
                  <div className="space-y-2 p-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/60">
                    <div className="text-sm font-semibold">特定曜日</div>
                  </div>
                  <div className="space-y-2 p-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/60">
                    <div className="text-sm font-semibold">積み上げ候補</div>
                  </div>
                  <div className="space-y-2 p-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                </div>
              </>
            ) : selectedType === "all" ? (
              <>
                <TaskList
                  title={`毎日タスク (${taskCounts.daily})`}
                  tasks={baseFiltered.filter(t => t.type === "daily")}
                  showPlannedColumn={false}
                  showTypeColumn
                  showMilestoneColumn={false}
                  enableSelection
                />
                <TaskList
                  title={`特定曜日 (${taskCounts.scheduled})`}
                  tasks={baseFiltered.filter(t => t.type === "scheduled")}
                  showScheduledColumn
                  showTypeColumn
                  showMilestoneColumn={false}
                  enableSelection
                />
                <TaskList
                  title={`積み上げ候補 (${taskCounts.backlog})`}
                  tasks={baseFiltered.filter(t => t.type === "backlog" && !t.completed)}
                  showPlannedColumn
                  showTypeColumn
                  showMilestoneColumn={false}
                  enableSelection
                />
              </>
            ) : (
              <TaskList
                title={`${typeLabels[selectedType]} (${filteredTasks.length})`}
                tasks={filteredTasks}
                showPlannedColumn={selectedType === "backlog"}
                showScheduledColumn={selectedType === "scheduled"}
                showTypeColumn
                showMilestoneColumn={false}
                enableSelection
              />
            )}
          </div>
        </div>

        <TaskDialog open={openCreate} onClose={() => setOpenCreate(false)} title="新規">
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
