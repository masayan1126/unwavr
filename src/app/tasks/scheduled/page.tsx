"use client";
import { RefreshCw } from "lucide-react";
import AddTaskButton from "@/components/AddTaskButton";
import TaskList from "@/components/TaskList";
import TaskDialog from "@/components/TaskCreateDialog";
import TaskForm from "@/components/TaskForm";
import { useState } from "react";
import { useScheduledTasks } from "@/hooks/useScheduledTasks";
import { Select } from "@/components/ui/Select";
import FilterBar from "@/components/FilterBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { PageLayout, PageHeader } from "@/components/ui/PageLayout";

export default function ScheduledTasksPage() {
  const {
    hydrating,
    pageItems,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    sortKey,
    setSortKey,
    sortAsc,
    setSortAsc,
    filterStatus,
    setFilterStatus,
  } = useScheduledTasks();
  const [openCreate, setOpenCreate] = useState(false);

  return (
    <PageLayout>
      <PageHeader
        title="特定曜日"
        actions={
          <>
            <AddTaskButton onClick={() => setOpenCreate(true)} />
            <IconButton
              icon={<RefreshCw size={14} />}
              onClick={() => window.location.reload()}
              label="再読み込み"
              variant="outline"
              className="rounded-full"
            />
          </>
        }
      />
      {(
        <>
          <div className="mb-4 px-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs opacity-70">{hydrating ? "-" : `${page} / ${totalPages}（全 ${total} 件）`}</div>
              <FilterBar className="w-full sm:w-auto">
                <Select
                  size="sm"
                  value={sortKey}
                  onChange={(v) => setSortKey(v as "title" | "createdAt" | "scheduled" | "type" | "milestone")}
                  options={[
                    { value: "createdAt", label: "日付" },
                    { value: "title", label: "タイトル" },
                    { value: "scheduled", label: "設定（曜日/期間）" },
                    { value: "type", label: "種別" },
                    { value: "milestone", label: "マイルストーン" },
                  ]}
                />
                <Button variant="secondary" size="sm" onClick={() => setSortAsc((v) => !v)}>
                  {sortAsc ? "昇順" : "降順"}
                </Button>
                <Select
                  label="ステータス"
                  size="sm"
                  value={filterStatus}
                  onChange={(v) => {
                    setFilterStatus(v as "all" | "completed" | "incomplete");
                    setPage(1);
                  }}
                  options={[
                    { value: "all", label: "すべて" },
                    { value: "incomplete", label: "未完了" },
                    { value: "completed", label: "完了" },
                  ]}
                />
                <Select
                  label="1ページあたり"
                  size="sm"
                  value={pageSize}
                  onChange={(v) => {
                    setPageSize(Number(v));
                    setPage(1);
                  }}
                  options={[10, 20, 50, 100].map((n) => ({ value: n, label: String(n) }))}
                />
                <div className="flex items-center gap-2 ml-auto">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    前へ
                  </Button>
                  <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    次へ
                  </Button>
                </div>
              </FilterBar>
            </div>
          </div>
          <Card padding="md">
            {hydrating ? (
              <div className="space-y-2">
                <div className="text-sm font-medium mb-4">特定曜日</div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <TaskList title="特定曜日" tasks={pageItems} showCreatedColumn={false} showPlannedColumn={false} showScheduledColumn showTypeColumn showMilestoneColumn={false} sortKey={sortKey} sortAsc={sortAsc} filterStatus={filterStatus} enableSelection />
            )}
          </Card>
        </>
      )}
      <TaskDialog open={openCreate} onClose={() => setOpenCreate(false)} title="新規">
        <TaskForm defaultType="scheduled" onSubmitted={(mode) => { if (mode === 'close') setOpenCreate(false); }} />
      </TaskDialog>
    </PageLayout>
  );
}


